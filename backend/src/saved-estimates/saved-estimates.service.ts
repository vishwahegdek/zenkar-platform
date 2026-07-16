import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SavedEstimatesService {
  constructor(private prisma: PrismaService) {}

  async create(data: any, userId?: number) {
    return this.prisma.savedEstimate.create({
      data: {
        name: data.name,
        data: data.data,
        totalCost: data.totalCost,
        createdById: userId,
      },
    });
  }

  async findAll() {
    return this.prisma.savedEstimate.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    return this.prisma.savedEstimate.findUnique({
      where: { id },
    });
  }

  async remove(id: number) {
    return this.prisma.savedEstimate.delete({
      where: { id },
    });
  }
}
