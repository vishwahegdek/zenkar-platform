import { Injectable, OnModuleInit, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LedgerService implements OnModuleInit {
  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    await this.ensureSystemAccounts();
  }

  async ensureSystemAccounts() {
    const systemAccounts = [
      { name: 'Main Cash Book', type: 'ASSET', subType: 'CASH' },
      { name: 'Sales Revenue', type: 'REVENUE', subType: 'SALES_REVENUE' },
      { name: 'Inventory Purchases', type: 'EXPENSE', subType: 'GENERAL_EXPENSE' },
      { name: 'Labour Wages', type: 'EXPENSE', subType: 'WAGE_EXPENSE' },
      { name: 'Opening Balance Equity', type: 'EQUITY', subType: 'EQUITY' },
    ];

    for (const sa of systemAccounts) {
      const existing = await this.prisma.ledgerAccount.findFirst({
        where: { subType: sa.subType },
      });
      if (!existing) {
        await this.prisma.ledgerAccount.create({
          data: {
            name: sa.name,
            type: sa.type,
            subType: sa.subType,
          },
        });
      }
    }
  }

  async getSystemAccount(subType: string) {
    const account = await this.prisma.ledgerAccount.findFirst({
      where: { subType },
    });
    if (!account) {
      throw new Error(`System Account for subType ${subType} not found!`);
    }
    return account;
  }
  async validateDateIsOpen(transactionDate: Date) {
    const settings = await this.prisma.systemSettings.findUnique({ where: { id: 1 } });
    if (settings?.booksClosedDate && transactionDate <= settings.booksClosedDate) {
      throw new ForbiddenException("This transaction falls in a closed accounting period and cannot be modified.");
    }
  }


  async getOrCreateAccountForEntity(
    entityType: 'CUSTOMER' | 'SUPPLIER' | 'LABOURER' | 'RECIPIENT',
    entityId: number,
    entityName: string,
  ) {
    let whereClause: any = {};
    let createData: any = {
      name: `${entityType.charAt(0) + entityType.slice(1).toLowerCase()}: ${entityName}`,
    };

    if (entityType === 'CUSTOMER') {
      whereClause.customerId = entityId;
      createData.customerId = entityId;
      createData.type = 'ASSET';
      createData.subType = 'CUSTOMER';
    } else if (entityType === 'SUPPLIER') {
      whereClause.supplierId = entityId;
      createData.supplierId = entityId;
      createData.type = 'LIABILITY';
      createData.subType = 'SUPPLIER';
    } else if (entityType === 'LABOURER') {
      whereClause.labourerId = entityId;
      createData.labourerId = entityId;
      createData.type = 'LIABILITY';
      createData.subType = 'LABOURER';
    } else if (entityType === 'RECIPIENT') {
      whereClause.recipientId = entityId;
      createData.recipientId = entityId;
      createData.type = 'LIABILITY';
      createData.subType = 'GENERAL_EXPENSE';
    }

    let account = await this.prisma.ledgerAccount.findFirst({
      where: whereClause,
    });

    if (!account) {
      account = await this.prisma.ledgerAccount.create({
        data: createData,
      });
    } else if (account.name !== createData.name) {
      // Keep name in sync in case it changed
      account = await this.prisma.ledgerAccount.update({
        where: { id: account.id },
        data: { name: createData.name },
      });
    }

    return account;
  }

  async createManualAccount(name: string, type: string, subType: string) {
    return this.prisma.ledgerAccount.create({
      data: {
        name,
        type,
        subType,
      },
    });
  }

  async recordDoubleEntry(params: {
    transactionId: string;
    sourceType: string;
    sourceId: number | null;
    date: Date | string;
    debitAccountId: number;
    creditAccountId: number;
    amount: number;
    note?: string;
  }) {
    let amount = Number(params.amount);
    if (isNaN(amount) || amount === 0) return null;

    let debitAccountId = params.debitAccountId;
    let creditAccountId = params.creditAccountId;

    if (amount < 0) {
      amount = Math.abs(amount);
      debitAccountId = params.creditAccountId;
      creditAccountId = params.debitAccountId;
    }

    const dateVal = new Date(params.date);
    await this.validateDateIsOpen(dateVal);

    // Create the Debit entry
    const debitEntry = await this.prisma.ledgerEntry.create({
      data: {
        transactionId: params.transactionId,
        accountId: debitAccountId,
        date: dateVal,
        debit: amount,
        credit: 0,
        sourceType: params.sourceType,
        sourceId: params.sourceId,
        note: params.note,
      },
    });

    // Create the Credit entry
    const creditEntry = await this.prisma.ledgerEntry.create({
      data: {
        transactionId: params.transactionId,
        accountId: creditAccountId,
        date: dateVal,
        debit: 0,
        credit: amount,
        sourceType: params.sourceType,
        sourceId: params.sourceId,
        note: params.note,
      },
    });

    return { debitEntry, creditEntry };
  }

  async deleteEntriesForSource(sourceType: string, sourceId: number) {
    const entries = await this.prisma.ledgerEntry.findMany({
      where: { sourceType, sourceId },
      select: { date: true },
    });

    for (const entry of entries) {
      await this.validateDateIsOpen(entry.date);
    }

    return this.prisma.ledgerEntry.deleteMany({
      where: {
        sourceType,
        sourceId,
      },
    });
  }

  async getAccounts() {
    return this.prisma.ledgerAccount.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async getTreasuryAccounts(userId: number) {
    return this.prisma.ledgerAccount.findMany({
      where: {
        OR: [
          { subType: 'CASH' },
          { userId: userId }
        ]
      },
      orderBy: { name: 'asc' }
    });
  }

  async transferMoney(fromAccountId: number, toAccountId: number, amount: number, dateStr: string, note?: string) {
    // Generate a unique sourceId using timestamp mapped to 32bit int roughly
    const sourceId = Math.floor(Date.now() / 1000); 
    return this.recordDoubleEntry({
      transactionId: `TRANSFER-${sourceId}`,
      debitAccountId: toAccountId,
      creditAccountId: fromAccountId,
      amount,
      date: dateStr,
      sourceType: 'INTERNAL_TRANSFER',
      sourceId,
      note: note || 'Internal Transfer',
    });
  }

  async getLedgerEntries(fromStr: string, toStr: string, accountId?: number) {
    const from = new Date(fromStr + 'T00:00:00.000Z');
    const to = new Date(toStr + 'T23:59:59.999Z');

    const where: any = {
      date: { gte: from, lte: to },
    };

    let openingBalance = 0;
    let accountType = '';

    if (accountId) {
      where.accountId = accountId;
      const account = await this.prisma.ledgerAccount.findUnique({ where: { id: accountId } });
      if (account) {
        accountType = account.type;
        const pastEntries = await this.prisma.ledgerEntry.findMany({
          where: { accountId, date: { lt: from } }
        });
        
        let debitSum = 0;
        let creditSum = 0;
        pastEntries.forEach(pe => {
          debitSum += Number(pe.debit);
          creditSum += Number(pe.credit);
        });
        
        if (accountType === 'ASSET' || accountType === 'EXPENSE') {
          openingBalance = debitSum - creditSum;
        } else {
          openingBalance = creditSum - debitSum;
        }
      }
    }

    const entries = await this.prisma.ledgerEntry.findMany({
      where,
      include: {
        account: true,
      },
      orderBy: [
        { date: 'asc' }, // Sort ASC for running balance calculation
        { createdAt: 'asc' },
      ],
    });

    const transactionIds = [...new Set(entries.map((e) => e.transactionId))];

    const balancingEntries = await this.prisma.ledgerEntry.findMany({
      where: {
        transactionId: { in: transactionIds },
      },
      include: {
        account: true,
      },
    });

    const balancingMap = new Map<string, any[]>();
    balancingEntries.forEach((entry) => {
      if (!balancingMap.has(entry.transactionId)) {
        balancingMap.set(entry.transactionId, []);
      }
      balancingMap.get(entry.transactionId)!.push(entry);
    });

    let currentBalance = openingBalance;

    const mappedEntries = entries.map(e => {
      const related = balancingMap.get(e.transactionId) || [];
      const opposite = related.find(r => r.accountId !== e.accountId) || e; // Fallback to self if not found
      
      let runningBalance: number | null = null;
      if (accountId) {
        const debit = Number(e.debit);
        const credit = Number(e.credit);
        if (accountType === 'ASSET' || accountType === 'EXPENSE') {
          currentBalance += (debit - credit);
        } else {
          currentBalance += (credit - debit);
        }
        runningBalance = currentBalance;
      }

      return {
        id: e.id,
        date: e.date,
        createdAt: e.createdAt,
        accountName: e.account.name,
        accountType: e.account.type,
        debit: Number(e.debit),
        credit: Number(e.credit),
        balanceAmount: Number(e.debit) > 0 ? Number(e.debit) : Number(e.credit),
        oppositeAccount: opposite.account.name,
        sourceType: e.sourceType,
        sourceId: e.sourceId,
        note: e.note,
        transactionId: e.transactionId,
        runningBalance
      };
    });

    // Reverse mappedEntries to descending order for frontend
    return mappedEntries.reverse();
  }

  async getBalanceSheet(asOfDateStr?: string) {
    const asOfDate = asOfDateStr ? new Date(asOfDateStr + 'T23:59:59.999Z') : new Date();

    const accounts = await this.prisma.ledgerAccount.findMany({
      include: {
        entries: {
          where: {
            date: { lte: asOfDate }
          }
        }
      }
    });

    let totalAssets = 0;
    let totalLiabilities = 0;
    let totalEquity = 0;
    let totalRevenue = 0;
    let totalExpenses = 0;

    const assets: any[] = [];
    const liabilities: any[] = [];
    const equity: any[] = [];
    const revenue: any[] = [];
    const expenses: any[] = [];

    accounts.forEach(acc => {
      let debitSum = 0;
      let creditSum = 0;

      acc.entries.forEach(e => {
        debitSum += Number(e.debit);
        creditSum += Number(e.credit);
      });

      const isTreasury = acc.subType === 'CASH' || acc.subType === 'BANK';
      if (debitSum === 0 && creditSum === 0 && !isTreasury) return;

      let balance = 0;
      if (acc.type === 'ASSET' || acc.type === 'EXPENSE') {
        balance = debitSum - creditSum;
      } else {
        balance = creditSum - debitSum;
      }

      if (balance === 0 && !isTreasury) return;

      const item = {
        id: acc.id,
        name: acc.name,
        subType: acc.subType,
        balance
      };

      switch (acc.type) {
        case 'ASSET':
          assets.push(item);
          totalAssets += balance;
          break;
        case 'LIABILITY':
          liabilities.push(item);
          totalLiabilities += balance;
          break;
        case 'EQUITY':
          equity.push(item);
          totalEquity += balance;
          break;
        case 'REVENUE':
          revenue.push(item);
          totalRevenue += balance;
          break;
        case 'EXPENSE':
          expenses.push(item);
          totalExpenses += balance;
          break;
      }
    });

    // --- DYNAMIC LIVE ACCRUALS (Unsettled Wages) ---
    // We dynamically calculate what we owe labourers that hasn't been settled yet.
    // This keeps the ledger clean of daily noise, while making the balance sheet 100% accurate.
    const labourers = await this.prisma.labourer.findMany({
      where: { isDeleted: false },
      include: {
        settlements: {
          orderBy: { settlementDate: 'desc' },
          take: 1
        }
      }
    });

    let accruedWages = 0;
    for (const labourer of labourers) {
      const lastSettlement = labourer.settlements[0];
      const startDate = lastSettlement ? lastSettlement.settlementDate : null;

      const dateFilter: any = { lte: asOfDate };
      if (startDate) {
        dateFilter.gt = startDate;
      }

      const attendances = await this.prisma.attendance.findMany({
        where: {
          labourerId: labourer.id,
          date: dateFilter
        }
      });

      let totalDays = 0;
      attendances.forEach(a => {
        totalDays += Number(a.value);
      });

      const salary = Number(labourer.defaultDailyWage) || 0;
      accruedWages += (totalDays * salary);
    }

    if (accruedWages > 0) {
      const netAccruedPayable = accruedWages;

      // Inject Virtual Liability (or Asset if we paid more than they worked)
      if (netAccruedPayable > 0) {
        liabilities.push({
          id: 'virtual-accrued-payable',
          name: 'Unsettled Wages Payable (Accrued)',
          subType: 'WAGE_EXPENSE',
          balance: netAccruedPayable
        });
        totalLiabilities += netAccruedPayable;
      } else if (netAccruedPayable < 0) {
        assets.push({
          id: 'virtual-accrued-advance',
          name: 'Unsettled Wage Advances (Accrued)',
          subType: 'ADVANCE',
          balance: Math.abs(netAccruedPayable)
        });
        totalAssets += Math.abs(netAccruedPayable);
      }

      // Inject Virtual Expense
      if (accruedWages > 0) {
        expenses.push({
          id: 'virtual-accrued-expense',
          name: 'Unsettled Wages Expense (Accrued)',
          subType: 'WAGE_EXPENSE',
          balance: accruedWages
        });
        totalExpenses += accruedWages;
      }


    }
    // -----------------------------------------------

    const netIncome = totalRevenue - totalExpenses;
    totalEquity += netIncome;

    return {
      asOfDate: asOfDateStr || asOfDate.toISOString().split('T')[0],
      assets: {
        items: assets.sort((a, b) => b.balance - a.balance),
        total: totalAssets
      },
      liabilities: {
        items: liabilities.sort((a, b) => b.balance - a.balance),
        total: totalLiabilities
      },
      equity: {
        items: equity.sort((a, b) => b.balance - a.balance),
        netIncome,
        total: totalEquity
      },
      revenue: {
        items: revenue.sort((a, b) => b.balance - a.balance),
        total: totalRevenue
      },
      expenses: {
        items: expenses.sort((a, b) => b.balance - a.balance),
        total: totalExpenses
      },
      isBalanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01
    };
  }
  async getSystemSettings() {
    let settings = await this.prisma.systemSettings.findUnique({ where: { id: 1 } });
    if (!settings) {
      settings = await this.prisma.systemSettings.create({ data: { id: 1 } });
    }
    return settings;
  }

  async updateBooksClosedDate(dateStr: string | null) {
    const closedDate = dateStr ? new Date(dateStr + 'T23:59:59.999Z') : null;
    return this.prisma.systemSettings.upsert({
      where: { id: 1 },
      update: { booksClosedDate: closedDate },
      create: { id: 1, booksClosedDate: closedDate },
    });
  }

  async getIncomeStatement(startDateStr: string, endDateStr: string) {
    const startDate = new Date(startDateStr + 'T00:00:00.000Z');
    const endDate = new Date(endDateStr + 'T23:59:59.999Z');

    const accounts = await this.prisma.ledgerAccount.findMany({
      where: {
        type: { in: ['REVENUE', 'EXPENSE'] }
      },
      include: {
        entries: {
          where: {
            date: { gte: startDate, lte: endDate }
          }
        }
      }
    });

    let totalRevenue = 0;
    let totalExpenses = 0;
    const revenue: any[] = [];
    const expenses: any[] = [];

    accounts.forEach(acc => {
      let debitSum = 0;
      let creditSum = 0;

      acc.entries.forEach(e => {
        debitSum += Number(e.debit);
        creditSum += Number(e.credit);
      });

      if (debitSum === 0 && creditSum === 0) return;

      let balance = 0;
      if (acc.type === 'EXPENSE') {
        balance = debitSum - creditSum;
      } else {
        balance = creditSum - debitSum;
      }

      if (balance === 0) return;

      const item = {
        id: acc.id,
        name: acc.name,
        subType: acc.subType,
        balance
      };

      if (acc.type === 'REVENUE') {
        revenue.push(item);
        totalRevenue += balance;
      } else if (acc.type === 'EXPENSE') {
        expenses.push(item);
        totalExpenses += balance;
      }
    });

    const netIncome = totalRevenue - totalExpenses;

    return {
      period: {
        startDate: startDateStr,
        endDate: endDateStr
      },
      revenue: {
        items: revenue.sort((a, b) => b.balance - a.balance),
        total: totalRevenue
      },
      expenses: {
        items: expenses.sort((a, b) => b.balance - a.balance),
        total: totalExpenses
      },
      netIncome
    };
  }
}
