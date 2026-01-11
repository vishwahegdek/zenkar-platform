import {
  Injectable,
  BadRequestException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
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
      // 3. Strict Validation & Normalization
      // This throws BadRequest if invalid 10-digit number
      const formattedPhone = this.contactsService.validateAndFormatPhone(createCustomerDto.phone);
      
      // Update DTO with formatted phone so it is saved correctly in Customer table too
      createCustomerDto.phone = formattedPhone;

      // Check if contact already exists by strictly matching the formatted phone
      let existingContact = await this.prisma.contact.findFirst({
          where: {
            userId,
            // Check both phone column and phones relation
            OR: [
                { phone: formattedPhone },
                { phones: { some: { phone: formattedPhone } } }
            ]
          },
      });

      if (!existingContact) {
          // If skipping sync (either manually or after retry), skip Contact creation
          if (createCustomerDto.skipGoogleSync) {
             console.log('Skipping Google Sync for customer:', createCustomerDto.name);
          }
          // If NOT skipping, check sync status AND Phone requirement
          else {
              // Rule: Google Sync requires a phone number (checked by validation above technically, but verify empty string case if validator allows?) 
              // Validator throws if not 10 digits, so empty string will throw there or here.

              const user = await this.prisma.user.findUnique({
                where: { id: userId },
                select: { googleRefreshToken: true },
              });
              const isSynced = !!user?.googleRefreshToken;

              if (!isSynced) {
                 throw new HttpException(
                    {
                        message: 'User is not synced with Google Contacts.',
                        code: 'GOOGLE_SYNC_REQUIRED',
                    },
                    HttpStatus.FAILED_DEPENDENCY,
                 );
              }
              
              // Proceed to create Contact (Create method will re-validate, which is fine)
              try {
                existingContact = await this.contactsService.create(userId, {
                  name: createCustomerDto.name || 'New Customer',
                  phone: formattedPhone, // Use validated phone
                  group: 'Customer',
                });
             } catch (error) {
                 if (error instanceof HttpException || error.status === 403 || error.status === 502) {
                     throw new HttpException(
                        'Google Sync Failed: ' + error.message,
                        HttpStatus.FAILED_DEPENDENCY
                     );
                 }
                 throw error;
             }
          }
      }

      if (existingContact) {
          createCustomerDto.contactId = existingContact.id;
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
          include: { phones: true },
        });

        if (!contact) {
          throw new BadRequestException('Invalid Contact ID provided.');
        }
        // Populate DTO with Contact details
        createCustomerDto.name = contact.name;
        
        // Prioritize phones relation, fallback to legacy phone column
        const contactAny = contact as any;
        const primaryPhone = contactAny.phones && contactAny.phones.length > 0 ? contactAny.phones[0].phone : contactAny.phone;
        createCustomerDto.phone = createCustomerDto.phone || primaryPhone || undefined;
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

    const [customers, total] = await this.prisma.$transaction([
      this.prisma.customer.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: { contact: { include: { phones: true } } },
      }),
      this.prisma.customer.count({ where }),
    ]);

    const data = customers.map((c: any) => {
       if (c.contact) {
           const primaryPhone = c.contact.phones && c.contact.phones.length > 0 ? c.contact.phones[0].phone : c.contact.phone;
           return {
               ...c,
               name: c.contact.name || c.name,
               phone: primaryPhone || c.contact.phone || c.phone
           };
       }
       return c;
    });

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

  async findOne(id: number) {
    const customer = await this.prisma.customer.findFirst({
      where: { id, isDeleted: false },
      include: { contact: { include: { phones: true } } },
    });
    
    if (customer && (customer as any).contact) {
        const contact = (customer as any).contact;
        const primaryPhone = contact.phones && contact.phones.length > 0 ? contact.phones[0].phone : contact.phone;
        return {
            ...customer,
            name: contact.name || customer.name,
            phone: primaryPhone || contact.phone || customer.phone
        };
    }
    return customer;
  }

  async update(id: number, updateCustomerDto: UpdateCustomerDto) {
    const customer = await this.prisma.customer.findUnique({ where: { id } });

    // Upgrade Logic: If Local Customer (no contactId) and adding a Phone
    // console.log(`[UpgradeCheck] ID: ${id}, HasContact: ${!!customer?.contactId}, PhoneInPayload: ${updateCustomerDto.phone}, SkipSync: ${updateCustomerDto.skipGoogleSync}`);
 
    if (customer && !customer.contactId && updateCustomerDto.phone) {
        // Validate
        const formattedPhone = this.contactsService.validateAndFormatPhone(updateCustomerDto.phone);
        updateCustomerDto.phone = formattedPhone;

        const userId = customer.userId;
        if (!userId) {
            console.warn(`[UpgradeAborted] Customer ${id} has no userId.`);
            // Cannot upgrade if no owner
            return this.prisma.customer.update({ where: { id }, data: updateCustomerDto });
        }
        
        // Check Sync (similar to create logic)
        // Note: skipGoogleSync might be present if added to UpdateCustomerDto (mapped types)
        // Since UpdateCustomerDto extends Partial(CreateCustomerDto), it should be there.
        if (!updateCustomerDto.skipGoogleSync) {
             const user = await this.prisma.user.findUnique({
                where: { id: userId },
                select: { googleRefreshToken: true },
             });
             const isSynced = !!user?.googleRefreshToken;

             if (!isSynced) {
                 console.warn(`[UpgradeFailed] User ${userId} not synced.`);
                 throw new HttpException(
                    {
                        message: 'Google Sync requires authentication. Cannot upgrade local customer without sync.',
                        code: 'GOOGLE_SYNC_REQUIRED',
                    },
                    HttpStatus.FAILED_DEPENDENCY,
                 );
             }

             // Attempt Create Contact
             try {
                // console.log(`[UpgradeExectuting] Creating contact for User ${userId}, Phone: ${formattedPhone}`);
                const newContact = await this.contactsService.create(userId, {
                    name: updateCustomerDto.name || customer.name || 'Customer',
                    phone: formattedPhone,
                    group: 'Customer',
                });
                
                // Link!
                // console.log(`[UpgradeSuccess] Linked to Contact ${newContact.id}`);
                updateCustomerDto.contactId = newContact.id;
             } catch (error) {
                 console.error('[UpgradeError] Sync/Create failed:', error);
                 if (error instanceof HttpException || error.status === 403 || error.status === 502) {
                     throw new HttpException(
                        'Google Sync Failed during upgrade: ' + error.message,
                        HttpStatus.FAILED_DEPENDENCY
                     );
                 }
                 throw error;
             }
        }
    }

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
