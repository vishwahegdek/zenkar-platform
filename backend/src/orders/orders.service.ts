import { Injectable, OnModuleInit, Logger, BadRequestException } from '@nestjs/common';
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
    const { items, customerId, orderDate, dueDate, paymentMethod, discount, payments, contactId, isQuickSale, ...rest } = createOrderDto;
    
    // Strict Validation: Customer Identity
    // User Requirement: "Either CustomerId or ContactID is must" (Unless QuickSale which implies Walk-In)
    if (!createOrderDto.customerId && !createOrderDto.contactId && !isQuickSale) {
        throw new BadRequestException('Order requires either a valid Customer ID or a Contact ID.');
    }

    let orderData: any = { ...rest };
    // Defaults
    orderData.orderDate = orderDate ? new Date(orderDate) : new Date();
    orderData.dueDate = dueDate ? new Date(dueDate) : null;
    orderData.discount = discount ? Number(discount) : 0;
    orderData.status = createOrderDto.status || 'enquired'; // Default status

    // Remove legacy/frontend-ignored fields if they somehow slipped through
    delete orderData.customerName;
    delete orderData.customerPhone;
    delete orderData.customerAddress;
    delete orderData.advanceAmount;

    const result = await this.prisma.$transaction(async (tx) => {
      let finalCustomerId = createOrderDto.customerId;

      // 1. Resolve Customer
      if (isQuickSale && !finalCustomerId && !contactId) {
         // Auto-assign "Walk-In" customer
         const walkIn = await tx.customer.findFirst({ where: { name: 'Walk-In' } });
         if (walkIn) {
             finalCustomerId = walkIn.id;
         } else {
             const newWalkIn = await tx.customer.create({ data: { name: 'Walk-In' } });
             finalCustomerId = newWalkIn.id;
         }
      } else if (!finalCustomerId && contactId) {
          // Resolve from Contact
          const existingCustomer = await tx.customer.findFirst({ where: { contactId: contactId, userId: userId || undefined } }); // Should we scope by User? Contacts are user specific usually.
          
          if (existingCustomer) {
              finalCustomerId = existingCustomer.id;
          } else {
              // Create Customer from Contact
              const contact = await tx.contact.findUnique({ where: { id: contactId } });
              if (!contact) {
                  throw new BadRequestException('Invalid Contact ID provided.');
              }
              const newCustomer = await tx.customer.create({
                  data: {
                      name: contact.name,
                      phone: contact.phone,
                      userId: userId,
                      contactId: contactId
                  }
              });
              finalCustomerId = newCustomer.id;
          }
      }

      if (!finalCustomerId) {
           throw new BadRequestException('Could not resolve a valid Customer for this order.');
      }

      // 2. Process Items
      const processedItems = await this.processItems(items, tx);

      // 3. Create Order
      const order = await tx.order.create({
        data: {
          ...orderData, // contains notes, totalAmount
          createdBy: userId ? { connect: { id: userId } } : undefined,
          customer: { connect: { id: finalCustomerId } }, 
          isQuickSale: isQuickSale || false,
          items: {
            create: processedItems.map((item) => ({
              productId: item.productId,
              productName: item.productName || 'Unknown Product', // Fallback if somehow missing
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              lineTotal: item.lineTotal,
            })),
          },
        },
        include: { items: true, customer: true },
      });

      // 4. Handle Payments (Strict Payment Method usage)
      // 4. Handle Payments (Strict Payment Method usage)
      if (payments && payments.length > 0) {
          for (const p of payments) {
               await tx.payment.create({
                   data: {
                       orderId: order.id,
                       amount: p.amount,
                       date: new Date(),
                       note: p.note || p.method, // Use method as note if note missing
                       createdById: userId
                   }
               });
          }
      } else if (createOrderDto.advanceAmount && Number(createOrderDto.advanceAmount) > 0) {
          // Handle Legacy/Frontend 'advanceAmount' field
          // This ensures that new orders created with an advance are properly recorded in the payments table.
          await tx.payment.create({
              data: {
                  orderId: order.id,
                  amount: Number(createOrderDto.advanceAmount),
                  method: createOrderDto.paymentMethod || 'CASH',
                  date: new Date(),
                  note: 'Initial Advance',
                  createdById: userId
              }
          });
      }

      // Re-fetch order with payments to return complete object
      const fullOrder = await tx.order.findUnique({
          where: { id: order.id },
          include: { items: true, customer: true, payments: true }
      });

      if (!fullOrder) {
          throw new Error('Failed to retrieve created order');
      }

      return fullOrder;
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

  async findAll(view?: string, page: number = 1, limit: number = 20, search?: string) {
    const isHistory = view === 'history';
    const statusFilter = isHistory 
      ? { in: ['closed', 'cancelled'] } 
      : { notIn: ['closed', 'cancelled'] };

    const where: any = { 
        isDeleted: false,
        status: statusFilter
    };

    if (search) {
       where.customer = {
          name: { contains: search, mode: 'insensitive' }
       };
    }

    const skip = (page - 1) * limit;

    const [orders, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        include: { 
          customer: true, 
          items: {
            include: { images: true }
          },
          payments: true
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: skip,
      }),
      this.prisma.order.count({ where })
    ]);

    const data = orders.map(order => this.calculateOrderTotals(order));
    
    return {
       data,
       meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
       }
    };
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
    const { items, customerId, status, payments, contactId, paymentMethod, advanceAmount, ...rest } = dto;
    
    // Explicit transformations to ensure types match Prisma schema
    let orderData: any = { ...rest };
    if (orderData.orderDate) orderData.orderDate = new Date(orderData.orderDate);
    if (orderData.dueDate) orderData.dueDate = new Date(orderData.dueDate);
    if (orderData.discount) orderData.discount = Number(orderData.discount);
    if (orderData.totalAmount) orderData.totalAmount = Number(orderData.totalAmount);

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
           const newTotal = orderData.totalAmount !== undefined ? Number(orderData.totalAmount) : Number(currentOrder.totalAmount);
           const totalPaid = currentOrder.payments.reduce((s, p) => s + Number(p.amount), 0);
           const balance = newTotal - totalPaid;
           if (balance > 0) {
             discountUpdate = { discount: balance };
           }
         }
      }

      let finalCustomerId = customerId;
      
      // Handle New Customer Creation from Context/Contact (If CustomerId=0)
      // Since customerName is removed from DTO, we can only create via ContactId or use existing
      if (customerId === 0 && contactId) {
         // Try to find customer by contact
         const existing = await tx.customer.findFirst({ where: { contactId, userId: userId || undefined } });
         if (existing) {
             finalCustomerId = existing.id;
         } else {
             // Create from Contact
             const contact = await tx.contact.findUnique({ where: { id: contactId } });
             if (contact) {
                 const newCustomer = await tx.customer.create({
                     data: { name: contact.name, phone: contact.phone, userId, contactId }
                 });
                 finalCustomerId = newCustomer.id;
             }
         }
      } else if (customerId === 0) {
          // If no contactId provided, we can't create a customer "from name" anymore as name is gone.
          // Throw error or ignore? 
          // Assuming strict validation logic prevents this scenario via frontend, but to be safe:
          // We just leave finalCustomerId as 0 or undefined, which might fail FK constraint or be handled.
          // Actually, if customerId is optional in DTO, it might be undefined here. 
          // If it is 0, user intended "New". 
          // But without Name, we can't. So we skip update of customer field in that case.
          finalCustomerId = undefined; 
      }

      // 1. Update Order details
      await tx.order.update({
        where: { id },
        data: {
          ...orderData,
          status,
          ...discountUpdate,
          customer: finalCustomerId ? { connect: { id: finalCustomerId } } : undefined,
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

  async addPayment(orderId: number, amount: number, method: string, date: Date, note?: string, userId?: number) {
    const payment = await this.prisma.payment.create({

      data: {
        orderId,
        amount,
        method,
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

  async syncPayments(orderId: number, payments: { id?: number; amount: number; method?: string; date: string; note?: string }[], userId?: number) {
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
                method: p.method || 'CASH',
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
