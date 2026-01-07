import {
  Injectable,
  OnModuleInit,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { PrismaService } from '../prisma/prisma.service';

import { AuditService } from '../audit/audit.service';
import { ProductsService } from '../products/products.service';
import { CustomersService } from '../customers/customers.service';
import {
  OrderStatus,
  DeliveryStatus,
  PaymentStatus,
  ItemStatus,
} from '@prisma/client';

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
    // One-time migration: Calculate Payment Status for existing orders (if default UNPAID is wrong)
    // We can run this safely on startup as it's idempotent-ish (re-calculates correct status)
    // To avoid perf hit on every restart, we could check a flag or just do it once.
    // For now, let's just do it. It's safe.
    // Optimization: Only update those that are UNPAID but have payments?
    // Actually, migration script set UNPAID.
    // const ordersToFix = await this.prisma.order.findMany({
    //     where: { paymentStatus: PaymentStatus.UNPAID },
    //     include: { payments: true }
    // });
    // for (const order of ordersToFix) {
    //     if (order.payments.length > 0) {
    //         const status = this.calculatePaymentStatusLogic(Number(order.totalAmount), order.payments);
    //         if (status !== PaymentStatus.UNPAID) {
    //             await this.prisma.order.update({
    //                 where: { id: order.id },
    //                 data: { paymentStatus: status }
    //             });
    //             this.logger.log(`Migrated Order #${order.id} Payment Status to ${status}`);
    //         }
    //     }
    // }
  }

  // Migration function removed as advanceAmount column is deleted

  async create(createOrderDto: CreateOrderDto, userId?: number) {
    const {
      items,
      customerId,
      orderDate,
      dueDate,
      paymentMethod,
      discount,
      payments,
      contactId,
      isQuickSale,
      ...rest
    } = createOrderDto;

    // Strict Validation: Customer Identity
    // User Requirement: "Either CustomerId or ContactID is must" (Unless QuickSale which implies Walk-In)
    if (
      !createOrderDto.customerId &&
      !createOrderDto.contactId &&
      !isQuickSale
    ) {
      throw new BadRequestException(
        'Order requires either a valid Customer ID or a Contact ID.',
      );
    }

    const orderData: any = { ...rest };
    // Defaults
    orderData.orderDate = orderDate ? new Date(orderDate) : new Date();
    orderData.dueDate = dueDate ? new Date(dueDate) : null;
    orderData.discount = discount ? Number(discount) : 0;

    // Status Defaults
    // Status is Enum. If 'enquired' comes in string from DTO, we assume DTO validation handles it or we map it.
    // Assuming DTO is loose string, we might need mapping if frontend sends lowercase.
    // Ideally DTO should be updated to Enum, but for safety:
    const statusInput = createOrderDto.status
      ? createOrderDto.status.toUpperCase()
      : 'ENQUIRED';
    orderData.status =
      OrderStatus[statusInput as keyof typeof OrderStatus] ||
      OrderStatus.ENQUIRED;

    orderData.deliveryStatus = DeliveryStatus.CONFIRMED;
    orderData.paymentStatus = PaymentStatus.UNPAID;

    // Remove legacy/frontend-ignored fields if they somehow slipped through
    delete orderData.customerName;
    delete orderData.customerPhone;
    delete orderData.customerAddress;
    delete orderData.advanceAmount;
    delete orderData.skipGoogleSync;

    const result = await this.prisma.$transaction(async (tx) => {
      let finalCustomerId = createOrderDto.customerId;

      // 1. Resolve Customer
      // 1. Resolve Customer
      if (isQuickSale && !finalCustomerId && !contactId) {
        // Check if implicit creation requested (Name + Phone provided, not "Walk-In")
        // If customerName provided and isn't Walk-In, we create a new customer
        const isExplicitWalkIn = createOrderDto.customerName === 'Walk-In';
        const isImplicitCreation =
          createOrderDto.customerName && !isExplicitWalkIn;

        if (isImplicitCreation) {
          // Implicit Creation via CustomersService (Handles Contact + Google Sync)
          // Note: This runs outside the current transaction 'tx' because CustomersService uses its own prisma client.
          // This is acceptable for now.
          if (!userId)
            throw new BadRequestException(
              'User ID required for new customer creation',
            );

          const newCustomer = await this.customersService.create(
            {
              name: createOrderDto.customerName!, // Checked above
              phone: createOrderDto.customerPhone,
              skipGoogleSync: createOrderDto.skipGoogleSync,
            },
            userId,
          );

          finalCustomerId = newCustomer.id;
        } else {
          // Auto-assign "Walk-In" customer (Default)
          const walkIn = await tx.customer.findFirst({
            where: { name: 'Walk-In' },
          });
          if (walkIn) {
            finalCustomerId = walkIn.id;
          } else {
            const newWalkIn = await tx.customer.create({
              data: { name: 'Walk-In' },
            });
            finalCustomerId = newWalkIn.id;
          }
        }
      } else if (!finalCustomerId && contactId) {
        // Resolve from Contact (Global Lookup)
        const existingCustomer = await tx.customer.findFirst({
          where: { contactId: contactId },
        });

        if (existingCustomer) {
          finalCustomerId = existingCustomer.id;
        } else {
          // Create Customer from Contact
          const contact = await tx.contact.findUnique({
            where: { id: contactId },
          });
          if (!contact) {
            throw new BadRequestException('Invalid Contact ID provided.');
          }
          const newCustomer = await tx.customer.create({
            data: {
              name: contact.name,
              phone: contact.phone,
              userId: userId,
              contactId: contactId,
            },
          });
          finalCustomerId = newCustomer.id;
        }
      }

      if (!finalCustomerId) {
        throw new BadRequestException(
          'Could not resolve a valid Customer for this order.',
        );
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
              status: ItemStatus.CONFIRMED,
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
              createdById: userId,
            },
          });
        }
      } else if (
        createOrderDto.advanceAmount &&
        Number(createOrderDto.advanceAmount) > 0
      ) {
        // Handle Legacy/Frontend 'advanceAmount' field
        // This ensures that new orders created with an advance are properly recorded in the payments table.
        await tx.payment.create({
          data: {
            orderId: order.id,
            amount: Number(createOrderDto.advanceAmount),
            method: createOrderDto.paymentMethod || 'CASH',
            date: new Date(),
            note: 'Initial Advance',
            createdById: userId,
          },
        });
      }

      // Re-fetch order with payments to return complete object
      const fullOrder = await tx.order.findUnique({
        where: { id: order.id },
        include: { items: true, customer: true, payments: true },
      });

      if (!fullOrder) {
        throw new Error('Failed to retrieve created order');
      }

      return fullOrder;
    });

    if (userId) {
      await this.auditService.log(userId, 'CREATE', 'Order', result.id, {
        totalAmount: result.totalAmount,
      });
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
          where: { name: { equals: productName, mode: 'insensitive' } },
        });

        if (existing) {
          productId = existing.id;
        } else {
          const newProduct = await tx.product.create({
            data: {
              name: productName,
              defaultUnitPrice: item.unitPrice || 0,
              notes: item.description || null,
            },
          });
          productId = newProduct.id;
        }
      }
      processed.push({ ...item, productId });
    }
    return processed;
  }

  async findAll(
    view?: string,
    page: number = 1,
    limit: number = 20,
    search?: string,
  ) {
    const isHistory = view === 'history';
    const statusFilter = isHistory
      ? { in: [OrderStatus.CLOSED, OrderStatus.CANCELLED] }
      : { notIn: [OrderStatus.CLOSED, OrderStatus.CANCELLED] };

    const where: any = {
      isDeleted: false,
      status: statusFilter,
    };

    if (search) {
      where.customer = {
        name: { contains: search, mode: 'insensitive' },
      };
    }

    const skip = (page - 1) * limit;

    const [orders, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        include: {
          customer: true,
          items: {
            include: { images: true },
          },
          payments: true,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: skip,
      }),
      this.prisma.order.count({ where }),
    ]);

    const data = orders.map((order) => this.calculateOrderTotals(order));

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findProductionOrders(userId: number) {
    return this.prisma.order.findMany({
      where: {
        // createdById: userId, // Allow viewing all? Or just own? Usually production is global.
        // Let's stick to global for now, or maybe filtered by user if needed.
        // But user constraint is common in this codebase.
        // Actually, for a "Production Module", it's likely a shared view for the workshop.
        // I will NOT filter by createdById for now to allow all production staff to see.
        // Wait, other methods filter by `createdById` or `userId`.
        // Let's check `findAll`. It filters by `where: { isDeleted: false, ...query }`.

        isDeleted: false,
        status: { in: [OrderStatus.CONFIRMED] }, // Production view only shows Confirmed (active)
        // Delivery status can be anything except maybe FULLY_DELIVERED?
        deliveryStatus: { not: DeliveryStatus.FULLY_DELIVERED },
      },
      include: {
        customer: true,
        items: {
          include: {
            product: true, // To show original product name or details if needed
          },
        },
      },
      orderBy: {
        orderDate: 'asc', // FIFO
      },
    });
  }

  async findProductionItems(categoryId: number, productId?: number) {
    const where: any = {
      order: {
        status: { in: [OrderStatus.CONFIRMED] },
        deliveryStatus: { not: DeliveryStatus.FULLY_DELIVERED },
        isDeleted: false,
      },
      status: { not: ItemStatus.DELIVERED }, // New: Hide delivered items from queue
      product: {
        categoryId: Number(categoryId),
      },
    };

    if (productId) {
      where.product.id = Number(productId);
    }

    const items = await this.prisma.orderItem.findMany({
      where,
      include: {
        order: {
          include: { customer: true },
        },
        product: true,
      },
      orderBy: [
        { order: { dueDate: 'asc' } }, // Sort by Due Date
        { order: { orderDate: 'asc' } },
      ],
    });

    return items.map((item) => ({
      id: item.id,
      productName: item.productName || item.product?.name,
      quantity: Number(item.quantity),
      bookedPrice: Number(item.unitPrice),
      description: item.description,
      customerName: item.order?.customer?.name || 'Walk-In',
      orderNo: item.order?.orderNo || (item.order ? `#${item.order.id}` : '-'),
      orderDate: item.order?.orderDate,
      dueDate: item.order?.dueDate,
      status: item.status,
      orderId: item.orderId,
    }));
  }

  async findOne(id: number) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        customer: true,
        items: { include: { images: true } },
        payments: { orderBy: { date: 'desc' } },
      },
    });

    if (order) {
      return this.calculateOrderTotals(order);
    }
    return null;
  }

  private calculateOrderTotals(order: any) {
    const totalAmount = Number(order.totalAmount);
    const totalPayments =
      order.payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
    const discount = Number(order.discount || 0);
    // Determine advanceAmount from payments logic for backward compat in UI response
    // Or just return totalPayments as "paidAmount"

    return {
      ...order,
      paidAmount: totalPayments,
      advanceAmount: totalPayments, // Backward compatibility for Frontend
      remainingBalance: totalAmount - totalPayments - discount,
    };
  }

  async update(id: number, dto: UpdateOrderDto, userId?: number) {
    const {
      items,
      customerId,
      status,
      payments,
      contactId,
      paymentMethod,
      advanceAmount,
      ...rest
    } = dto;

    // Explicit transformations to ensure types match Prisma schema
    const orderData: any = { ...rest };
    if (orderData.orderDate)
      orderData.orderDate = new Date(orderData.orderDate);
    if (orderData.dueDate) orderData.dueDate = new Date(orderData.dueDate);
    if (orderData.discount) orderData.discount = Number(orderData.discount);
    if (orderData.totalAmount)
      orderData.totalAmount = Number(orderData.totalAmount);

    // Remove fields not in Order schema to prevent Prisma validation error
    delete orderData.customerName;
    delete orderData.customerPhone;
    delete orderData.customerAddress;
    delete orderData.skipGoogleSync;

    const result = await this.prisma.$transaction(async (tx) => {
      // Logic: If status changing to 'closed', calculate balance and set discount
      let discountUpdate = {};
      if (status === 'closed') {
        // Need current totals to calculate remaining balance
        const currentOrder = await tx.order.findUnique({
          where: { id },
          include: { payments: true },
        });
        if (currentOrder) {
          const newTotal =
            orderData.totalAmount !== undefined
              ? Number(orderData.totalAmount)
              : Number(currentOrder.totalAmount);
          const totalPaid = currentOrder.payments.reduce(
            (s, p) => s + Number(p.amount),
            0,
          );
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
        // Try to find customer by contact (Global Lookup)
        const existing = await tx.customer.findFirst({ where: { contactId } });
        if (existing) {
          finalCustomerId = existing.id;
        } else {
          // Create from Contact
          const contact = await tx.contact.findUnique({
            where: { id: contactId },
          });
          if (contact) {
            const newCustomer = await tx.customer.create({
              data: {
                name: contact.name,
                phone: contact.phone,
                userId,
                contactId,
              },
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
          status: status
            ? OrderStatus[status.toUpperCase() as keyof typeof OrderStatus]
            : undefined,
          ...discountUpdate,
          customer: finalCustomerId
            ? { connect: { id: finalCustomerId } }
            : undefined,
          updatedBy: userId ? { connect: { id: userId } } : undefined,
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
              status: ItemStatus.CONFIRMED
            })),
          });
        }
      }

      const updated = await tx.order.findUnique({
        where: { id },
        include: {
          items: { include: { images: true } },
          customer: true,
          payments: true,
        },
      });
      return this.calculateOrderTotals(updated);
    });

    if (userId) {
      await this.auditService.log(userId, 'UPDATE', 'Order', id, {
        status: dto.status,
      });
    }
    return result;
  }

  async addPayment(
    orderId: number,
    amount: number,
    method: string,
    date: Date,
    note?: string,
    userId?: number,
  ) {
    const payment = await this.prisma.payment.create({
      data: {
        orderId,
        amount,
        method,
        date,
        note,
        createdById: userId,
      },
    });
    if (userId) {
      await this.auditService.log(userId, 'CREATE', 'Payment', payment.id, {
        orderId,
        amount,
      });
    }
    return payment;
  }

  async syncPayments(
    orderId: number,
    payments: {
      id?: number;
      amount: number;
      method?: string;
      date: string;
      note?: string;
    }[],
    userId?: number,
  ) {
    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Get existing payment IDs
      const existing = await tx.payment.findMany({
        where: { orderId },
        select: { id: true },
      });
      const existingIds = new Set(existing.map((p) => p.id));

      const incomingIds = new Set(
        payments.filter((p) => p.id).map((p) => p.id),
      );

      // 2. Delete payments not in incoming list
      const toDelete = [...existingIds].filter((id) => !incomingIds.has(id));
      if (toDelete.length > 0) {
        await tx.payment.deleteMany({ where: { id: { in: toDelete } } });
      }

      // 3. Upsert (Update existing, Create new)
      for (const p of payments) {
        const data = {
          amount: Number(p.amount),
          method: p.method || 'CASH',
          date: new Date(p.date),
          note: p.note,
        };

        if (p.id && existingIds.has(p.id)) {
          await tx.payment.update({
            where: { id: p.id },
            data: { ...data, updatedById: userId },
          });
        } else {
          await tx.payment.create({
            data: {
              ...data,
              orderId,
              createdById: userId,
            },
          });
        }
      }

      return { success: true };
    });
    if (userId) {
      await this.auditService.log(userId, 'UPDATE', 'Payment', orderId, {
        action: 'SYNC_PAYMENTS',
      });
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

  // --- GST Invoice Logic ---

  async getGstInvoice(orderId: number) {
    return this.prisma.gstInvoice.findUnique({ where: { orderId } });
  }

  async upsertGstInvoice(orderId: number, data: any, userId?: number) {
    // 1. Check if exists
    const existing = await this.prisma.gstInvoice.findUnique({
      where: { orderId },
    });

    if (existing) {
      // Update
      const updated = await this.prisma.gstInvoice.update({
        where: { orderId },
        data: {
          items: data.items,
          customerName: data.customerName,
          subtotal: data.subtotal,
          discount: data.discount,
          totalAmount: data.totalAmount,
        },
      });
      return updated;
    } else {
      // Create New
      // Generate Invoice Number: GST-YYYY-SEQ (e.g. GST-2025-0001)
      const invoiceNo = await this.generateNextGstInvoiceNo();

      const created = await this.prisma.gstInvoice.create({
        data: {
          orderId,
          invoiceNo,
          customerName: data.customerName,
          items: data.items,
          subtotal: data.subtotal,
          discount: data.discount,
          totalAmount: data.totalAmount,
        },
      });

      if (userId)
        await this.auditService.log(
          userId,
          'CREATE',
          'GstInvoice',
          created.id,
          { invoiceNo },
        );
      return created;
    }
  }

  private async generateNextGstInvoiceNo() {
    // Format: GST-{Year}-{4digitSeq}
    const year = new Date().getFullYear();
    const prefix = `GST-${year}-`;

    // Find last invoice created this year (crudely by filtering string if possible, or just last created)
    // Prisma doesn't support 'startsWith' easily on all DBs, but Postgres ILIKE, or just get last ID.
    // Better strategy: count? No, gaps.
    // Strategy: Get last created GstInvoice. Check if it starts with current prefix.

    const lastInvoice = await this.prisma.gstInvoice.findFirst({
      orderBy: { id: 'desc' },
    });

    let seq = 1;
    if (lastInvoice && lastInvoice.invoiceNo.startsWith(prefix)) {
      const parts = lastInvoice.invoiceNo.split('-');
      if (parts.length === 3) {
        const lastSeq = parseInt(parts[2], 10);
        if (!isNaN(lastSeq)) {
          seq = lastSeq + 1;
        }
      }
    }

    return `${prefix}${String(seq).padStart(4, '0')}`;
  }

  // --- Helper Methods for Satus Logic ---

  private calculatePaymentStatusLogic(
    total: number,
    payments?: any[],
    knownPaid?: number,
  ): PaymentStatus {
    let paid = knownPaid !== undefined ? knownPaid : 0;
    if (payments) {
      paid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    }

    if (paid >= total && total > 0) return PaymentStatus.FULLY_PAID;
    if (paid > 0) return PaymentStatus.PARTIALLY_PAID;
    return PaymentStatus.UNPAID;
  }

  private calculateDeliveryStatusLogic(items: any[]): DeliveryStatus {
    if (!items || items.length === 0) return DeliveryStatus.CONFIRMED;

    const distinct = new Set(items.map((i) => i.status));

    if (distinct.has(ItemStatus.DELIVERED) && distinct.size === 1)
      return DeliveryStatus.FULLY_DELIVERED;
    if (distinct.has(ItemStatus.DELIVERED))
      return DeliveryStatus.PARTIALLY_DELIVERED;
    if (
      distinct.has(ItemStatus.READY) ||
      distinct.has(ItemStatus.IN_PRODUCTION)
    )
      return DeliveryStatus.IN_PRODUCTION;
    // If some ready and some confirmed? Still IN_PRODUCTION or READY?
    // "In Production': At least one item 'In Production' or 'Ready'." from plan.

    if (
      items.some(
        (i) =>
          i.status === ItemStatus.IN_PRODUCTION ||
          i.status === ItemStatus.READY,
      )
    ) {
      // If all are READY?
      if (items.every((i) => i.status === ItemStatus.READY))
        return DeliveryStatus.READY;
      return DeliveryStatus.IN_PRODUCTION;
    }

    return DeliveryStatus.CONFIRMED;
  }

  async updateItemStatus(itemId: number, status: string, userId?: number) {
    // Status string from frontend likely 'In Production', need mapping or strict enum
    // Map to Enum
    const map: Record<string, ItemStatus> = {
      Confirmed: ItemStatus.CONFIRMED,
      'In Production': ItemStatus.IN_PRODUCTION,
      Ready: ItemStatus.READY,
      Delivered: ItemStatus.DELIVERED,
    };
    const enumStatus =
      map[status] || ItemStatus[status as keyof typeof ItemStatus];

    if (!enumStatus)
      throw new BadRequestException(`Invalid Item Status: ${status}`);

    const item = await this.prisma.orderItem.update({
      where: { id: itemId },
      data: { status: enumStatus },
      include: { order: { include: { items: true, payments: true } } },
    });

    if (item.order) {
      // Recalc Order Delivery Status
      const newDeliveryStatus = this.calculateDeliveryStatusLogic(
        item.order.items,
      );

      const statusUpdate: any = { deliveryStatus: newDeliveryStatus };

      // Check for Closing Condition: Fully Delivered AND Fully Paid
      const isFullyPaid = item.order.paymentStatus === PaymentStatus.FULLY_PAID;
      if (newDeliveryStatus === DeliveryStatus.FULLY_DELIVERED && isFullyPaid) {
        statusUpdate.status = OrderStatus.CLOSED;
      }

      await this.prisma.order.update({
        where: { id: item.order.id },
        data: statusUpdate,
      });

      if (userId)
        await this.auditService.log(userId, 'UPDATE', 'OrderItem', itemId, {
          status: enumStatus,
        });
    }
    return item;
  }
}
