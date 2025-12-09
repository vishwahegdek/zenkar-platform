import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrdersService implements OnModuleInit {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private prisma: PrismaService
  ) {}

  async onModuleInit() {
    await this.migrateAdvanceToPayments();
  }

  private async migrateAdvanceToPayments() {
    // Find orders with advanceAmount > 0 and NO payments
    const ordersToMigrate = await this.prisma.order.findMany({
      where: {
        AND: [
          { advanceAmount: { gt: 0 } },
          { payments: { none: {} } }
        ]
      }
    });

    if (ordersToMigrate.length > 0) {
      this.logger.log(`Migrating ${ordersToMigrate.length} orders with legacy advanceAmount...`);
      for (const order of ordersToMigrate) {
        await this.prisma.$transaction([
          this.prisma.payment.create({
            data: {
              orderId: order.id,
              amount: order.advanceAmount,
              date: order.createdAt, // Use creation date for initial advance
              note: 'Migrated Advance'
            }
          }),
          // Optional: Zero out advanceAmount? 
          // For safety, we can keep it for now but key logic off payments.
          // Or zero it to avoid double counting if logic sums both.
          // Let's zero it to enforce single source of truth.
          this.prisma.order.update({
            where: { id: order.id },
            data: { advanceAmount: 0 }
          })
        ]);
      }
      this.logger.log('Migration completed.');
    }
  }

  async create(createOrderDto: CreateOrderDto) {
    const { items, customerName, customerPhone, customerAddress, orderDate, dueDate, ...rest } = createOrderDto;
    let orderData: any = { ...rest };
    if (orderDate) orderData.orderDate = new Date(orderDate);
    if (dueDate) orderData.dueDate = new Date(dueDate);

    // Capture initial advance if any
    const initialAdvance = rest.advanceAmount ? Number(rest.advanceAmount) : 0;
    // Set advanceAmount to 0 in DB, create Payment instead
    if (orderData.advanceAmount) orderData.advanceAmount = 0;

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

      // 2. Process Items
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
        include: { items: true, customer: true },
      });

      // 4. Create Initial Payment if advance was provided
      if (initialAdvance > 0) {
        await tx.payment.create({
          data: {
            orderId: order.id,
            amount: initialAdvance,
            date: new Date(),
            note: 'Initial Advance'
          }
        });
      }

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
        const existing = await tx.product.findFirst({
           where: { name: { equals: productName, mode: 'insensitive' } }
        });

        if (existing) {
          productId = existing.id;
        } else {
          const newProduct = await tx.product.create({
            data: {
              name: productName,
              defaultUnitPrice: item.unitPrice || 0,
              notes: item.description || null, 
            }
          });
          productId = newProduct.id;
        }
      }
      processed.push({ ...item, productId });
    }
    return processed;
  }

  async findAll(view?: string) {
    const isHistory = view === 'history';
    const statusFilter = isHistory 
      ? { in: ['closed', 'cancelled'] } 
      : { notIn: ['closed', 'cancelled'] };

    const orders = await this.prisma.order.findMany({
      where: { 
        isDeleted: false,
        status: statusFilter
      },
      include: { 
        customer: true, 
        items: {
          include: { images: true }
        },
        payments: true
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return orders.map(order => this.calculateOrderTotals(order));
  }

  async findOne(id: number) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { 
        customer: true, 
        items: { include: { images: true } },
        payments: { orderBy: { date: 'desc' } }
      },
    });
    
    if (order) {
      return this.calculateOrderTotals(order);
    }
    return null;
  }

  private calculateOrderTotals(order: any) {
    const totalAmount = Number(order.totalAmount);
    const totalPayments = order.payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
    const discount = Number(order.discount || 0);
    // Determine advanceAmount from payments logic for backward compat in UI response
    // Or just return totalPayments as "paidAmount"
    
    return {
      ...order,
      paidAmount: totalPayments,
      remainingBalance: totalAmount - totalPayments - discount
    };
  }

  async update(id: number, dto: UpdateOrderDto) {
    const { items, customerId, customerName, customerPhone, customerAddress, status, ...orderData } = dto;

    return this.prisma.$transaction(async (tx) => {
      // Logic: If status changing to 'closed', calculate balance and set discount
      let discountUpdate = {};
      if (status === 'closed') {
         // Need current totals to calculate remaining balance
         const currentOrder = await tx.order.findUnique({ 
            where: { id }, 
            include: { payments: true } 
         });
         if (currentOrder) {
           const total = Number(currentOrder.totalAmount); // Note: total might change in this same update if items change? 
           // If items change, we need to recalc total first.
           // For simplicity, handle close logic after item updates or assume separate calls. 
           // Actually, if closing, we usually don't verify items same time, but let's be safe.
           
           // If items are being updated, we can't easily predict total without reprocessing items.
           // So, updated Total will be set by Prisma if we rely on application logic separate from this method... 
           // BUT wait, totalAmount is manually set in create? Yes. schema says default 0.
           // The controller/frontend usually sends the calculated total.
           
           // If orderData.totalAmount is present, use it. Else use current.
           const newTotal = orderData.totalAmount !== undefined ? Number(orderData.totalAmount) : Number(currentOrder.totalAmount);
           const totalPaid = currentOrder.payments.reduce((s, p) => s + Number(p.amount), 0);
           const balance = newTotal - totalPaid;
           if (balance > 0) {
             discountUpdate = { discount: balance };
           }
         }
      }

      // 1. Update Order details
      await tx.order.update({
        where: { id },
        data: {
          ...orderData,
          status,
          ...discountUpdate,
          customer: customerId ? { connect: { id: customerId } } : undefined,
        },
      });

      // 2. If items provided, replace them
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

      const updated = await tx.order.findUnique({ 
        where: { id }, 
        include: { 
          items: { include: { images: true } }, 
          customer: true,
          payments: true
        } 
      });
      return this.calculateOrderTotals(updated);
    });
  }

  async addPayment(orderId: number, amount: number, date: Date, note?: string) {
    return this.prisma.payment.create({
      data: {
        orderId,
        amount,
        date,
        note
      }
    });
  }

  remove(id: number) {
    return this.prisma.order.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date() },
    });
  }
}
