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
      paymentAccountId?: number;
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
      },
    });

    // Ledger Entry for Expense
    try {
      const creditAccountId = data.paymentAccountId || (await this.ledgerService.getSystemAccount('CASH')).id;
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
        creditAccountId: creditAccountId,
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
      },
    });
  }

  async findOne(id: number) {
    return this.prisma.expense.findUnique({
      where: { id },
      include: {
        category: true,
        recipient: true,
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
      },
    });

    // Ledger update (Delete old and write new)
    try {
      await this.ledgerService.deleteEntriesForSource('EXPENSE', id);
      const creditAccountId = data.paymentAccountId || (await this.ledgerService.getSystemAccount('CASH')).id;
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
        creditAccountId: creditAccountId,
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

  async getExpenseAnalytics(params: {
    fromStr: string;
    toStr: string;
    categoryId?: number;
    paymentMethod?: string;
    timeframe?: 'day' | 'week' | 'month';
  }) {
    const timeframe = params.timeframe || 'day';
    const from = new Date(params.fromStr + 'T00:00:00.000Z');
    const to = new Date(params.toStr + 'T23:59:59.999Z');

    // Compute previous period of identical duration for comparison
    const durationMs = Math.max(1, to.getTime() - from.getTime());
    const prevTo = new Date(from.getTime() - 1);
    const prevFrom = new Date(prevTo.getTime() - durationMs);

    const where: Prisma.ExpenseWhereInput = {
      date: { gte: from, lte: to },
    };

    if (params.categoryId) {
      where.categoryId = params.categoryId;
    }

    if (params.paymentMethod && params.paymentMethod !== 'All') {
      where.method = params.paymentMethod;
    }

    const prevWhere: Prisma.ExpenseWhereInput = {
      date: { gte: prevFrom, lte: prevTo },
      ...(params.categoryId ? { categoryId: params.categoryId } : {}),
      ...(params.paymentMethod && params.paymentMethod !== 'All' ? { method: params.paymentMethod } : {}),
    };

    // Parallel fetch: current expenses & previous period sum
    const [expenses, prevExpenses] = await Promise.all([
      this.prisma.expense.findMany({
        where,
        include: {
          category: true,
          recipient: true,
        },
        orderBy: { date: 'asc' },
      }),
      this.prisma.expense.findMany({
        where: prevWhere,
        select: { amount: true },
      }),
    ]);

    const prevPeriodTotal = prevExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

    let totalExpenses = 0;
    const categoryMap = new Map<string, { id: number; name: string; amount: number; count: number }>();
    const methodMap = new Map<string, { method: string; amount: number; count: number }>();
    const recipientMap = new Map<string, { id?: number; name: string; amount: number; count: number; latestDate: string }>();
    const trendMap = new Map<string, { total: number; count: number; categories: Record<string, number> }>();

    const getBucketKey = (date: Date) => {
      const d = new Date(date);
      if (timeframe === 'month') return d.toISOString().slice(0, 7); // YYYY-MM
      if (timeframe === 'week') {
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(d);
        monday.setDate(diff);
        return monday.toISOString().slice(0, 10); // YYYY-MM-DD
      }
      return d.toISOString().slice(0, 10); // YYYY-MM-DD
    };

    expenses.forEach((expense) => {
      const amount = Number(expense.amount);
      totalExpenses += amount;

      // Trend
      const bucketKey = getBucketKey(expense.date);
      if (!trendMap.has(bucketKey)) {
        trendMap.set(bucketKey, { total: 0, count: 0, categories: {} });
      }
      const bucket = trendMap.get(bucketKey)!;
      bucket.total += amount;
      bucket.count += 1;
      const catName = expense.category?.name || 'Uncategorized';
      bucket.categories[catName] = (bucket.categories[catName] || 0) + amount;

      // Category breakdown
      const catId = expense.categoryId;
      if (!categoryMap.has(catName)) {
        categoryMap.set(catName, { id: catId, name: catName, amount: 0, count: 0 });
      }
      const catData = categoryMap.get(catName)!;
      catData.amount += amount;
      catData.count += 1;

      // Payment method
      const method = expense.method || 'CASH';
      if (!methodMap.has(method)) {
        methodMap.set(method, { method, amount: 0, count: 0 });
      }
      const methodData = methodMap.get(method)!;
      methodData.amount += amount;
      methodData.count += 1;

      // Recipient
      const recipientName = expense.recipient?.name || 'Direct / Miscellaneous';
      const dateStr = expense.date.toISOString().slice(0, 10);
      if (!recipientMap.has(recipientName)) {
        recipientMap.set(recipientName, {
          id: expense.recipientId || undefined,
          name: recipientName,
          amount: 0,
          count: 0,
          latestDate: dateStr,
        });
      }
      const recipientData = recipientMap.get(recipientName)!;
      recipientData.amount += amount;
      recipientData.count += 1;
      if (dateStr > recipientData.latestDate) {
        recipientData.latestDate = dateStr;
      }
    });

    const totalTransactions = expenses.length;
    const averageExpense = totalTransactions > 0 ? totalExpenses / totalTransactions : 0;
    const diff = totalExpenses - prevPeriodTotal;
    const percentageChange = prevPeriodTotal > 0 ? (diff / prevPeriodTotal) * 100 : null;
    const daysCount = Math.max(1, Math.round(durationMs / (1000 * 60 * 60 * 24)) + 1);
    const dailyAverage = totalExpenses / daysCount;

    // Sort categories
    const byCategory = Array.from(categoryMap.values())
      .map((c) => ({
        ...c,
        percentage: totalExpenses > 0 ? (c.amount / totalExpenses) * 100 : 0,
        averageAmount: c.count > 0 ? c.amount / c.count : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    // Sort methods
    const byPaymentMethod = Array.from(methodMap.values())
      .map((m) => ({
        ...m,
        percentage: totalExpenses > 0 ? (m.amount / totalExpenses) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    // Sort recipients
    const topRecipients = Array.from(recipientMap.values())
      .map((r) => ({
        ...r,
        percentage: totalExpenses > 0 ? (r.amount / totalExpenses) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);

    // High value expenses (top 10 largest)
    const highValueExpenses = [...expenses]
      .sort((a, b) => Number(b.amount) - Number(a.amount))
      .slice(0, 10)
      .map((e) => ({
        id: e.id,
        amount: Number(e.amount),
        date: e.date,
        description: e.description,
        categoryName: e.category?.name || 'Uncategorized',
        recipientName: e.recipient?.name || 'Direct / Miscellaneous',
        method: e.method,
      }));

    const topCategory = byCategory.length > 0 ? byCategory[0] : null;
    const topRecipient = topRecipients.length > 0 ? topRecipients[0] : null;

    return {
      summary: {
        totalExpenses,
        totalTransactions,
        averageExpense,
        prevPeriodTotal,
        percentageChange,
        dailyAverage,
        daysCount,
        topCategory: topCategory
          ? { name: topCategory.name, amount: topCategory.amount, percentage: topCategory.percentage }
          : null,
        topRecipient: topRecipient
          ? { name: topRecipient.name, amount: topRecipient.amount, percentage: topRecipient.percentage }
          : null,
      },
      trend: Array.from(trendMap.entries())
        .map(([date, data]) => ({
          date,
          amount: data.total,
          count: data.count,
          categories: data.categories,
        }))
        .sort((a, b) => a.date.localeCompare(b.date)),
      byCategory,
      byPaymentMethod,
      topRecipients,
      highValueExpenses,
    };
  }
}

