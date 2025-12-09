import { Injectable } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaService } from '../prisma/prisma.service';

import { ImagesService } from '../images/images.service';

@Injectable()
export class ProductsService {
  constructor(
    private prisma: PrismaService,
    private imagesService: ImagesService
  ) {}

  create(createProductDto: CreateProductDto) {
    return this.prisma.product.create({
      data: {
        name: createProductDto.name,
        defaultUnitPrice: createProductDto.defaultUnitPrice,
        notes: createProductDto.notes,
      },
    });
  }

  findAll(query?: string) {
    const whereClause: any = { isDeleted: false };
    
    if (query) {
      whereClause.OR = [
        { name: { contains: query, mode: 'insensitive' } },
      ];
    }

    return this.prisma.product.findMany({
      where: whereClause,
      take: 20,
      orderBy: { name: 'asc' },
      include: { images: true },
    });
  }

  findOne(id: number) {
    return this.prisma.product.findUnique({
      where: { id },
      include: { images: true },
    });
  }

  update(id: number, updateProductDto: UpdateProductDto) {
    return this.prisma.product.update({
      where: { id },
      data: updateProductDto,
    });
  }

  remove(id: number) {
    return this.prisma.product.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date() },
    });
  }

  async uploadImage(id: number, file: Express.Multer.File) {
    // We need to inject ImagesService here, or move logic to ImagesService completely.
    // Ideally ProductsService calls ImagesService. 
    // But ProductsService needs to be imported by ImagesModule to avoid circular dep if we go that way?
    // Actually ImagesModule imports ProductsModule? No.
    // Let's Import ImagesService in ProductsModule.
    // For now, I will let this fail compilation until I fix Module imports.
    // Wait, I can't leave it broken.
    // I should inject ImagesService in constructor.
    return this.imagesService.processAndUpload(file.buffer, file.originalname, { productId: id });
  }
}
