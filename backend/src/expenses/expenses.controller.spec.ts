import { Test, TestingModule } from '@nestjs/testing';
import { ExpensesController } from './expenses.controller';
import { ExpensesService } from './expenses.service';

describe('ExpensesController', () => {
  let controller: ExpensesController;
  const mockExpensesService = {
    createExpense: jest.fn(),
    findAllExpenses: jest.fn(),
    findAllCategories: jest.fn(),
    createCategory: jest.fn(),
    findOne: jest.fn(),
    updateExpense: jest.fn(),
    removeExpense: jest.fn(),
    getExpenseAnalytics: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExpensesController],
      providers: [
        { provide: ExpensesService, useValue: mockExpensesService },
      ],
    }).compile();

    controller = module.get<ExpensesController>(ExpensesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call getExpenseAnalytics with parsed parameters', async () => {
    mockExpensesService.getExpenseAnalytics.mockResolvedValue({ summary: { totalExpenses: 100 } });

    const result = await controller.getAnalytics(
      '2026-10-01',
      '2026-10-31',
      '2',
      'CASH',
      'week',
    );

    expect(result).toEqual({ summary: { totalExpenses: 100 } });
    expect(mockExpensesService.getExpenseAnalytics).toHaveBeenCalledWith({
      fromStr: '2026-10-01',
      toStr: '2026-10-31',
      categoryId: 2,
      paymentMethod: 'CASH',
      timeframe: 'week',
    });
  });
});
