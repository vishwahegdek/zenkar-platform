import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { PrismaService } from '../prisma/prisma.service';

import { AuditService } from '../audit/audit.service';
import { ProductsService } from '../products/products.service';
import { CustomersService } from '../customers/customers.service';

@Injectable()
export class OrdersService implements OnModuleInit {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private prisma: PrismaService,
    private productsService: ProductsService,
    private customersService: CustomersService,
    private auditService: AuditService,
  ) {}

  async onModuleInit() {
    // Migration deprecated
  }

  // Migration function removed as advanceAmount column is deleted


  async create(createOrderDto: CreateOrderDto, userId?: number) {
    const { items, customerName, customerPhone, customerAddress, orderDate, dueDate, paymentMethod, discount, advanceAmount, payments, contactId, isQuickSale, ...rest } = createOrderDto;
    let orderData: any = { ...rest };
    if (orderDate) orderData.orderDate = new Date(orderDate);
    if (dueDate) orderData.dueDate = new Date(dueDate);
    if (discount) orderData.discount = Number(discount);

    // Capture initial advance if any
    const initialAdvance = advanceAmount ? Number(advanceAmount) : 0;
    
    // Remove advanceAmount from orderData as it's no longer a column
    delete orderData.advanceAmount;

    const result = await this.prisma.$transaction(async (tx) => {
      let finalCustomerId = createOrderDto.customerId;

      // 1. Handle New Customer Creation or Walk-In
      if (createOrderDto.isQuickSale && !finalCustomerId && !createOrderDto.customerName) {
         // Auto-assign "Walk-In" customer
         const walkIn = await tx.customer.findFirst({ where: { name: 'Walk-In' } });
         if (walkIn) {
             finalCustomerId = walkIn.id;
         } else {
             const newWalkIn = await tx.customer.create({
                 data: { name: 'Walk-In' }
             });
             finalCustomerId = newWalkIn.id;
         }
      } else if (createOrderDto.customerId === 0 && customerName) {
        const newCustomer = await tx.customer.create({
          data: {
            name: customerName,
            phone: customerPhone,
            address: customerAddress,
            userId: userId || null,
            contactId: createOrderDto.contactId || undefined,
          },
        });
        finalCustomerId = newCustomer.id;
      }
      
      // Clean up orderData to remove fields not in Order model
      delete orderData.customerId; 

      // 2. Process Items
      const processedItems = await this.processItems(items, tx);

      // 3. Create Order
      const order = await tx.order.create({

        data: {
          ...orderData,
          createdBy: userId ? { connect: { id: userId } } : undefined,
          customer: { connect: { id: finalCustomerId } }, 
          isQuickSale: createOrderDto.isQuickSale || false,
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

      // 4. Handle Payments (New Array Logic vs Legacy Advance)
      if (createOrderDto.payments && createOrderDto.payments.length > 0) {
          for (const p of createOrderDto.payments) {
              if (p.amount > 0) {
                  await tx.payment.create({
                      data: {
                          orderId: order.id,
                          amount: p.amount,
                          date: new Date(),
                          note: p.note || p.method || 'Initial Payment',
                          createdById: userId
                      }
                  });
              }
          }
      } else if (initialAdvance > 0) {
        // Fallback for legacy calls using advanceAmount
        let paymentNote = createOrderDto.isQuickSale ? 'Quick Sale Payment' : 'Initial Advance';
        if (createOrderDto.paymentMethod) {
            paymentNote = createOrderDto.paymentMethod;
        }

        await tx.payment.create({
          data: {
            orderId: order.id,
            amount: initialAdvance,
            date: new Date(),
            note: paymentNote,
            createdById: userId,
          }
        });
      }

      return order;
    });

    if (userId) {
        await this.auditService.log(userId, 'CREATE', 'Order', result.id, { totalAmount: result.totalAmount });
    }
    return result;
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
      advanceAmount: totalPayments, // Backward compatibility for Frontend
      remainingBalance: totalAmount - totalPayments - discount
    };
  }

  async update(id: number, dto: UpdateOrderDto, userId?: number) {
    const { items, customerId, customerName, customerPhone, customerAddress, status, payments, advanceAmount, ...orderData } = dto;

    const result = await this.prisma.$transaction(async (tx) => {
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
          updatedBy: userId ? { connect: { id: userId } } : undefined
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

    if (userId) {
        await this.auditService.log(userId, 'UPDATE', 'Order', id, { status: dto.status });
    }
    return result;
  }

  async addPayment(orderId: number, amount: number, date: Date, note?: string, userId?: number) {
    const payment = await this.prisma.payment.create({

      data: {
        orderId,
        amount,
        date,
        note,
        createdById: userId
      }
    });
    if (userId) {
        await this.auditService.log(userId, 'CREATE', 'Payment', payment.id, { orderId, amount });
    }
    return payment;
  }

  async syncPayments(orderId: number, payments: { id?: number; amount: number; date: string; note?: string }[], userId?: number) {
     const result = await this.prisma.$transaction(async (tx) => {
        // 1. Get existing payment IDs
        const existing = await tx.payment.findMany({ where: { orderId }, select: { id: true } });
        const existingIds = new Set(existing.map(p => p.id));
        
        const incomingIds = new Set(payments.filter(p => p.id).map(p => p.id));

        // 2. Delete payments not in incoming list
        const toDelete = [...existingIds].filter(id => !incomingIds.has(id));
        if (toDelete.length > 0) {
            await tx.payment.deleteMany({ where: { id: { in: toDelete } } });
        }

        // 3. Upsert (Update existing, Create new)
        for (const p of payments) {
            const data = {
                amount: Number(p.amount),
                date: new Date(p.date),
                note: p.note
            };

            if (p.id && existingIds.has(p.id)) {
                await tx.payment.update({
                    where: { id: p.id },
                    data: { ...data, updatedById: userId }
                });
            } else {
                await tx.payment.create({
                    data: {
                        ...data,
                        orderId,
                        createdById: userId
                    }
                });
            }
        }
        
        return { success: true };
     });
     if (userId) {
        await this.auditService.log(userId, 'UPDATE', 'Payment', orderId, { action: 'SYNC_PAYMENTS' });
     }
     return result;
  }

  async remove(id: number, userId?: number) {
    const result = await this.prisma.order.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date() },
    });
    if (userId) {
        await this.auditService.log(userId, 'DELETE', 'Order', id);
    }
    return result;
  }
}
