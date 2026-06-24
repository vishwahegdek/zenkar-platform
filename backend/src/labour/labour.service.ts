import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LedgerService } from '../ledger/ledger.service';

@Injectable()
export class LabourService {
  constructor(
    private prisma: PrismaService,
    private ledgerService: LedgerService,
  ) {}

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

    const cashAccount = await this.ledgerService.getSystemAccount('CASH');

    // 3. Get paymnets (LabourPayments) for this date
    const payments = await this.prisma.labourPayment.findMany({
      where: {
        date: { gte: startOfDay, lte: endOfDay },
        labourerId: { in: labourers.map((c) => c.id) },
        accountId: cashAccount.id, // ONLY fetch CASH payments
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
      const labourerPayments = payments.filter((p) => p.labourerId === labourer.id);
      const amount = labourerPayments.reduce((sum, p) => sum + Number(p.amount), 0);
      const settlement = settlements.find((s) => s.labourerId === labourer.id);

      return {
        id: labourer.id,
        name: labourer.name,
        defaultDailyWage: labourer.defaultDailyWage,
        attendance: att ? att.value : 0,
        amount: amount,
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

      // B. LabourPayment
      const cashAccount = await this.ledgerService.getSystemAccount('CASH');
      if (update.amount !== 0) {
        const existingPayments = await this.prisma.labourPayment.findMany({
          where: { labourerId, date: { equals: date }, accountId: cashAccount.id },
        });

        const currentTotal = existingPayments.reduce((sum, p) => sum + Number(p.amount), 0);

        if (currentTotal !== update.amount) {
          // Delete existing entries and their ledger records
          for (const ep of existingPayments) {
            await this.ledgerService.deleteEntriesForSource('LABOUR_PAYMENT', ep.id);
          }
          await this.prisma.labourPayment.deleteMany({
            where: { labourerId, date: date, accountId: cashAccount.id },
          });
          
          const p = await this.prisma.labourPayment.create({
            data: {
              labourerId,
              amount: update.amount,
              date: date,
              note: 'Daily Labour Wage',
              createdById: userId,
              accountId: cashAccount.id,
            } as any,
          });

          // Ledger Entry
          const labourerObj = await this.prisma.labourer.findUnique({ where: { id: labourerId } });
          const labourerAcc = await this.ledgerService.getOrCreateAccountForEntity('LABOURER', labourerId, labourerObj?.name || 'Labourer');
          await this.ledgerService.recordDoubleEntry({
            transactionId: `LABOUR-PAY-${p.id}`,
            sourceType: 'LABOUR_PAYMENT',
            sourceId: p.id,
            date: p.date,
            debitAccountId: labourerAcc.id,
            creditAccountId: cashAccount.id,
            amount: Number(p.amount),
            note: 'Daily Labour Wage Cash Payment',
          });
        }
      } else {
        const existingPayments = await this.prisma.labourPayment.findMany({
          where: { labourerId, date: date, accountId: cashAccount.id },
        });
        for (const ep of existingPayments) {
           await this.ledgerService.deleteEntriesForSource('LABOUR_PAYMENT', ep.id);
        }
        await this.prisma.labourPayment.deleteMany({
          where: { labourerId, date: date, accountId: cashAccount.id },
        });
      }
    }

    return { success: true };
  }

  async getAnalytics(fromStr: string, toStr: string, labourerId?: number) {
    const from = new Date(fromStr + 'T00:00:00.000Z');
    const to = new Date(toStr + 'T23:59:59.999Z');

    const whereClause: any = { date: { gte: from, lte: to } };
    if (labourerId) {
       whereClause.labourerId = labourerId;
    }

    const paymentsWhereClause: any = { date: { gte: from, lte: to } };
    if (labourerId) {
       paymentsWhereClause.labourerId = labourerId;
    }

    const [attendances, payments] = await Promise.all([
      this.prisma.attendance.findMany({
        where: whereClause,
        include: { labourer: true }
      }),
      this.prisma.labourPayment.aggregate({
        where: paymentsWhereClause,
        _sum: { amount: true }
      })
    ]);

    const trendMap = new Map<string, number>();
    for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
        trendMap.set(d.toISOString().slice(0, 10), 0);
    }

    const labourerMap = new Map<number, { id: number, name: string, totalDays: number }>();
    
    let totalAttendance = 0;

    attendances.forEach(att => {
        const val = Number(att.value);
        totalAttendance += val;
        
        const dateKey = att.date.toISOString().slice(0, 10);
        trendMap.set(dateKey, (trendMap.get(dateKey) || 0) + val);

        if (!labourerMap.has(att.labourerId)) {
            labourerMap.set(att.labourerId, { id: att.labourerId, name: att.labourer.name, totalDays: 0 });
        }
        labourerMap.get(att.labourerId)!.totalDays += val;
    });

    const diffDays = Math.max(1, Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)));
    const averageDaily = totalAttendance / diffDays;
    const totalPossibleDays = diffDays * Math.max(1, labourerMap.size);
    const attendancePercentage = totalPossibleDays > 0 ? (totalAttendance / totalPossibleDays) * 100 : 0;

    return {
        summary: {
            totalManDays: totalAttendance,
            averageDailyAttendance: Number(averageDaily.toFixed(1)),
            activeLabourers: labourerMap.size,
            totalPossibleDays,
            attendancePercentage: Number(attendancePercentage.toFixed(1)),
            totalAmountPaid: Number(payments._sum.amount || 0)
        },
        trend: Array.from(trendMap.entries())
            .map(([date, attendance]) => ({ date, attendance }))
            .sort((a, b) => a.date.localeCompare(b.date)),
        byLabourer: Array.from(labourerMap.values())
            .sort((a, b) => b.totalDays - a.totalDays)
    };
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
      const payWhere: any = { labourerId: labourer.id };

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
        payWhere.date = dateFilter;
      }

      const attendances = await this.prisma.attendance.findMany({
        where: attWhere,
        orderBy: { date: 'asc' },
      });

      const payments = await this.prisma.labourPayment.findMany({
        where: payWhere,
        orderBy: { date: 'asc' },
        include: { account: true },
      });

      let totalDays = 0;
      let totalPaid = 0;
      const salary = Number(labourer.defaultDailyWage) || 0;

      const recordMap = new Map();

      attendances.forEach((a) => {
        const d = a.date.toISOString().split('T')[0];
        if (!recordMap.has(d))
          recordMap.set(d, { date: d, attendance: 0, payments: [] });
        const rec = recordMap.get(d);
        rec.attendance += Number(a.value);
        totalDays += Number(a.value);
      });

      payments.forEach((p) => {
        const d = p.date.toISOString().split('T')[0];
        if (!recordMap.has(d))
          recordMap.set(d, { date: d, attendance: 0, payments: [] });
        const rec = recordMap.get(d);
        const accName = p.account ? p.account.name.split(':')[0] : 'Cash';
        rec.payments.push({ amount: Number(p.amount), accountName: accName, note: p.note });
        totalPaid += Number(p.amount);
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

    const updatedLabourer = await this.prisma.labourer.update({
      where: { id },
      data: {
        name: data.name,
        defaultDailyWage: data.defaultDailyWage,
      },
    });

    // Keep Ledger Account name in sync
    await this.ledgerService.getOrCreateAccountForEntity('LABOURER', id, data.name);

    return updatedLabourer;
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
    const settlement = await this.prisma.labourSettlement.create({
      data: {
        labourerId,
        settlementDate,
        totalAttendance: stat.totalDays,
        totalPayable: stat.totalSalary, // Salary generated
        totalPaid: stat.totalPaid,
        netBalance: isCarryForward ? stat.balance : 0,
        wageSnapshot: stat.salary, // Save the wage at this point
        note,
        isCarryForward,
      },
    });

    // Record ledger entries for settlement
    try {
      const labourer = await this.prisma.labourer.findUnique({
        where: { id: labourerId },
      });
      if (labourer) {
        const labourerAccount = await this.ledgerService.getOrCreateAccountForEntity(
          'LABOURER',
          labourerId,
          labourer.name,
        );
        const wageExpenseAccount = await this.ledgerService.getSystemAccount('WAGE_EXPENSE');
        const cashAccount = await this.ledgerService.getSystemAccount('CASH');

        const transactionId = `SETTLEMENT-${settlement.id}`;

        // Step 1: Recognize what they earned (totalPayable)
        if (Number(settlement.totalPayable) > 0) {
          await this.ledgerService.recordDoubleEntry({
            transactionId,
            sourceType: 'LABOUR_SETTLEMENT',
            sourceId: settlement.id,
            date: settlement.settlementDate,
            debitAccountId: wageExpenseAccount.id,
            creditAccountId: labourerAccount.id,
            amount: Number(settlement.totalPayable),
            note: `Wage Expense accrued for labourer ${labourer.name} up to ${settlement.settlementDate.toISOString().split('T')[0]}`,
          });
        }

        // Step 2: Recognize what we paid them (totalPaid)
        // Payments now hit the ledger directly when recorded, so we skip bulk recording here.
        // Step 3: Write off the difference if Settle Clear (!isCarryForward)
        if (!isCarryForward) {
           const diff = Number(settlement.totalPayable) - Number(settlement.totalPaid);
           if (Math.abs(diff) > 0.01) { // Tolerate small floating point issues
              const isShortfall = diff > 0; // We owed them more than we paid
              await this.ledgerService.recordDoubleEntry({
                 transactionId: `${transactionId}-WRITEOFF`,
                 sourceType: 'LABOUR_SETTLEMENT',
                 sourceId: settlement.id,
                 date: settlement.settlementDate,
                 debitAccountId: isShortfall ? labourerAccount.id : wageExpenseAccount.id,
                 creditAccountId: isShortfall ? wageExpenseAccount.id : labourerAccount.id,
                 amount: Math.abs(diff),
                 note: `Settle Clear write-off for mismatches up to ${settlement.settlementDate.toISOString().split('T')[0]}`,
              });
           }
        }
      }
    } catch (err) {
      console.error(`Failed to record ledger entries for Labour Settlement #${settlement.id}: ${err.message}`);
    }

    return settlement;
  }

  async getSettlements(labourerId: number) {
    return this.prisma.labourSettlement.findMany({
      where: { labourerId },
      orderBy: { settlementDate: 'desc' },
    });
  }

  async recordPayment(
    labourerId: number,
    amount: number,
    date: Date,
    note?: string,
    userId?: number,
    accountId?: number,
  ) {
    const labourerObj = await this.prisma.labourer.findUnique({ where: { id: labourerId } });
    const labourerAccount = await this.ledgerService.getOrCreateAccountForEntity('LABOURER', labourerId, labourerObj?.name || 'Labourer');
    const paymentAccount = accountId ? await this.prisma.ledgerAccount.findUnique({ where: { id: accountId } }) : await this.ledgerService.getSystemAccount('CASH');

    const payment = await this.prisma.labourPayment.create({
      data: {
        labourerId,
        amount,
        date,
        note: note || 'Labour Payment',
        createdById: userId,
        accountId: paymentAccount?.id,
      },
    });

    if (paymentAccount) {
      await this.ledgerService.recordDoubleEntry({
        transactionId: `LABOUR-PAY-${payment.id}`,
        sourceType: 'LABOUR_PAYMENT',
        sourceId: payment.id,
        date: payment.date,
        debitAccountId: labourerAccount.id,
        creditAccountId: paymentAccount.id,
        amount: Number(amount),
        note: note || 'Labour Payment',
      });
    }

    return payment;
  }
}
