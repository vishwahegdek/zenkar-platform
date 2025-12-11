import { Injectable } from '@nestjs/common';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  async importContacts(userId: number, accessToken: string) {
    const { google } = require('googleapis');
    const people = google.people({ version: 'v1', headers: { Authorization: `Bearer ${accessToken}` } });
    
    let nextPageToken = undefined;
    let count = 0;
    let totalFound = 0;

    do {
        const res = await people.people.connections.list({
          resourceName: 'people/me',
          personFields: 'names,phoneNumbers,addresses',
          pageSize: 1000, 
          pageToken: nextPageToken
        });

        const connections = res.data.connections || [];
        totalFound += connections.length;

        for (const person of connections) {
          const name = person.names?.[0]?.displayName;
          const phone = person.phoneNumbers?.[0]?.value;
          const address = person.addresses?.[0]?.formattedValue; 

          if (name) {
            const exists = await this.prisma.customer.findFirst({
                where: { 
                    AND: [
                        { userId: userId },
                        { name: name }
                    ]
                }
            });

            if (!exists) {
               await this.prisma.customer.create({
                 data: {
                   name,
                   phone: phone || null,
                   address: address || null,
                   userId
                 }
               });
               count++;
            }
          }
        }
        
        nextPageToken = res.data.nextPageToken;

    } while (nextPageToken);

    return { imported: count, totalFound: totalFound };
  }

  create(createCustomerDto: CreateCustomerDto, userId?: number) {
    return this.prisma.customer.create({
      data: {
        name: createCustomerDto.name,
        phone: createCustomerDto.phone,
        address: createCustomerDto.address,
        userId: userId || null
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
