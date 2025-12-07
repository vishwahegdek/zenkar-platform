import { Injectable } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateOrderDto) {
    const { items, customerName, customerPhone, customerAddress, orderDate, dueDate, ...rest } = dto;
    let orderData: any = { ...rest };
    if (orderDate) orderData.orderDate = new Date(orderDate);
    if (dueDate) orderData.dueDate = new Date(dueDate);

    return this.prisma.$transaction(async (tx) => {
      // 1. Handle New Customer Creation
      if (dto.customerId === 0 && customerName) {
        const newCustomer = await tx.customer.create({
          data: {
            name: customerName,
            phone: customerPhone,
            address: customerAddress,
          },
        });
        orderData.customerId = newCustomer.id;
      }

      // 2. Create Order
      const order = await tx.order.create({
        data: {
          ...orderData,
          items: {
            create: items.map((item) => ({
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
      include: { customer: true, items: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  findOne(id: number) {
    return this.prisma.order.findUnique({
      where: { id },
      include: { customer: true, items: true },
    });
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
          await tx.orderItem.createMany({
            data: items.map((item) => ({
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

      return tx.order.findUnique({ where: { id }, include: { items: true, customer: true } });
    });
  }

  remove(id: number) {
    return this.prisma.order.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date() },
    });
  }
}
