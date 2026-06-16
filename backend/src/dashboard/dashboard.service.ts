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
          (SELECT COALESCE(SUM("total_amount"), 0) FROM "orders" WHERE "order_date" >= ${dateFilter} AND "order_date" < ${dateFilter} + INTERVAL '1 day' AND "is_deleted" = false AND "status" NOT IN ('CANCELLED', 'ENQUIRED')) as "totalSales",
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

  async getCashflow(fromStr: string, toStr: string, q?: string) {
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
      include: { category: true, recipient: true },
    });

    // 2.5 Fetch Labour Payments
    const labourPayments = await this.prisma.labourPayment.findMany({
      where: { date: { gte: from, lte: to } },
      include: { labourer: true },
    });

    let entries: any[] = [];

    // Process Payments (Inflow)
    payments.forEach((p) => {
      entries.push({
        id: `pay-${p.id}`,
        date: p.date,
        time: p.createdAt,
        amount: Number(p.amount),
        type: 'IN',
        category: 'Income',
        description: `Order #${p.order?.orderNo || p.orderId}`,
        party: p.order?.customer?.name || 'Customer',
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
        description: e.description || 'Expense',
        party: e.recipient?.name || 'Unknown',
        source: 'Expense',
      });
    });

    // Process Labour Payments (Outflow)
    labourPayments.forEach((p) => {
      entries.push({
        id: `lab-${p.id}`,
        date: p.date,
        time: p.createdAt,
        amount: Number(p.amount),
        type: 'OUT',
        category: 'Labour Payment',
        description: p.note || 'Labour Wage',
        party: p.labourer?.name || 'Unknown',
        source: 'Labour',
      });
    });



    // Filter if query is present
    if (q) {
      const lowerQ = q.toLowerCase();
      entries = entries.filter((e) => 
        e.category.toLowerCase().includes(lowerQ) ||
        e.description.toLowerCase().includes(lowerQ) ||
        e.party.toLowerCase().includes(lowerQ) ||
        e.source.toLowerCase().includes(lowerQ) ||
        e.amount.toString().includes(lowerQ)
      );
    }

    // Sort by time (latest first for display, but maybe earliest first for timeline?)
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

  async getChartData(fromStr: string, toStr: string, timeframe: 'day' | 'week' | 'month') {
    try {
      const from = new Date(fromStr + 'T00:00:00.000Z');
      const to = new Date(toStr + 'T23:59:59.999Z');

      console.log('Fetching chart data internal', { from, to, timeframe });

      const [payments, expenses, labourPayments] = await Promise.all([
        this.prisma.payment.findMany({
          where: { date: { gte: from, lte: to } },
        }),
        this.prisma.expense.findMany({
          where: { date: { gte: from, lte: to } },
        }),
        this.prisma.labourPayment.findMany({
          where: { date: { gte: from, lte: to } },
        }),
      ]);

      const buckets = new Map<string, { income: number; expense: number }>();

      const getBucketKey = (date: Date) => {
        const d = new Date(date);
        if (timeframe === 'month') return d.toISOString().slice(0, 7); // YYYY-MM
        if (timeframe === 'week') {
          const day = d.getDay();
          const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
          const monday = new Date(d);
          monday.setDate(diff);
          return monday.toISOString().slice(0, 10); // YYYY-MM-DD (Monday)
        }
        return d.toISOString().slice(0, 10); // YYYY-MM-DD
      };

      const addToBucket = (date: Date, amount: number, type: 'income' | 'expense') => {
        const key = getBucketKey(date);
        if (!buckets.has(key)) buckets.set(key, { income: 0, expense: 0 });
        const bucket = buckets.get(key);
        if (type === 'income') bucket!.income += amount;
        else bucket!.expense += amount;
      };

      payments.forEach(p => addToBucket(p.date, Number(p.amount), 'income'));
      expenses.forEach(e => addToBucket(e.date, Number(e.amount), 'expense'));
      labourPayments.forEach(p => addToBucket(p.date, Number(p.amount), 'expense'));

      const result = Array.from(buckets.entries())
        .map(([date, data]) => ({ date, ...data }))
        .sort((a, b) => a.date.localeCompare(b.date));
      
      return result;
    } catch (e) {
      console.error('Chart Error:', e);
      const fs = require('fs');
      try {
        fs.appendFileSync('debug_error.log', `Error in getChartData: ${e.stack}\n`);
      } catch (logErr) {
        console.error('Failed to write to debug_error.log', logErr);
      }
      throw e;
    }
  }

  async getSalesAnalytics(fromStr: string, toStr: string, timeframe: 'day' | 'week' | 'month' = 'day') {
    const from = new Date(fromStr + 'T00:00:00.000Z');
    const to = new Date(toStr + 'T23:59:59.999Z');

    // Fetch valid orders
    const orders = await this.prisma.order.findMany({
      where: {
        orderDate: { gte: from, lte: to },
        isDeleted: false,
        status: { notIn: ['CANCELLED', 'ENQUIRED'] }
      },
      include: {
        items: {
          include: { product: { include: { category: true } } }
        }
      }
    });

    let totalSales = 0;
    let totalDiscount = 0;
    const salesTrend = new Map<string, number>();
    const categorySales = new Map<string, number>();
    const productSales = new Map<string, { quantity: number; revenue: number; name: string }>();

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

    orders.forEach(order => {
      const orderRevenue = Number(order.totalAmount) - Number(order.discount || 0);
      totalSales += orderRevenue;
      totalDiscount += Number(order.discount || 0);

      // Daily trend
      const dateKey = getBucketKey(order.orderDate);
      salesTrend.set(dateKey, (salesTrend.get(dateKey) || 0) + orderRevenue);

      // Item breakdown
      order.items.forEach(item => {
        if (item.status === 'CONFIRMED' || item.status === 'DELIVERED') { 
          const itemRevenue = Number(item.lineTotal);
          
          // Category breakdown
          const categoryName = item.product?.category?.name || 'Uncategorized';
          categorySales.set(categoryName, (categorySales.get(categoryName) || 0) + itemRevenue);

          // Product breakdown
          const productName = item.productName || item.product?.name || 'Unknown Product';
          const existingProd = productSales.get(productName) || { quantity: 0, revenue: 0, name: productName };
          existingProd.quantity += Number(item.quantity);
          existingProd.revenue += itemRevenue;
          productSales.set(productName, existingProd);
        }
      });
    });

    const averageOrderValue = orders.length > 0 ? totalSales / orders.length : 0;

    return {
      summary: {
        totalSales,
        totalOrders: orders.length,
        averageOrderValue,
        totalDiscount
      },
      trend: Array.from(salesTrend.entries())
        .map(([date, revenue]) => ({ date, revenue }))
        .sort((a, b) => a.date.localeCompare(b.date)),
      byCategory: Array.from(categorySales.entries())
        .map(([name, revenue]) => ({ name, revenue }))
        .sort((a, b) => b.revenue - a.revenue),
      topProducts: Array.from(productSales.values())
        .sort((a, b) => b.revenue - a.revenue)
    };
  }
}
