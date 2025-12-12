import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ExpensesService {
  constructor(private prisma: PrismaService) {}



  async createCategory(name: string) {
    try {
      return await this.prisma.expenseCategory.create({
        data: { name },
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Category with this name already exists');
      }
      throw error;
    }
  }

  async findAllCategories() {
    return this.prisma.expenseCategory.findMany();
  }

  // Payees deprecated -> Using ContactsService directly for management. 
  // Expense creation will use recipientId.

  async createExpense(userId: number, data: {
    amount: number;
    categoryId: number;
    description?: string;
    recipientName?: string; 
    contactId?: number;
    recipientId?: number;
    date?: Date | string;
  }) {
    let recipientId: number | null = data.recipientId || null;

    // Resolve Recipient
    if (data.recipientName) {
        // Check if exists
        let recipient = await this.prisma.recipient.findFirst({
            where: { 
                userId, 
                name: data.recipientName 
            }
        });

        if (!recipient) {
            // Create New Recipient
            recipient = await this.prisma.recipient.create({
                data: {
                    userId,
                    name: data.recipientName,
                    contactId: data.contactId || undefined // Link if provided
                }
            });
        }
        recipientId = recipient.id;
    }

    return this.prisma.expense.create({
      data: {
        amount: data.amount,
        categoryId: data.categoryId,
        description: data.description,
        recipientId: recipientId,
        date: data.date ? new Date(data.date) : new Date(),
        createdById: userId,
      },
    });
  }

  async findAllExpenses(params?: {
    skip?: number;
    take?: number;
    where?: Prisma.ExpenseWhereInput;
    orderBy?: Prisma.ExpenseOrderByWithRelationInput;
  }) {
    const { skip, take, where, orderBy } = params || {};
    return this.prisma.expense.findMany({
      skip,
      take,
      where,
      orderBy,
      include: {
        category: true,
        recipient: true,
        labourer: true,
      },
    });
  }

  async updateExpense(id: number, data: Prisma.ExpenseUpdateInput, userId?: number) {
    return this.prisma.expense.update({
      where: { id },
      data: { ...data, updatedById: userId } as any,
    });
  }

  async removeExpense(id: number, userId?: number) {
    // Hard delete or soft? Original code was delete. 
    // If we want audit, we might just track the deletion action or switch to soft delete.
    // Given the prompt "edited by", maybe we should keep hard delete or update.
    // Schema has no isDeleted for Expense? Let's check schema.
    // Schema had no isDeleted for Expense in my previous read (lines 238-256).
    // So hard delete. We can't set updatedById on a deleted record.
    // So logging audit is the only way, but user asked for "edited by" field on record. 
    // If deleted, record is gone. 
    // I'll just keep standard delete and maybe log it if AuditService was used here (it's not injected yet).
    // Since AuditService isn't injected, I'll just ignore userId for remove unless I switch to soft delete.
    return this.prisma.expense.delete({
      where: { id },
    });
  }
}
