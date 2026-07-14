import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WoodTypesService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.woodType.findMany({
      orderBy: { createdAt: 'asc' },
    });
  }

  create(data: { name: string; price: number }) {
    const id = `custom_${Date.now()}`;
    return this.prisma.woodType.create({
      data: {
        id,
        name: data.name,
        price: data.price,
        isSeeded: false,
      },
    });
  }

  async update(id: string, data: { name?: string; price?: number }) {
    const wood = await this.prisma.woodType.findUnique({ where: { id } });
    if (!wood) throw new BadRequestException('Wood type not found');

    const updateData: any = {};
    if (data.price !== undefined) updateData.price = data.price;
    if (data.name !== undefined) {
      if (wood.isSeeded) {
        // Do not allow updating name of seeded wood types
      } else {
        updateData.name = data.name;
      }
    }

    return this.prisma.woodType.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: string) {
    const wood = await this.prisma.woodType.findUnique({ where: { id } });
    if (!wood) throw new BadRequestException('Wood type not found');
    if (wood.isSeeded) throw new BadRequestException('Cannot delete seeded wood types');

    return this.prisma.woodType.delete({
      where: { id },
    });
  }
}
