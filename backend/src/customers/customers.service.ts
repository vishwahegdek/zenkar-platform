import { Injectable, BadRequestException } from '@nestjs/common';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  async create(createCustomerDto: CreateCustomerDto, userId: number) {
    // Conditional Validation: Either Name or ContactId is required.
    if (!createCustomerDto.name && !createCustomerDto.contactId) {
        throw new BadRequestException('Either Name or Contact ID is required to create a customer.');
    }

    // Smart Selector Logic
    if (createCustomerDto.contactId) {
        const existing = await this.prisma.customer.findFirst({
            where: {
                userId,
                contactId: createCustomerDto.contactId
            }
        });
        if (existing) return existing;
        
        // If Name is missing but ContactId provided, resolve details from Contact
        if (!createCustomerDto.name) {
            const contact = await this.prisma.contact.findUnique({
                where: { id: createCustomerDto.contactId }
            });
            
            if (!contact) {
                throw new BadRequestException('Invalid Contact ID provided.');
            }
            // Populate DTO with Contact details
            createCustomerDto.name = contact.name;
            // Contact phone might be null, but DTO expects string|undefined? Or string.
            // If strict, convert null to undefined.
            createCustomerDto.phone = createCustomerDto.phone || contact.phone || undefined; 
        }
    }
  
    return this.prisma.customer.create({
      data: {
        name: createCustomerDto.name!, // Alert: We ensured it is set above or threw error.
        phone: createCustomerDto.phone,
        address: createCustomerDto.address || null,
        userId: userId,
        contactId: createCustomerDto.contactId || undefined
      },
    });
  }

  async findAll(userId: number | undefined, params: any) {
    const { contactId, query, page = 1, limit = 20, filterByOwner } = params;
    const skip = (page - 1) * limit;
    const take = +limit;

    const where: any = {
      isDeleted: false,
      contactId: contactId ? +contactId : undefined,
      name: query ? { contains: query, mode: 'insensitive' as const } : undefined,
    };
    
    // Only filter by userId if explicitly requested (e.g. for "My Customers" view)
    if (filterByOwner && userId) {
        where.userId = userId;
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.customer.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: { contact: true }
      }),
      this.prisma.customer.count({ where })
    ]);

    return {
      data,
      meta: {
        total,
        page: +page,
        lastPage: Math.ceil(total / take),
        hasMore: skip + take < total
      }
    };
  }

  findOne(id: number) {
    return this.prisma.customer.findFirst({
      where: { id, isDeleted: false },
       include: { contact: true }
    });
  }

  update(id: number, updateCustomerDto: UpdateCustomerDto) {
    return this.prisma.customer.update({
      where: { id },
      data: updateCustomerDto,
    });
  }

  remove(id: number) {
    return this.prisma.customer.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date() }
    });
  }
}
