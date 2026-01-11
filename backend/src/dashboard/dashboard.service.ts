import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats(dateStr?: string) {
    try {
      let dateFilter = 'CURRENT_DATE';
      const params: any[] = [];

      if (dateStr) {
        // dateStr should be YYYY-MM-DD
        dateFilter = '$1::date';
        params.push(dateStr);
      }

      const stats: any[] = await this.prisma.$queryRawUnsafe(
        `
        SELECT 
          (SELECT COUNT(*) FROM "payments" WHERE "date" >= ${dateFilter} AND "date" < ${dateFilter} + INTERVAL '1 day')::int as "transactionsCount",
          (SELECT COALESCE(SUM("total_amount"), 0) FROM "orders" WHERE "order_date" >= ${dateFilter} AND "order_date" < ${dateFilter} + INTERVAL '1 day' AND "is_deleted" = false) as "totalSales",
          (SELECT COALESCE(SUM("amount"), 0) FROM "payments" WHERE "date" >= ${dateFilter} AND "date" < ${dateFilter} + INTERVAL '1 day') as "totalReceived"
      `,
        ...params,
      );

      console.log('Dashboard Stats Query Result:', stats);

      const result = stats[0] || {
        transactionsCount: 0,
        totalSales: 0,
        totalReceived: 0,
      };

      return {
        transactionsCount: Number(result.transactionsCount || 0),
        totalSales: Number(result.totalSales || 0),
        totalReceived: Number(result.totalReceived || 0),
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  }

  async getPayments(dateStr?: string) {
    // Force simple date parsing to avoid timezone shifts
    // If dateStr is "2025-12-11", we want UTC start 2025-12-11T00:00:00.000Z to 2025-12-11T23:59:59.999Z
    // assuming the database stores dates in UTC or without timezone but conceptually "Day".

    // Default to today if not provided
    const targetDate = dateStr ? new Date(dateStr) : new Date();

    // Construct UTC Start of Day
    // We treat the input string as UTC date
    let startOfDay: Date;

    if (dateStr) {
      startOfDay = new Date(dateStr); // This usually parses as UTC midnight for YYYY-MM-DD
      // However, new Date('2025-12-11') in Browser might be local, but in Node it varies.
      // Safer to split and build UTC.
      // Actually, just append T00:00:00Z to ensure UTC.
      if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        startOfDay = new Date(`${dateStr}T00:00:00.000Z`);
      }
    } else {
      // For today, we want the current day in UTC context?
      // Or simply the current "Day" of the system?
      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const d = String(now.getDate()).padStart(2, '0');
      startOfDay = new Date(`${y}-${m}-${d}T00:00:00.000Z`);
    }

    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const payments = await this.prisma.payment.findMany({
      where: {
        date: {
          gte: startOfDay,
          lt: endOfDay,
        },
      },
      orderBy: { createdAt: 'desc' }, // Latest entry first
      include: {
        order: {
          select: {
            id: true,
            orderNo: true,
            customer: { select: { name: true } },
          },
        },
      },
    });

    return payments.map((p) => ({
      id: p.id,
      date: p.date,
      timestamp: p.createdAt, // Use for display time
      amount: p.amount,
      method: p.note, // We store method in note
      customerName: p.order?.customer?.name || 'Unknown',
      orderId: p.orderId,
      orderNo: p.order?.orderNo,
    }));
  }

  async getRecentActivities() {
    // Get last 20 audit logs
    return this.prisma.auditLog.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { username: true } } },
    });
  }

  async getCashflow(fromStr: string, toStr: string) {
    const from = new Date(fromStr + 'T00:00:00.000Z');
    const to = new Date(toStr + 'T23:59:59.999Z');

    // 1. Fetch Income (Payments from orders)
    const payments = await this.prisma.payment.findMany({
      where: { date: { gte: from, lte: to } },
      include: { order: { include: { customer: true } } },
    });

    // 2. Fetch Expenses
    const expenses = await this.prisma.expense.findMany({
      where: { date: { gte: from, lte: to } },
      include: { category: true, recipient: true, labourer: true },
    });

    // 3. Fetch Finance Transactions
    const financeTxs = await this.prisma.financeTransaction.findMany({
      where: { date: { gte: from, lte: to } },
      include: { party: { include: { contact: true } } },
    });

    const entries: any[] = [];

    // Process Payments (Inflow)
    payments.forEach((p) => {
      entries.push({
        id: `pay-${p.id}`,
        date: p.date,
        time: p.createdAt,
        amount: Number(p.amount),
        type: 'IN',
        category: 'Income',
        description: `Order #${p.order?.orderNo || p.orderId} - ${p.order?.customer?.name || 'Customer'}`,
        source: 'Payment',
      });
    });

    // Process Expenses (Outflow)
    expenses.forEach((e) => {
      entries.push({
        id: `exp-${e.id}`,
        date: e.date,
        time: e.createdAt,
        amount: Number(e.amount),
        type: 'OUT',
        category: e.category?.name || 'Expense',
        description: e.description || `Expense to ${e.recipient?.name || e.labourer?.name || 'Unknown'}`,
        source: 'Expense',
      });
    });

    // Process Finance Transactions
    financeTxs.forEach((tx) => {
      const partyName = tx.party?.contact?.name || tx.party?.name || 'Finance Party';
      let type: 'IN' | 'OUT';
      let category: string;

      switch (tx.type) {
        case 'BORROWED':
          type = 'IN';
          category = 'Lending (In)';
          break;
        case 'COLLECTED': // They paid us back
          type = 'IN';
          category = 'Lending (In)';
          break;
        case 'LENT':
          type = 'OUT';
          category = 'Lending (Out)';
          break;
        case 'REPAID': // We paid them back
          type = 'OUT';
          category = 'Lending (Out)';
          break;
        default:
          type = 'IN';
          category = 'Finance';
      }

      entries.push({
        id: `fin-${tx.id}`,
        date: tx.date,
        time: tx.createdAt,
        amount: Number(tx.amount),
        type,
        category,
        description: `${tx.type}: ${partyName}${tx.note ? ` (${tx.note})` : ''}`,
        source: 'Finance',
      });
    });

    // Sort by time (latest first for display, but maybe earliest first for timeline?)
    // User asked "what came in/out why". Usually latest at top is good for dash.
    entries.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

    const summary = entries.reduce(
      (acc, entry) => {
        if (entry.type === 'IN') acc.totalIn += entry.amount;
        else acc.totalOut += entry.amount;
        return acc;
      },
      { totalIn: 0, totalOut: 0 },
    );

    return {
      entries,
      summary: {
        ...summary,
        net: summary.totalIn - summary.totalOut,
      },
      range: { from: fromStr, to: toStr },
    };
  }
}
