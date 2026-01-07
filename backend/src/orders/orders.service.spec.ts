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
          advanceAmount: 0,
        },
      ];
      mockPrismaService.order.findMany.mockResolvedValue(result);

      const expected = result.map((o) => ({ ...o, remainingBalance: 100 }));
      expect(await service.findAll({})).toEqual(expected);
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
      mockPrismaService.$transaction.mockImplementation(async (cb) =>
        cb(mockPrismaService),
      );
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

      mockPrismaService.$transaction.mockImplementation(async (cb) =>
        cb(mockPrismaService),
      );
      mockPrismaService.customer.create.mockResolvedValue(newCustomer);
      mockPrismaService.order.create.mockResolvedValue(createdOrder);

      expect(await service.create(dto as any)).toEqual(createdOrder);
      expect(mockPrismaService.customer.create).toHaveBeenCalledWith({
        data: { name: 'New User', phone: undefined, address: undefined },
      });
    });

    it('should create new product with description as notes if productId is 0', async () => {
      const dto = {
        customerId: 1,
        items: [
          {
            productId: 0,
            productName: 'New Prod',
            unitPrice: 100,
            description: 'Note mapped from desc',
          },
        ],
      };
      const newProduct = { id: 88, name: 'New Prod' };
      const createdOrder = { id: 3 };

      mockPrismaService.$transaction.mockImplementation(async (cb) =>
        cb(mockPrismaService),
      );
      mockPrismaService.product.findFirst.mockResolvedValue(null); // Not found
      mockPrismaService.product.create.mockResolvedValue(newProduct);
      mockPrismaService.order.create.mockResolvedValue(createdOrder);

      await service.create(dto as any);

      expect(mockPrismaService.product.create).toHaveBeenCalledWith({
        data: {
          name: 'New Prod',
          defaultUnitPrice: 100,
          notes: 'Note mapped from desc',
        },
      });
    });
  });

  describe('findOne', () => {
    it('should return a single order', async () => {
      const order = {
        id: 1,
        orderNo: 'ORD-001',
        totalAmount: 100,
        advanceAmount: 0,
      };
      mockPrismaService.order.findUnique.mockResolvedValue(order);

      const expected = { ...order, remainingBalance: 100 };
      expect(await service.findOne(1)).toEqual(expected);
    });

    it('should return null if order not found', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue(null);
      expect(await service.findOne(999)).toBeNull();
    });
  });
});
