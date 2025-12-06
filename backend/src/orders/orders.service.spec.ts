import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { PrismaService } from '../prisma/prisma.service';
import { mockPrismaService } from '../prisma/prisma.service.mock';

describe('OrdersService', () => {
  let service: OrdersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  describe('findAll', () => {
    it('should return an array of orders', async () => {
      const result = [
        {
          id: 1,
          orderNo: 'ORD-001',
          customer: { name: 'Test Customer' },
          items: [],
          totalAmount: 100,
        },
      ];
      mockPrismaService.order.findMany.mockResolvedValue(result);

      expect(await service.findAll({})).toBe(result);
      expect(mockPrismaService.order.findMany).toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should create an order successfully', async () => {
      const dto = {
        customerId: 1,
        items: [],
        totalAmount: 100,
      };
      const createdOrder = { id: 1, ...dto };

      // Mock transaction to return the callback result immediately
      mockPrismaService.$transaction.mockImplementation(async (cb) => cb(mockPrismaService));
      mockPrismaService.order.create.mockResolvedValue(createdOrder);

      expect(await service.create(dto as any)).toEqual(createdOrder);
    });

    it('should create a new customer if customerId is 0', async () => {
      const dto = {
        customerId: 0,
        customerName: 'New User',
        items: [],
      };
      const newCustomer = { id: 99, name: 'New User' };
      const createdOrder = { id: 2, customerId: 99 };

      mockPrismaService.$transaction.mockImplementation(async (cb) => cb(mockPrismaService));
      mockPrismaService.customer.create.mockResolvedValue(newCustomer);
      mockPrismaService.order.create.mockResolvedValue(createdOrder);

      expect(await service.create(dto as any)).toEqual(createdOrder);
      expect(mockPrismaService.customer.create).toHaveBeenCalledWith({
        data: { name: 'New User', phone: undefined, address: undefined },
      });
    });
  });

  describe('findOne', () => {
    it('should return a single order', async () => {
      const order = { id: 1, orderNo: 'ORD-001' };
      mockPrismaService.order.findUnique.mockResolvedValue(order);

      expect(await service.findOne(1)).toBe(order);
    });

    it('should return null if order not found', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue(null);
      expect(await service.findOne(999)).toBeNull();
    });
  });
});
