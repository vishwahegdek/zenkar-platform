import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaService } from '../prisma/prisma.service';
import { UploadsService } from '../uploads/uploads.service';

@Injectable()
export class ProductsService {
  constructor(
    private prisma: PrismaService,
    private uploadsService: UploadsService,
  ) {}

  async create(createProductDto: CreateProductDto, userId?: number) {
    let categoryId = Number(createProductDto.categoryId);

    if (!categoryId) {
      // Default to 'General'
      const generalCategory = await this.prisma.productCategory.findFirst({
        where: { name: 'General' },
      });
      if (generalCategory) {
        categoryId = generalCategory.id;
      } else {
        const newCat = await this.prisma.productCategory.create({
          data: { name: 'General' },
        });
        categoryId = newCat.id;
      }
    }

    return this.prisma.product.create({
      data: {
        name: createProductDto.name,
        defaultUnitPrice: createProductDto.defaultUnitPrice,
        notes: createProductDto.notes,
        categoryId: categoryId,
        isPurchasable: createProductDto.isPurchasable || false,
        createdById: userId,
        estimateData: createProductDto.estimateData ?? undefined,
        savedEstimateId: createProductDto.savedEstimateId ?? undefined,
      },
      include: {
        category: true,
        images: { orderBy: { id: 'asc' } },
        savedEstimate: true,
        createdBy: { select: { id: true, username: true } },
      },
    });
  }

  async findAll(
    query?: string,
    page: number = 1,
    limit: number = 20,
    categoryId?: number,
  ) {
    const whereClause: any = { isDeleted: false };

    if (query) {
      whereClause.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { notes: { contains: query, mode: 'insensitive' } },
      ];
    }
    if (categoryId) {
      whereClause.categoryId = categoryId;
    }

    const skip = (page - 1) * limit;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where: whereClause,
        take: limit,
        skip: skip,
        orderBy: { name: 'asc' },
        include: {
          category: true,
          images: { orderBy: { id: 'asc' } },
          savedEstimate: true,
          createdBy: { select: { id: true, username: true } },
        },
      }),
      this.prisma.product.count({ where: whereClause }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        images: { orderBy: { id: 'asc' } },
        savedEstimate: true,
        createdBy: { select: { id: true, username: true } },
      },
    });
    if (!product || product.isDeleted) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  async update(id: number, updateProductDto: UpdateProductDto, userId?: number) {
    return this.prisma.product.update({
      where: { id },
      data: {
        ...updateProductDto,
        updatedById: userId,
      },
      include: {
        category: true,
        images: { orderBy: { id: 'asc' } },
        savedEstimate: true,
        createdBy: { select: { id: true, username: true } },
      },
    });
  }

  async remove(id: number) {
    return this.prisma.product.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date() },
    });
  }

  async addImages(productId: number, files: Express.Multer.File[]) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException('Product not found');

    const createdImages: any[] = [];
    for (const file of files) {
      const processed = await this.uploadsService.processAndSaveImage(file);
      const img = await this.prisma.image.create({
        data: {
          keyRaw: processed.keyRaw,
          keyOptimized: processed.keyOptimized,
          keyThumbnail: processed.keyThumbnail,
          productId: productId,
        },
      });
      createdImages.push(img);
    }
    return createdImages;
  }

  async deleteImage(productId: number, imageId: number) {
    const image = await this.prisma.image.findFirst({
      where: { id: imageId, productId: productId },
    });
    if (!image) throw new NotFoundException('Image not found for this product');

    await this.uploadsService.deleteImageFiles(image);
    await this.prisma.image.delete({ where: { id: imageId } });
    return { success: true };
  }

  async updateEstimate(
    productId: number,
    body: {
      estimateData: any;
      savedEstimateId?: number | null;
      updateUnitPrice?: boolean;
      unitPrice?: number;
    },
    userId?: number,
  ) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException('Product not found');

    const updateData: any = {
      estimateData: body.estimateData ?? null,
      savedEstimateId: body.savedEstimateId ?? null,
      updatedById: userId,
    };

    if (body.updateUnitPrice && body.unitPrice !== undefined) {
      updateData.defaultUnitPrice = body.unitPrice;
    }

    return this.prisma.product.update({
      where: { id: productId },
      data: updateData,
      include: {
        category: true,
        images: { orderBy: { id: 'asc' } },
        savedEstimate: true,
        createdBy: { select: { id: true, username: true } },
      },
    });
  }
}
