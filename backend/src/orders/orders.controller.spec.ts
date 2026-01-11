import { Test, TestingModule } from '@nestjs/testing';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { PrismaService } from '../prisma/prisma.service';
import { mockPrismaService } from '../prisma/prisma.service.mock';

describe('OrdersController', () => {
  let controller: OrdersController;

  const mockOrdersService = {};
  const mockProductsService = {};
  const mockCustomersService = {};
  const mockAuditService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [
        { provide: OrdersService, useValue: mockOrdersService },
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: 'ProductsService', useValue: mockProductsService }, // Fix: Use string token or class depending on injection
        { provide: 'CustomersService', useValue: mockCustomersService },
        { provide: 'AuditService', useValue: mockAuditService },
      ],
    })
      .useMocker((token) => {
        // Fallback for any other missing dependencies
        if (token === 'ProductsService') return mockProductsService;
        if (token === 'CustomersService') return mockCustomersService;
        if (token === 'AuditService') return mockAuditService;
      })
      .compile();

    controller = module.get<OrdersController>(OrdersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
