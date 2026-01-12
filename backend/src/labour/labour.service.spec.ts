import { Test, TestingModule } from '@nestjs/testing';
import { LabourService } from './labour.service';
import { PrismaService } from '../prisma/prisma.service';
import { mockPrismaService } from '../prisma/prisma.service.mock';

describe('LabourService', () => {
  let service: LabourService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LabourService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<LabourService>(LabourService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createLabourer', () => {
    it('should create a labourer', async () => {
      const data = { name: 'Worker 1', defaultDailyWage: 500 };
      const created = { id: 1, ...data };
      mockPrismaService.labourer.create.mockResolvedValue(created);

      expect(await service.createLabourer(data)).toEqual(created);
      expect(mockPrismaService.labourer.create).toHaveBeenCalledWith({ data });
    });
  });

  describe('getDailyView', () => {
    it('should return aggregated view', async () => {
      const date = new Date('2025-01-01');
      const labourers = [{ id: 1, name: 'L1', defaultDailyWage: 500 }];
      const attendances = [{ labourerId: 1, value: 1 }];
      const expenses = [{ labourerId: 1, amount: 200 }];
      const settlements = [];

      mockPrismaService.labourer.findMany.mockResolvedValue(labourers);
      mockPrismaService.attendance.findMany.mockResolvedValue(attendances);
      mockPrismaService.expense.findMany.mockResolvedValue(expenses);
      mockPrismaService.labourSettlement.findMany.mockResolvedValue(settlements);

      const result = await service.getDailyView(date);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 1,
        name: 'L1',
        defaultDailyWage: 500,
        attendance: 1,
        amount: 200,
        lastSettlementDate: null,
      });
    });
  });
});
