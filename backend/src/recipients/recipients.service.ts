import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RecipientsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: number, query?: string) {
    const where: any = { userId };
    
    if (query) {
      where.name = { contains: query, mode: 'insensitive' };
    }

    return this.prisma.recipient.findMany({
      where,
      orderBy: { name: 'asc' },
      take: 20 // Limit results for dropdown
    });
  }
}
