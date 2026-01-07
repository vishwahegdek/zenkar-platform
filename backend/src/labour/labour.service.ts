import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LabourService {
  constructor(private prisma: PrismaService) {}

  async getDailyView(date: Date) {
    // 1. Get all labourers (Active only)
    const labourers = await this.prisma.labourer.findMany({
      where: { isDeleted: false },
      orderBy: { name: 'asc' },
    });

    // 2. Get attendance records for this date
    // 2. Get attendance records for this date
    // FIX: Use strict UTC range to avoid local timezone (IST) shifts causing overlap
    const dateStr = date.toISOString().split('T')[0];
    const startOfDay = new Date(`${dateStr}T00:00:00.000Z`);
    const endOfDay = new Date(`${dateStr}T23:59:59.999Z`);

    const attendances = await this.prisma.attendance.findMany({
      where: {
        date: { gte: startOfDay, lte: endOfDay },
        labourerId: { in: labourers.map((c) => c.id) },
      },
    });

    // 3. Get paymnets (Expenses) for this date
    const expenses = await this.prisma.expense.findMany({
      where: {
        date: { gte: startOfDay, lte: endOfDay },
        labourerId: { in: labourers.map((c) => c.id) },
      },
    });

    // 4. Get active settlements for context (Optimization: could be one query with labourers)
    const settlements = await this.prisma.labourSettlement.findMany({
      where: { labourerId: { in: labourers.map((c) => c.id) } },
      orderBy: { settlementDate: 'desc' },
      distinct: ['labourerId'],
    });

    // 5. Merge data
    return labourers.map((labourer) => {
      const att = attendances.find((a) => a.labourerId === labourer.id);
      const exp = expenses.find((e) => e.labourerId === labourer.id);
      const settlement = settlements.find((s) => s.labourerId === labourer.id);

      return {
        id: labourer.id,
        name: labourer.name,
        defaultDailyWage: labourer.defaultDailyWage,
        attendance: att ? att.value : 0,
        amount: exp ? exp.amount : 0,
        lastSettlementDate: settlement ? settlement.settlementDate : null, // Send back to frontend
      };
    });
  }

  async updateDailyView(
    userId: number,
    dateStr: string,
    updates: { contactId: number; attendance: number; amount: number }[],
  ) {
    // Note: Frontend sends 'contactId' which maps to 'labourerId'
    const date = new Date(dateStr);

    // 1. Pre-fetch settlements for all involved labourers to enforce immutability
    const labourerIds = updates.map((u) => u.contactId);
    const settlements = await this.prisma.labourSettlement.findMany({
      where: { labourerId: { in: labourerIds } },
      orderBy: { settlementDate: 'desc' },
      distinct: ['labourerId'], // Get unique latest per labourer
    });

    const settlementMap = new Map();
    settlements.forEach((s) =>
      settlementMap.set(s.labourerId, s.settlementDate),
    );

    for (const update of updates) {
      const labourerId = update.contactId;

      // IMMUTABILITY CHECK
      const lastSettlementDate = settlementMap.get(labourerId);
      if (lastSettlementDate && date <= lastSettlementDate) {
        // Skip immutability violation silently to allow other valid updates to proceed
        continue;
      }

      // A. Attendance
      if (update.attendance > 0) {
        const existing = await this.prisma.attendance.findFirst({
          where: { labourerId, date },
        });

        if (existing) {
          if (Number(existing.value) !== update.attendance) {
            await this.prisma.attendance.update({
              where: { id: existing.id },
              data: { value: update.attendance } as any,
            });
          }
        } else {
          await this.prisma.attendance.create({
            data: { labourerId, date, value: update.attendance } as any,
          });
        }
      } else {
        await this.prisma.attendance.deleteMany({
          where: { labourerId, date },
        });
      }

      // B. Expense (Payment)
      if (update.amount > 0) {
        let labourCategory = await this.prisma.expenseCategory.findUnique({
          where: { name: 'Labour' },
        });
        if (!labourCategory) {
          labourCategory = await this.prisma.expenseCategory.create({
            data: { name: 'Labour' },
          });
        }
        const categoryId = labourCategory.id;

        const existingExp = await this.prisma.expense.findFirst({
          where: { labourerId, date: { equals: date } },
        });

        if (existingExp) {
          if (Number(existingExp.amount) !== update.amount) {
            await this.prisma.expense.update({
              where: { id: existingExp.id },
              data: { amount: update.amount, updatedById: userId } as any,
            });
          }
        } else {
          await this.prisma.expense.create({
            data: {
              labourerId,
              categoryId,
              amount: update.amount,
              date: date,
              description: 'Daily Labour Wage',
              // createdById: userId // Optional: could still track who created it if passed in updates
            } as any,
          });
        }
      } else {
        await this.prisma.expense.deleteMany({
          where: { labourerId, date: date },
        });
      }
    }

    return { success: true };
  }

  async getReport(
    from?: string,
    to?: string,
    labourerId?: number,
    settlementId?: number,
  ) {
    const where: any = { isDeleted: false };
    if (labourerId) {
      where.id = labourerId;
    }

    const labourers = await this.prisma.labourer.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        settlements: {
          orderBy: { settlementDate: 'desc' },
          take: 1,
        },
      },
    });

    const reportData: any[] = [];

    for (const labourer of labourers) {
      // Determine Start Date (Zero Date)
      let startDate: Date | undefined;
      let lastSettlement = labourer.settlements
        ? labourer.settlements[0]
        : null;

      // HISTORY MODE: Fetch specific settlement context
      if (settlementId) {
        // If viewing history, we need the settlement defined by ID
        // And the *previous* settlement relative to that one to define range
        const targetSettlement = await this.prisma.labourSettlement.findUnique({
          where: { id: settlementId },
        });
        if (!targetSettlement || targetSettlement.labourerId !== labourer.id)
          continue; // Skip if unrelated

        // Find the settlement immediately PRECEDING this one
        const prevSettlement = await this.prisma.labourSettlement.findFirst({
          where: {
            labourerId: labourer.id,
            settlementDate: { lt: targetSettlement.settlementDate },
          },
          orderBy: { settlementDate: 'desc' },
        });

        // Range: (Prev Date) < Data <= (Target Date)
        startDate = prevSettlement ? prevSettlement.settlementDate : undefined;

        // Override 'to' date to be the settlement date
        // Effectively showing the report AS IT WAS on that day
        // We must respect the settlement snapshot logic
        // Actually, we should use the snapshot values directly?
        // The user wants to see the "Old Report".
        // Re-calculating offers transparency, but snapshot is safer.
        // Let's re-calculate to allow "View Details".

        lastSettlement = prevSettlement || null; // The "Base" for this period

        // Force date filter to end at settlement date
        // The report logic below takes 'to', so we set it.
        // Note: createSettlement calculates based on <= date.
        // So 'to' should be targetSettlement.settlementDate.

        // We need to bypass the 'from/to' arguments if in history mode usually
      }

      if (lastSettlement) {
        startDate = lastSettlement.settlementDate;
      }

      const attWhere: any = { labourerId: labourer.id };
      const expWhere: any = { labourerId: labourer.id };

      const dateFilter: any = {};

      // 1. Base filter: After settlement
      if (startDate) {
        dateFilter.gt = startDate;
      }

      // 2. User Override / History Mode
      if (settlementId) {
        const target = await this.prisma.labourSettlement.findUnique({
          where: { id: settlementId },
        });
        if (target) {
          delete dateFilter.gt; // Reset
          // If there is a start date (prev settlement), use GT
          if (startDate) dateFilter.gt = startDate;
          dateFilter.lte = target.settlementDate;
        }
      } else {
        if (from) {
          delete dateFilter.gt;
          dateFilter.gte = new Date(from);
        }

        if (to) {
          dateFilter.lte = new Date(to);
        }
      }

      if (Object.keys(dateFilter).length > 0) {
        attWhere.date = dateFilter;
        expWhere.date = dateFilter;
      }

      const attendances = await this.prisma.attendance.findMany({
        where: attWhere,
        orderBy: { date: 'asc' },
      });

      const expenses = await this.prisma.expense.findMany({
        where: expWhere,
        orderBy: { date: 'asc' },
      });

      let totalDays = 0;
      let totalPaid = 0;
      const salary = Number(labourer.defaultDailyWage) || 0;

      const recordMap = new Map();

      attendances.forEach((a) => {
        const d = a.date.toISOString().split('T')[0];
        if (!recordMap.has(d))
          recordMap.set(d, { date: d, attendance: 0, amount: 0 });
        const rec = recordMap.get(d);
        rec.attendance = Number(a.value);
        totalDays += rec.attendance;
      });

      expenses.forEach((e) => {
        const d = e.date.toISOString().split('T')[0];
        if (!recordMap.has(d))
          recordMap.set(d, { date: d, attendance: 0, amount: 0 });
        const rec = recordMap.get(d);
        rec.amount += Number(e.amount);
        totalPaid += rec.amount;
      });

      const records = Array.from(recordMap.values()).sort((a, b) =>
        a.date.localeCompare(b.date),
      );
      const totalSalary = totalDays * salary;

      // Opening Balance Logic
      let openingBalance = 0;
      if (lastSettlement && lastSettlement.isCarryForward) {
        openingBalance = Number(lastSettlement.netBalance);
      }

      const balance = openingBalance + totalSalary - totalPaid;

      reportData.push({
        id: labourer.id,
        name: labourer.name,
        salary: Number(salary),
        defaultDailyWage: Number(salary),
        totalDays,
        totalSalary,
        totalPaid,
        balance,
        openingBalance,
        lastSettlementDate: lastSettlement
          ? lastSettlement.settlementDate
          : null,
        records,
      });
    }

    return reportData;
  }

  async createLabourer(data: { name: string; defaultDailyWage: number }) {
    return this.prisma.labourer.create({
      data: {
        // userId,
        name: data.name,
        defaultDailyWage: data.defaultDailyWage,
      },
    });
  }

  async updateLabourer(
    id: number,
    data: { name: string; defaultDailyWage: number },
  ) {
    // Ensure specific user owns it - REMOVED for shared access
    const existing = await this.prisma.labourer.findFirst({ where: { id } });
    if (!existing) throw new Error('Labourer not found');

    return this.prisma.labourer.update({
      where: { id },
      data: {
        name: data.name,
        defaultDailyWage: data.defaultDailyWage,
      },
    });
  }

  async deleteLabourer(id: number) {
    const existing = await this.prisma.labourer.findFirst({ where: { id } });
    if (!existing) throw new Error('Labourer not found');

    // Soft Delete
    return this.prisma.labourer.update({
      where: { id },
      data: { isDeleted: true },
    });
  }

  async createSettlement(
    labourerId: number,
    settlementDate: Date,
    note?: string,
    isCarryForward: boolean = false,
  ) {
    // 1. Calculate stats up to this date
    // Reuse logic mostly, but bounded by <= date
    const stats = await this.getReport(
      undefined,
      settlementDate.toISOString(),
      labourerId,
    );
    const stat = stats[0]; // Specific labourer

    if (!stat) throw new Error('Labourer stats not found');

    // 2. Create Settlement Snapshot
    return this.prisma.labourSettlement.create({
      data: {
        labourerId,
        settlementDate,
        totalAttendance: stat.totalDays,
        totalPayable: stat.totalSalary, // Salary generated
        totalPaid: stat.totalPaid,
        netBalance: stat.balance,
        wageSnapshot: stat.salary, // Save the wage at this point
        note,
        isCarryForward,
      },
    });
  }

  async getSettlements(labourerId: number) {
    return this.prisma.labourSettlement.findMany({
      where: { labourerId },
      orderBy: { settlementDate: 'desc' },
    });
  }
}
