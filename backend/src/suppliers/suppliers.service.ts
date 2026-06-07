import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LedgerService } from '../ledger/ledger.service';

@Injectable()
export class SuppliersService {
  constructor(
    private prisma: PrismaService,
    private ledgerService: LedgerService,
  ) {}

  async create(data: { name: string; phone?: string; address?: string; userId?: number }) {
    const supplier = await this.prisma.supplier.create({
      data: {
        name: data.name,
        phone: data.phone,
        address: data.address,
        userId: data.userId,
      },
    });

    // Automatically create a ledger account for the new supplier
    await this.ledgerService.getOrCreateAccountForEntity(
      'SUPPLIER',
      supplier.id,
      supplier.name,
    );

    return supplier;
  }

  async findAll(query?: string) {
    const whereCondition: any = { isDeleted: false };
    if (query) {
      whereCondition.name = { contains: query, mode: 'insensitive' };
    }
    
    return this.prisma.supplier.findMany({
      where: whereCondition,
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: number) {
    const supplier = await this.prisma.supplier.findUnique({
      where: { id },
    });
    if (!supplier || supplier.isDeleted) {
      throw new NotFoundException(`Supplier with ID ${id} not found`);
    }
    return supplier;
  }

  async update(id: number, data: { name?: string; phone?: string; address?: string }) {
    const existing = await this.findOne(id);
    const updated = await this.prisma.supplier.update({
      where: { id },
      data,
    });

    // Update ledger account name if name changed
    if (data.name && data.name !== existing.name) {
      const ledgerAcc = await this.prisma.ledgerAccount.findFirst({
        where: { supplierId: id },
      });
      if (ledgerAcc) {
        await this.prisma.ledgerAccount.update({
          where: { id: ledgerAcc.id },
          data: { name: `Supplier: ${data.name}` },
        });
      }
    }

    return updated;
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.supplier.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });
  }
}
