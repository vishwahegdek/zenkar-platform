import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { InventoryService } from '../inventory/inventory.service';
import { InventoryTransactionType } from '@prisma/client';

@Injectable()
export class PurchasesService {
  private readonly logger = new Logger(PurchasesService.name);

  constructor(
    private prisma: PrismaService,
    private inventoryService: InventoryService,
  ) {}

  async create(dto: CreatePurchaseDto, userId: number) {
    const { items, supplierId, purchaseDate, notes } = dto;

    // Calculate Total
    const totalAmount = items.reduce(
      (sum, item) => sum + item.quantity * item.unitCost,
      0,
    );

    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Create Purchase
      const purchase = await tx.purchase.create({
        data: {
          supplierId,
          purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
          totalAmount,
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
        },
        include: { items: true },
      });

      // 2. Adjust Stock for each item
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

      return purchase;
    });

    return result;
  }

  async findAll() {
    return this.prisma.purchase.findMany({
      include: {
        supplier: true,
        items: {
          include: { product: true },
        },
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
        items: {
          include: { product: true },
        },
        createdBy: true,
      },
    });
  }
}
