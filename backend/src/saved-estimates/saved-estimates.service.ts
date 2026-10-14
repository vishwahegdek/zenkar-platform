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

  async update(id: number, data: any, userId?: number) {
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.data !== undefined) updateData.data = data.data;
    if (data.totalCost !== undefined) updateData.totalCost = data.totalCost;
    if (userId) updateData.createdById = userId;

    return this.prisma.savedEstimate.update({
      where: { id },
      data: updateData,
    });
  }
}
