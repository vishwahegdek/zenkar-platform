import { Injectable } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaService } from '../prisma/prisma.service';


@Injectable()
export class ProductsService {
  constructor(
    private prisma: PrismaService
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

  async findAll(query?: string, page: number = 1, limit: number = 20) {
    const whereClause: any = { isDeleted: false };
    
    if (query) {
      whereClause.OR = [
        { name: { contains: query, mode: 'insensitive' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where: whereClause,
        take: limit,
        skip: skip,
        orderBy: { name: 'asc' },
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
      }
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
