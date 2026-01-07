import { Injectable, BadRequestException } from '@nestjs/common';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { PrismaService } from '../prisma/prisma.service';
import { ContactsService } from '../contacts/contacts.service';

@Injectable()
export class CustomersService {
  constructor(
    private prisma: PrismaService,
    private contactsService: ContactsService, // Inject ContactsService
  ) {}

  async create(createCustomerDto: CreateCustomerDto, userId: number) {
    // 1. Conditional Validation: Either Name or ContactId, SAME AS BEFORE
    if (!createCustomerDto.name && !createCustomerDto.contactId) {
      throw new BadRequestException(
        'Either Name or Contact ID is required to create a customer.',
      );
    }

    // 2. Logic to Auto-Create/Find Contact if Phone is valid and ContactId is missing
    /* 
       User Rule: "We need to make sure hes created on Contact table and google cloud too 
       if the user have provided valid phone number with 10 digits" 
    */
    if (!createCustomerDto.contactId && createCustomerDto.phone) {
      // Sanitize phone: remove spaces, dashes
      // But let's assume raw check first for simple regex match
      const rawPhone = createCustomerDto.phone.replace(/\D/g, '');

      // Strict Check: exactly 10 digits (common for Indian mobile numbers)
      // Adjust regex if we want to allow +91 prefix?
      // User said "valid phone number with 10 digits".
      // Let's check if the raw number ends with 10 user digits or is length 10.
      // Simplest: Check if stripped length is 10.

      if (rawPhone.length === 10) {
        // Check if contact already exists by phone for this user
        // We use Prisma directly for read efficiency or service?
        // Let's use Prisma directly to find existing contact by phone to avoid overhead if exits.
        let existingContact = await this.prisma.contact.findFirst({
          where: {
            userId,
            phone: { contains: rawPhone }, // Check contains to handle format diffs? Or strict?
            // Let's try strict matching on the user input first.
          },
        });

        // Refined lookup: try to match exactly or by last 10 chars?
        // Existing import logic used name. Here we trust phone.
        // Let's stick to simple findFirst. If not found, create.

        if (!existingContact) {
          // Create new Contact
          // This will trigger Google Sync inside ContactsService.create
          // REMOVED try-catch to allow bubbling of 424 Error if Sync fails

          existingContact = await this.contactsService.create(userId, {
            name: createCustomerDto.name || 'New Customer',
            phone: createCustomerDto.phone,
            group: 'Zenkar App',
            skipGoogleSync: createCustomerDto.skipGoogleSync, // Pass the flag
          });
        }

        if (existingContact) {
          createCustomerDto.contactId = existingContact.id;
        }
      }
    }

    // 3. Smart Selector Logic (Existing)
    if (createCustomerDto.contactId) {
      const existing = await this.prisma.customer.findFirst({
        where: {
          userId,
          contactId: createCustomerDto.contactId,
        },
      });
      if (existing) return existing;

      // If Name is missing but ContactId provided, resolve details from Contact
      if (!createCustomerDto.name) {
        const contact = await this.prisma.contact.findUnique({
          where: { id: createCustomerDto.contactId },
        });

        if (!contact) {
          throw new BadRequestException('Invalid Contact ID provided.');
        }
        // Populate DTO with Contact details
        createCustomerDto.name = contact.name;
        // Contact phone might be null, but DTO expects string|undefined? Or string.
        // If strict, convert null to undefined.
        createCustomerDto.phone =
          createCustomerDto.phone || contact.phone || undefined;
      }
    }

    return this.prisma.customer.create({
      data: {
        name: createCustomerDto.name!, // Alert: We ensured it is set above or threw error.
        phone: createCustomerDto.phone,
        address: createCustomerDto.address || null,
        userId: userId,
        contactId: createCustomerDto.contactId || undefined,
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
      name: query
        ? { contains: query, mode: 'insensitive' as const }
        : undefined,
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
        include: { contact: true },
      }),
      this.prisma.customer.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page: +page,
        lastPage: Math.ceil(total / take),
        hasMore: skip + take < total,
      },
    };
  }

  findOne(id: number) {
    return this.prisma.customer.findFirst({
      where: { id, isDeleted: false },
      include: { contact: true },
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
      data: { isDeleted: true, deletedAt: new Date() },
    });
  }
}
