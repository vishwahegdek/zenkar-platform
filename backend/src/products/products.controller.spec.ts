import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { PrismaService } from '../prisma/prisma.service';
import { mockPrismaService } from '../prisma/prisma.service.mock';
import { UploadsService } from '../uploads/uploads.service';

describe('ProductsController', () => {
  let controller: ProductsController;
  let module: TestingModule;
  const mockUploadsService = {
    processAndSaveImage: jest.fn(),
    deleteImageFiles: jest.fn(),
    serveFile: jest.fn(),
  };

  beforeEach(async () => {
    module = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        ProductsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: UploadsService, useValue: mockUploadsService },
      ],
    }).compile();

    // Mock category defaults
    mockPrismaService.productCategory.findFirst.mockResolvedValue({ id: 1, name: 'General' });
    mockPrismaService.productCategory.create.mockResolvedValue({ id: 1, name: 'General' });
    mockPrismaService.product.create.mockResolvedValue({ id: 1, name: 'Prod' });

    controller = module.get<ProductsController>(ProductsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should call service.findAll with query param', async () => {
      const query = 'test';
      mockPrismaService.product.findMany.mockResolvedValue([]);

      // Spy on service.findAll
      const findAllSpy = jest.spyOn(
        module.get<ProductsService>(ProductsService),
        'findAll',
      );

      await controller.findAll(query, '1', '20', undefined as any);

      expect(findAllSpy).toHaveBeenCalledWith(query, 1, 20, undefined);
    });

    it('should call service.findAll without query param', async () => {
      const findAllSpy = jest.spyOn(
        module.get<ProductsService>(ProductsService),
        'findAll',
      );

      await controller.findAll(undefined as any, '1', '20', undefined as any);

      expect(findAllSpy).toHaveBeenCalledWith(undefined, 1, 20, undefined);
    });
  });

  describe('create', () => {
    it('should call service.create', async () => {
      const dto = { name: 'New Prod', defaultUnitPrice: 10, categoryId: 1 };
      const createSpy = jest.spyOn(
        module.get<ProductsService>(ProductsService),
        'create',
      );

      await controller.create(dto, { user: { id: 1 } });

      expect(createSpy).toHaveBeenCalledWith(dto, 1);
    });
  });

  describe('remove', () => {
    it('should call service.remove', async () => {
      const removeSpy = jest.spyOn(
        module.get<ProductsService>(ProductsService),
        'remove',
      );

      await controller.remove('1');

      expect(removeSpy).toHaveBeenCalledWith(1);
    });
  });
});
