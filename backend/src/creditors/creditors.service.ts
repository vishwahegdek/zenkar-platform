import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCreditorDto } from './dto/create-creditor.dto';
import { UpdateCreditorDto } from './dto/update-creditor.dto';
import { CreateTransactionDto } from './dto/create-transaction.dto';

@Injectable()
export class CreditorsService {
  constructor(private prisma: PrismaService) {}

  async create(createCreditorDto: CreateCreditorDto, userId: number) {
    return this.prisma.creditor.create({
      data: {
        ...createCreditorDto,
        userId,
      },
    });
  }

  async findAll(userId: number) {
    const creditors = await this.prisma.creditor.findMany({
      where: { userId },
      include: {
        transactions: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Calculate dynamic balance for each creditor
    return creditors.map(creditor => {
      const balance = creditor.transactions.reduce((acc, tx) => {
        const amount = Number(tx.amount);
        if (tx.type === 'DEBT_INC') return acc + amount;
        if (tx.type === 'DEBT_DEC') return acc - amount;
        return acc;
      }, 0);
      
      return { ...creditor, balance };
    });
  }

  async findOne(id: number, userId: number) {
    const creditor = await this.prisma.creditor.findFirst({
      where: { id, userId },
      include: {
        transactions: {
          orderBy: { date: 'desc' },
        },
      },
    });

    if (!creditor) {
      throw new NotFoundException(`Creditor with ID ${id} not found`);
    }

    const balance = creditor.transactions.reduce((acc, tx) => {
      const amount = Number(tx.amount);
      if (tx.type === 'DEBT_INC') return acc + amount;
      if (tx.type === 'DEBT_DEC') return acc - amount;
      return acc;
    }, 0);

    return { ...creditor, balance };
  }

  async update(id: number, updateCreditorDto: UpdateCreditorDto, userId: number) {
    // Ensure ownership
    await this.findOne(id, userId);
    
    return this.prisma.creditor.update({
      where: { id },
      data: updateCreditorDto,
    });
  }

  async remove(id: number, userId: number) {
    // Ensure ownership
    await this.findOne(id, userId);

    return this.prisma.creditor.delete({
      where: { id },
    });
  }

  async addTransaction(id: number, createTransactionDto: CreateTransactionDto, userId: number) {
    // Ensure creditor exists and belongs to user
    await this.findOne(id, userId);

    return this.prisma.creditorTransaction.create({
      data: {
        ...createTransactionDto,
        creditorId: id,
      },
    });
  }
}
