import { Injectable } from '@nestjs/common';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  async create(createCustomerDto: CreateCustomerDto, userId: number) {
    // Smart Selector Logic
    if (createCustomerDto.contactId) {
        const existing = await this.prisma.customer.findFirst({
            where: {
                userId,
                contactId: createCustomerDto.contactId
            }
        });
        if (existing) return existing;
    }
  
    return this.prisma.customer.create({
      data: {
        name: createCustomerDto.name,
        phone: createCustomerDto.phone,
        address: createCustomerDto.address,
        userId: userId,
        contactId: createCustomerDto.contactId || undefined
      },
    });
  }

  async findAll(query?: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const where = query ? {
        OR: [
          { name: { contains: query, mode: 'insensitive' as const } }, // 'as const' to fix TS error if strict
          { phone: { contains: query, mode: 'insensitive' as const } },
          { address: { contains: query, mode: 'insensitive' as const } },
        ],
    } : {};

    const [data, total] = await this.prisma.$transaction([
        this.prisma.customer.findMany({
            where,
            take: Number(limit),
            skip: Number(skip),
            orderBy: { name: 'asc' },
        }),
        this.prisma.customer.count({ where })
    ]);

    return {
        data,
        meta: {
            total,
            page: Number(page),
            lastPage: Math.ceil(total / limit),
            hasMore: Number(page) * Number(limit) < total
        }
    };
  }

  findOne(id: number) {
    return this.prisma.customer.findUnique({ where: { id } });
  }

  update(id: number, updateCustomerDto: UpdateCustomerDto) {
    return this.prisma.customer.update({
      where: { id },
      data: updateCustomerDto,
    });
  }

  remove(id: number) {
    return this.prisma.customer.delete({ where: { id } });
  }
}
