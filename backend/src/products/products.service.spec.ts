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

    // Mock category
    mockPrismaService.productCategory.findFirst.mockResolvedValue({ id: 1, name: 'General' });
    mockPrismaService.productCategory.create.mockResolvedValue({ id: 1, name: 'General' });

    service = module.get<ProductsService>(ProductsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all active products when no query provided', async () => {
      const result = [{ id: 1, name: 'P1', isDeleted: false }];
      mockPrismaService.product.findMany.mockResolvedValue(result);
      mockPrismaService.product.count.mockResolvedValue(1);

      expect(await service.findAll()).toEqual(expect.objectContaining({ data: result }));
      expect(mockPrismaService.product.findMany).toHaveBeenCalledWith({
        where: { isDeleted: false },
        take: 20,
        skip: 0,
        orderBy: { name: 'asc' },
        include: { category: true },
      });
    });

    it('should filter by name when query provided', async () => {
      const query = 'test';
      await service.findAll(query);

      expect(mockPrismaService.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isDeleted: false,
            OR: [{ name: { contains: query, mode: 'insensitive' } }],
          }),
        }),
      );
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
          deletedAt: date,
        },
      });

      jest.useRealTimers();
    });
  });

  describe('create', () => {
    it('should create product', async () => {
      const dto = { name: 'P1', defaultUnitPrice: 10, categoryId: 1 };
      await service.create(dto);
      expect(mockPrismaService.product.create).toHaveBeenCalledWith({
        data: {
          name: dto.name,
          defaultUnitPrice: dto.defaultUnitPrice,
          notes: undefined,
          categoryId: 1,
        },
      });
    });
  });
});
