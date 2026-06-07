import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { LedgerService } from '../ledger/ledger.service';

@Injectable()
export class ExpensesService {
  constructor(
    private prisma: PrismaService,
    private ledgerService: LedgerService,
  ) {}

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

  async createExpense(
    userId: number,
    data: {
      amount: number;
      categoryId: number;
      description?: string;
      recipientName?: string;
      contactId?: number;
      recipientId?: number;
      paymentMethod?: string;
      date?: Date | string;
    },
  ) {
    let recipientId: number | null = data.recipientId || null;

    // Resolve Recipient
    if (data.recipientName) {
      // Check if exists
      let recipient = await this.prisma.recipient.findFirst({
        where: {
          name: { equals: data.recipientName, mode: 'insensitive' },
        },
      });

      if (!recipient) {
        // Create New Recipient
        recipient = await this.prisma.recipient.create({
          data: {
            userId,
            name: data.recipientName,
            contactId: data.contactId || undefined, // Link if provided
          },
        });
      }
      recipientId = recipient.id;
    }

    const expense = await this.prisma.expense.create({
      data: {
        amount: data.amount,
        categoryId: data.categoryId,
        description: data.description,
        recipientId: recipientId,
        method: data.paymentMethod || 'CASH',
        date: data.date ? new Date(data.date) : new Date(),
        createdById: userId,
      },
      include: {
        category: true,
        recipient: {
          include: { contact: true },
        },
        labourer: true,
      },
    });

    // Ledger Entry for Expense
    try {
      const cashAccount = await this.ledgerService.getSystemAccount('CASH');
      let debitAccountId: number | null = null;

      // General category expense account
      let expenseAccount = await this.prisma.ledgerAccount.findFirst({
        where: { name: `Expense Category: ${expense.category.name}` },
      });
        if (!expenseAccount) {
          expenseAccount = await this.prisma.ledgerAccount.create({
            data: {
              name: `Expense Category: ${expense.category.name}`,
              type: 'EXPENSE',
              subType: 'GENERAL_EXPENSE',
            },
          });
        }
        debitAccountId = expenseAccount.id;

      await this.ledgerService.recordDoubleEntry({
        transactionId: `EXPENSE-${expense.id}`,
        sourceType: 'EXPENSE',
        sourceId: expense.id,
        date: expense.date,
        debitAccountId,
        creditAccountId: cashAccount.id,
        amount: Number(expense.amount),
        note: expense.description || `Expense of ${expense.amount} under ${expense.category.name}`,
      });
    } catch (err) {
      console.error(`Failed to record ledger entries for Expense #${expense.id}: ${err.message}`);
    }

    return expense;
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

  async findOne(id: number) {
    return this.prisma.expense.findUnique({
      where: { id },
      include: {
        category: true,
        recipient: true,
        labourer: true,
      },
    });
  }

  async updateExpense(id: number, data: any, userId?: number) {
    let recipientId = data.recipientId;

    // Resolve Recipient if name provided (similar to create)
    if (data.recipientName) {
      let recipient = await this.prisma.recipient.findFirst({
        where: {
          name: { equals: data.recipientName, mode: 'insensitive' },
        },
      });

      if (!recipient) {
        recipient = await this.prisma.recipient.create({
          data: {
            userId: userId || 1, // Fallback if no userId context (shouldn't happen in auth routes)
            name: data.recipientName,
            contactId: data.contactId || undefined,
          },
        });
      }
      recipientId = recipient.id;
    }

    // Sanitize payload for Prisma
    const updateData: Prisma.ExpenseUpdateInput = {
      amount: data.amount,
      category: data.categoryId
        ? { connect: { id: data.categoryId } }
        : undefined,
      description: data.description,
      method: data.paymentMethod,
      date: data.date ? new Date(data.date) : undefined,
      recipient: recipientId ? { connect: { id: recipientId } } : undefined,
      updatedBy: userId ? { connect: { id: userId } } : undefined,
    };

    // Remove undefined keys
    Object.keys(updateData).forEach(
      (key) => updateData[key] === undefined && delete updateData[key],
    );

    const updated = await this.prisma.expense.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
        recipient: {
          include: { contact: true },
        },
        labourer: true,
      },
    });

    // Ledger update (Delete old and write new)
    try {
      await this.ledgerService.deleteEntriesForSource('EXPENSE', id);
      const cashAccount = await this.ledgerService.getSystemAccount('CASH');
      let debitAccountId: number | null = null;

      let expenseAccount = await this.prisma.ledgerAccount.findFirst({
        where: { name: `Expense Category: ${updated.category.name}` },
      });
        if (!expenseAccount) {
          expenseAccount = await this.prisma.ledgerAccount.create({
            data: {
              name: `Expense Category: ${updated.category.name}`,
              type: 'EXPENSE',
              subType: 'GENERAL_EXPENSE',
            },
          });
        }
        debitAccountId = expenseAccount.id;

      await this.ledgerService.recordDoubleEntry({
        transactionId: `EXPENSE-${updated.id}`,
        sourceType: 'EXPENSE',
        sourceId: updated.id,
        date: updated.date,
        debitAccountId,
        creditAccountId: cashAccount.id,
        amount: Number(updated.amount),
        note: updated.description || `Expense of ${updated.amount} under ${updated.category.name}`,
      });
    } catch (err) {
      console.error(`Failed to update ledger entries for Expense #${id}: ${err.message}`);
    }

    return updated;
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
    const deleted = await this.prisma.expense.delete({
      where: { id },
    });

    try {
      await this.ledgerService.deleteEntriesForSource('EXPENSE', id);
    } catch (err) {
      console.error(`Failed to delete ledger entries for Expense #${id}: ${err.message}`);
    }

    return deleted;
  }
}
