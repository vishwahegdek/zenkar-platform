import { Test, TestingModule } from '@nestjs/testing';
import { ExpensesService } from './expenses.service';
import { PrismaService } from '../prisma/prisma.service';
import { mockPrismaService } from '../prisma/prisma.service.mock';
import { LedgerService } from '../ledger/ledger.service';

describe('ExpensesService', () => {
  let service: ExpensesService;
  const mockLedgerService = {
    recordDoubleEntry: jest.fn(),
    deleteEntriesForSource: jest.fn(),
    getSystemAccount: jest.fn().mockResolvedValue({ id: 10 }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExpensesService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: LedgerService, useValue: mockLedgerService },
      ],
    }).compile();

    service = module.get<ExpensesService>(ExpensesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getExpenseAnalytics', () => {
    it('should aggregate expenses into summary, trend, byCategory, byPaymentMethod, and topRecipients', async () => {
      const mockExpenses = [
        {
          id: 1,
          amount: 5000,
          date: new Date('2026-10-15T00:00:00.000Z'),
          description: 'Teak wood transport',
          method: 'CASH',
          categoryId: 1,
          recipientId: 1,
          category: { id: 1, name: 'Transport' },
          recipient: { id: 1, name: 'Ramesh Transport' },
        },
        {
          id: 2,
          amount: 15000,
          date: new Date('2026-10-20T00:00:00.000Z'),
          description: 'Workshop machine repair',
          method: 'BANK_TRANSFER',
          categoryId: 2,
          recipientId: 2,
          category: { id: 2, name: 'Machinery' },
          recipient: { id: 2, name: 'Apex Tool Co' },
        },
        {
          id: 3,
          amount: 2500,
          date: new Date('2026-10-20T00:00:00.000Z'),
          description: 'Local fuel',
          method: 'CASH',
          categoryId: 1,
          recipientId: null,
          category: { id: 1, name: 'Transport' },
          recipient: null,
        },
      ];

      const mockPrevExpenses = [
        { amount: 10000 },
      ];

      mockPrismaService.expense.findMany
        .mockResolvedValueOnce(mockExpenses)
        .mockResolvedValueOnce(mockPrevExpenses);

      const result = await service.getExpenseAnalytics({
        fromStr: '2026-10-01',
        toStr: '2026-10-31',
        timeframe: 'day',
      });

      expect(result.summary.totalExpenses).toBe(22500);
      expect(result.summary.totalTransactions).toBe(3);
      expect(result.summary.averageExpense).toBe(7500);
      expect(result.summary.prevPeriodTotal).toBe(10000);
      expect(result.summary.percentageChange).toBe(125); // (22500 - 10000) / 10000 * 100
      expect(result.summary.topCategory?.name).toBe('Machinery');
      expect(result.summary.topCategory?.amount).toBe(15000);

      // Category breakdown
      expect(result.byCategory).toHaveLength(2);
      expect(result.byCategory[0].name).toBe('Machinery');
      expect(result.byCategory[0].amount).toBe(15000);
      expect(result.byCategory[1].name).toBe('Transport');
      expect(result.byCategory[1].amount).toBe(7500);

      // Payment method
      expect(result.byPaymentMethod).toHaveLength(2);
      expect(result.byPaymentMethod[0].method).toBe('BANK_TRANSFER');
      expect(result.byPaymentMethod[1].method).toBe('CASH');

      // Top recipients
      expect(result.topRecipients.length).toBeGreaterThan(0);
      expect(result.topRecipients[0].name).toBe('Apex Tool Co');

      // High value expenses
      expect(result.highValueExpenses).toHaveLength(3);
      expect(result.highValueExpenses[0].amount).toBe(15000);
    });
  });
});
