import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { PrismaService } from '../prisma/prisma.service';
import { mockPrismaService } from '../prisma/prisma.service.mock';

describe('ProductsController', () => {
  let controller: ProductsController;
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        ProductsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

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

      await controller.findAll(query);

      expect(findAllSpy).toHaveBeenCalledWith(query);
    });

    it('should call service.findAll without query param', async () => {
      const findAllSpy = jest.spyOn(
        module.get<ProductsService>(ProductsService),
        'findAll',
      );

      await controller.findAll(undefined as unknown as string);

      expect(findAllSpy).toHaveBeenCalledWith(undefined);
    });
  });

  describe('create', () => {
    it('should call service.create', async () => {
      const dto = { name: 'New Prod', defaultUnitPrice: 10 };
      const createSpy = jest.spyOn(
        module.get<ProductsService>(ProductsService),
        'create',
      );

      await controller.create(dto);

      expect(createSpy).toHaveBeenCalledWith(dto);
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
