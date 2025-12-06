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

  findAll() {
    return this.prisma.order.findMany({
      where: { isDeleted: false },
      include: { customer: true },
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
    const { items, ...orderData } = dto;

    return this.prisma.$transaction(async (tx) => {
      // 1. Update Order Fields
      await tx.order.update({
        where: { id },
        data: orderData,
      });

      // 2. Replace Items (Delete All + Insert New) if items provided
      if (items) {
        await tx.orderItem.deleteMany({ where: { orderId: id } });
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

      return tx.order.findUnique({ where: { id }, include: { items: true } });
    });
  }

  remove(id: number) {
    return this.prisma.order.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date() },
    });
  }
}
