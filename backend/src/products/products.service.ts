import { Injectable } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async create(createProductDto: CreateProductDto) {
    let categoryId = Number(createProductDto.categoryId);

    if (!categoryId) {
      // Default to 'General'
      const generalCategory = await (
        this.prisma as any
      ).productCategory.findFirst({ where: { name: 'General' } });
      if (generalCategory) {
        categoryId = generalCategory.id;
      } else {
        // Fallback: Create General if somehow missing (failsafe)
        const newCat = await (this.prisma as any).productCategory.create({
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
      whereClause.OR = [{ name: { contains: query, mode: 'insensitive' } }];
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
        include: { category: true },
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

  findOne(id: number) {
    return this.prisma.product.findUnique({
      where: { id },
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
}
