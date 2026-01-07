import { Injectable } from '@nestjs/common';
import { CreateProductCategoryDto } from './dto/create-product-category.dto';
import { UpdateProductCategoryDto } from './dto/update-product-category.dto';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class ProductCategoriesService {
  constructor(private prisma: PrismaService) {}

  create(createDto: CreateProductCategoryDto) {
    return this.prisma.productCategory.create({
      data: { name: createDto.name },
    });
  }

  findAll() {
    return this.prisma.productCategory.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { products: true } } },
    });
  }

  findOne(id: number) {
    return this.prisma.productCategory.findUnique({ where: { id } });
  }

  update(id: number, updateDto: UpdateProductCategoryDto) {
    return this.prisma.productCategory.update({
      where: { id },
      data: { name: updateDto.name },
    });
  }

  async remove(id: number) {
    // Check constraints? Or just fail if products exist?
    // User probably doesn't want to delete active categories.
    // For now, let Prisma handle generic FK error if products exist.
    return this.prisma.productCategory.delete({ where: { id } });
  }
}
