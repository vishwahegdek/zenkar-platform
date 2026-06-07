import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { UpdatePurchaseDto } from './dto/update-purchase.dto';
import { InventoryService } from '../inventory/inventory.service';
import { InventoryTransactionType, PurchaseStatus } from '@prisma/client';
import { LedgerService } from '../ledger/ledger.service';

@Injectable()
export class PurchasesService {
  private readonly logger = new Logger(PurchasesService.name);

  constructor(
    private prisma: PrismaService,
    private inventoryService: InventoryService,
    private ledgerService: LedgerService,
  ) {}

  async create(dto: CreatePurchaseDto, userId: number) {
    const { items, supplierId, purchaseDate, notes, status, discount, shippingCost, payments } = dto;

    const itemsTotal = items.reduce((sum, item) => sum + item.quantity * item.unitCost, 0);
    const totalAmount = itemsTotal + Number(shippingCost || 0) - Number(discount || 0);
    const finalStatus = (status as PurchaseStatus) || 'RECEIVED';

    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Create Purchase
      const purchase = await tx.purchase.create({
        data: {
          supplierId,
          purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
          status: finalStatus,
          totalAmount,
          discount: discount || 0,
          shippingCost: shippingCost || 0,
          notes,
          createdById: userId,
          items: {
            create: items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitCost: item.unitCost,
              lineTotal: item.quantity * item.unitCost,
            })),
          },
          payments: payments ? {
            create: payments.map((p) => ({
              amount: p.amount,
              method: p.method || 'CASH',
              date: p.date ? new Date(p.date) : new Date(),
              note: p.note,
              createdById: userId,
            })),
          } : undefined,
        },
        include: { items: true, payments: true, supplier: true },
      });

      // 2. Adjust Stock if RECEIVED
      if (finalStatus === 'RECEIVED') {
        for (const item of items) {
          await this.inventoryService.adjustStock(
            item.productId,
            item.quantity,
            InventoryTransactionType.PURCHASE,
            purchase.id,
            `Purchase #${purchase.id}`,
            tx,
          );
        }
      }

      return purchase;
    });

    await this.syncLedger(result);

    return result;
  }

  async update(id: number, dto: UpdatePurchaseDto, userId: number) {
    const oldPurchase = await this.prisma.purchase.findUnique({
      where: { id },
      include: { items: true, payments: true },
    });
    if (!oldPurchase) throw new Error('Purchase not found');

    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Reverse old inventory if it was RECEIVED
      if (oldPurchase.status === 'RECEIVED') {
        for (const item of oldPurchase.items) {
          await this.inventoryService.adjustStock(
            item.productId,
            -item.quantity, // Negative to reverse
            InventoryTransactionType.ADJUSTMENT,
            id,
            `Reversing Purchase #${id} for update`,
            tx,
          );
        }
      }

      // 2. Delete old items and payments
      await tx.purchaseItem.deleteMany({ where: { purchaseId: id } });
      await tx.purchasePayment.deleteMany({ where: { purchaseId: id } });

      // 3. Clear Ledger
      await this.ledgerService.deleteEntriesForSource('PURCHASE', id);
      for (const p of oldPurchase.payments) {
        await this.ledgerService.deleteEntriesForSource('PURCHASE_PAYMENT', p.id);
      }

      const itemsTotal = dto.items ? dto.items.reduce((sum, item) => sum + item.quantity * item.unitCost, 0) : 0;
      const discount = dto.discount !== undefined ? dto.discount : Number(oldPurchase.discount);
      const shippingCost = dto.shippingCost !== undefined ? dto.shippingCost : Number(oldPurchase.shippingCost);
      const totalAmount = itemsTotal + Number(shippingCost) - Number(discount);
      const finalStatus = (dto.status as PurchaseStatus) || oldPurchase.status;

      // 4. Update purchase
      const updated = await tx.purchase.update({
        where: { id },
        data: {
          supplierId: dto.supplierId !== undefined ? dto.supplierId : oldPurchase.supplierId,
          purchaseDate: dto.purchaseDate ? new Date(dto.purchaseDate) : oldPurchase.purchaseDate,
          status: finalStatus,
          totalAmount,
          discount,
          shippingCost,
          notes: dto.notes !== undefined ? dto.notes : oldPurchase.notes,
          updatedById: userId,
          items: dto.items ? {
            create: dto.items.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              unitCost: item.unitCost,
              lineTotal: item.quantity * item.unitCost,
            })),
          } : undefined,
          payments: dto.payments ? {
            create: dto.payments.map(p => ({
              amount: p.amount,
              method: p.method || 'CASH',
              date: p.date ? new Date(p.date) : new Date(),
              note: p.note,
              createdById: userId,
            })),
          } : undefined,
        },
        include: { items: true, payments: true, supplier: true },
      });

      // 5. Re-apply inventory if RECEIVED
      if (updated.status === 'RECEIVED') {
        for (const item of updated.items) {
          await this.inventoryService.adjustStock(
            item.productId,
            item.quantity,
            InventoryTransactionType.PURCHASE,
            id,
            `Purchase #${id} updated`,
            tx,
          );
        }
      }

      return updated;
    });

    await this.syncLedger(result);

    return result;
  }

  async remove(id: number) {
    const oldPurchase = await this.prisma.purchase.findUnique({
      where: { id },
      include: { items: true, payments: true },
    });
    if (!oldPurchase) throw new Error('Purchase not found');

    await this.prisma.$transaction(async (tx) => {
      if (oldPurchase.status === 'RECEIVED') {
        for (const item of oldPurchase.items) {
          await this.inventoryService.adjustStock(
            item.productId,
            -item.quantity,
            InventoryTransactionType.ADJUSTMENT,
            id,
            `Purchase #${id} deleted`,
            tx,
          );
        }
      }

      await tx.purchase.delete({ where: { id } });
    });

    await this.ledgerService.deleteEntriesForSource('PURCHASE', id);
    for (const p of oldPurchase.payments) {
      await this.ledgerService.deleteEntriesForSource('PURCHASE_PAYMENT', p.id);
    }

    return { success: true };
  }

  private async syncLedger(purchase: any) {
    if (purchase.supplierId && purchase.status === 'RECEIVED') {
      try {
        const supplierName = purchase.supplier ? purchase.supplier.name : 'Unknown Supplier';
        const supplierAccount = await this.ledgerService.getOrCreateAccountForEntity(
          'SUPPLIER',
          purchase.supplierId,
          supplierName,
        );
        const inventoryPurchasesAccount = await this.ledgerService.getSystemAccount('GENERAL_EXPENSE');
        
        await this.ledgerService.recordDoubleEntry({
          transactionId: `PURCHASE-${purchase.id}`,
          sourceType: 'PURCHASE',
          sourceId: purchase.id,
          date: purchase.purchaseDate,
          debitAccountId: inventoryPurchasesAccount.id,
          creditAccountId: supplierAccount.id,
          amount: Number(purchase.totalAmount),
          note: `Purchase invoice #${purchase.id} from ${supplierName}`,
        });
      } catch (err) {
        this.logger.error(`Failed to record ledger for Purchase #${purchase.id}: ${err.message}`);
      }
    }

    // Process payments (always logged regardless of status, as an advance if not received)
    if (purchase.payments && purchase.payments.length > 0 && purchase.supplierId) {
      try {
        const supplierName = purchase.supplier ? purchase.supplier.name : 'Unknown Supplier';
        const supplierAccount = await this.ledgerService.getOrCreateAccountForEntity(
          'SUPPLIER',
          purchase.supplierId,
          supplierName,
        );
        const cashAccount = await this.ledgerService.getSystemAccount('CASH');

        for (const p of purchase.payments) {
          if (Number(p.amount) > 0) {
            await this.ledgerService.recordDoubleEntry({
              transactionId: `PURCHASE_PAYMENT-${p.id}`,
              sourceType: 'PURCHASE_PAYMENT',
              sourceId: p.id,
              date: p.date,
              debitAccountId: supplierAccount.id, // Liability decreases
              creditAccountId: cashAccount.id, // Cash decreases
              amount: Number(p.amount),
              note: `Payment for Purchase #${purchase.id} to ${supplierName}`,
            });
          }
        }
      } catch (err) {
        this.logger.error(`Failed to record payment ledger for Purchase #${purchase.id}: ${err.message}`);
      }
    }
  }

  async findAll() {
    return this.prisma.purchase.findMany({
      include: {
        supplier: true,
        items: { include: { product: true } },
        payments: true,
        createdBy: true,
      },
      orderBy: { purchaseDate: 'desc' },
    });
  }

  async findOne(id: number) {
    return this.prisma.purchase.findUnique({
      where: { id },
      include: {
        supplier: true,
        items: { include: { product: true } },
        payments: true,
        createdBy: true,
      },
    });
  }
}
