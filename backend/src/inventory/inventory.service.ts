import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InventoryTransactionType } from '@prisma/client';

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Adjusts the stock of a product and records the transaction.
   * Logic: Only runs if product matches 'isPurchasable'.
   *
   * @param productId Product ID
   * @param quantity Quantity change (Positive for add, Negative for remove)
   * @param type Transaction Type
   * @param referenceId ID of the related entity (Purchase ID, Order ID, etc.)
   * @param tx Optional prisma transaction client
   */
  async adjustStock(
    productId: number,
    quantity: number,
    type: InventoryTransactionType,
    referenceId?: number,
    note?: string,
    tx?: any, // Prisma transaction client
  ) {
    const prisma = tx || this.prisma;

    // 1. Fetch Product to check tracking status
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      this.logger.warn(`adjustStock: Product #${productId} not found.`);
      return;
    }

    if (!product.isPurchasable) {
      // Logic: If not tracked, we do NOT change stock.
      // Exception: If user manually adjusts? No, per plan, strict decoupling.
      this.logger.debug(
        `adjustStock: Skipped for Product #${productId} (Inventory Tracking Disabled)`,
      );
      return;
    }

    // 2. Update Stock
    await prisma.product.update({
      where: { id: productId },
      data: {
        stockQuantity: { increment: quantity },
      },
    });

    // 3. Create Transaction Log
    await prisma.inventoryTransaction.create({
      data: {
        productId,
        quantity,
        type,
        referenceId,
        note,
      },
    });

    this.logger.log(
      `adjustStock: Product #${productId} ${quantity > 0 ? '+' : ''}${quantity} (${type})`,
    );
  }

  async getHistory(productId: number) {
    return this.prisma.inventoryTransaction.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
