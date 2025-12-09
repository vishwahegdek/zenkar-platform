import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { PrismaService } from '../prisma/prisma.service';
import { mockPrismaService } from '../prisma/prisma.service.mock';

describe('ProductsService', () => {
  let service: ProductsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all active products when no query provided', async () => {
      const result = [{ id: 1, name: 'P1', isDeleted: false }];
      mockPrismaService.product.findMany.mockResolvedValue(result);

      expect(await service.findAll()).toBe(result);
      expect(mockPrismaService.product.findMany).toHaveBeenCalledWith({
        where: { isDeleted: false },
        take: 20,
        orderBy: { name: 'asc' },
      });
    });

    it('should filter by name when query provided', async () => {
      const query = 'test';
      await service.findAll(query);

      expect(mockPrismaService.product.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({
          isDeleted: false,
          OR: [
             { name: { contains: query, mode: 'insensitive' } }
          ]
        })
      }));
    });
  });

  describe('remove', () => {
    it('should soft delete the product', async () => {
      const id = 1;
      const date = new Date();
      jest.useFakeTimers().setSystemTime(date);

      await service.remove(id);

      expect(mockPrismaService.product.update).toHaveBeenCalledWith({
        where: { id },
        data: { 
          isDeleted: true, 
          deletedAt: date 
        },
      });
      
      jest.useRealTimers();
    });
  });

  describe('create', () => {
    it('should create product', async () => {
      const dto = { name: 'P1', defaultUnitPrice: 10 };
      await service.create(dto);
      expect(mockPrismaService.product.create).toHaveBeenCalledWith({
        data: { 
          name: dto.name,
          defaultUnitPrice: dto.defaultUnitPrice,
          notes: undefined 
        }
      });
    });
  });
});
