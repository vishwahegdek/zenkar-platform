
import { Injectable } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { PrismaService } from '../prisma/prisma.service';
import { ImagesService } from '../images/images.service';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private imagesService: ImagesService
  ) {}

  async uploadImage(itemId: number, file: Express.Multer.File) {
    return this.imagesService.processAndUpload(file.buffer, file.originalname, { orderItemId: itemId });
  }

  async create(createOrderDto: CreateOrderDto) {
    const { items, customerName, customerPhone, customerAddress, orderDate, dueDate, ...rest } = createOrderDto;
    let orderData: any = { ...rest };
    if (orderDate) orderData.orderDate = new Date(orderDate);
    if (dueDate) orderData.dueDate = new Date(dueDate);

    return this.prisma.$transaction(async (tx) => {
      // 1. Handle New Customer Creation
      if (createOrderDto.customerId === 0 && customerName) {
        const newCustomer = await tx.customer.create({
          data: {
            name: customerName,
            phone: customerPhone,
            address: customerAddress,
          },
        });
        orderData.customerId = newCustomer.id;
      }

      // 2. Process Items (Create new products if needed)
      const processedItems = await this.processItems(items, tx);

      // 3. Create Order
      const order = await tx.order.create({
        data: {
          ...orderData,
          items: {
            create: processedItems.map((item) => ({
              productId: item.productId,
              productName: item.productName,
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              lineTotal: item.lineTotal,
            })),
          },
        },
        include: { items: true },
      });
      return order;
    });
  }

  // Helper handling new product creation
  private async processItems(items: any[], tx: any) {
    const processed: any[] = [];
    for (const item of items) {
      let productId = item.productId;
      const productName = item.productName;

      // If no ID but has name, find or create product
      if (!productId && productName) {
        // Check if exists by name (case-insensitive search could be better, but exact for now)
        const existing = await tx.product.findFirst({
           where: { name: { equals: productName, mode: 'insensitive' } }
        });

        if (existing) {
          productId = existing.id;
        } else {
          // Create new product
          const newProduct = await tx.product.create({
            data: {
              name: productName,
              defaultUnitPrice: item.unitPrice || 0,
              notes: item.description || null, // Map item description to product notes
            }
          });
          productId = newProduct.id;
        }
      }
      processed.push({ ...item, productId });
    }
    return processed;
  }

  findAll(view?: string) {
    const isHistory = view === 'history';
    const statusFilter = isHistory 
      ? { in: ['closed', 'cancelled'] } 
      : { notIn: ['closed', 'cancelled'] };

    return this.prisma.order.findMany({
      where: { 
        isDeleted: false,
        status: statusFilter
      },
      include: { 
        customer: true, 
        items: {
          include: { images: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }).then(orders => orders.map(order => ({
      ...order,
      remainingBalance: Number(order.totalAmount) - Number(order.advanceAmount)
    })));
  }

  async findOne(id: number) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { 
        customer: true, 
        items: {
          include: { images: true }
        }
      },
    });
    
    if (order) {
      return {
        ...order,
        remainingBalance: Number(order.totalAmount) - Number(order.advanceAmount)
      };
    }
    return null;
  }

  async update(id: number, dto: UpdateOrderDto) {
    const { items, customerId, customerName, customerPhone, customerAddress, ...orderData } = dto;

    return this.prisma.$transaction(async (tx) => {
      // 1. Update Order details
      await tx.order.update({
        where: { id },
        data: {
          ...orderData,
          customer: customerId ? { connect: { id: customerId } } : undefined,
        },
      });

      // 2. If items provided, replace them (delete all + create new)
      if (items) {
        await tx.orderItem.deleteMany({ where: { orderId: id } });

        if (items.length > 0) {
          const processedItems = await this.processItems(items, tx);
          
          await tx.orderItem.createMany({
            data: processedItems.map((item) => ({
              orderId: id,
              productId: item.productId,
              productName: item.productName,
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              lineTotal: item.lineTotal,
            })),
          });
        }
      }

      return tx.order.findUnique({ 
        where: { id }, 
        include: { 
          items: {
            include: { images: true }
          }, 
          customer: true 
        } 
      });
    });
  }

  remove(id: number) {
    return this.prisma.order.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date() },
    });
  }
}
