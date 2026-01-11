import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateContactDto } from './dto/update-contact.dto';
import { google } from 'googleapis';

@Injectable()
export class ContactsService {
  constructor(private prisma: PrismaService) {}

  // Helper to strictly validate and format phone to E.164
  public validateAndFormatPhone(phone: string): string {
    // 1. Strip all non-digits (preserving + is not strictly needed if we assume input is digits+separators)
    // But let's strip everything to get raw digits.
    let raw = phone.replace(/\D/g, '');

    // 2. Handle Country Code stripping
    // If explicit +91 or 91 with 12/13 digits
    if (raw.length > 10) {
        if (raw.startsWith('91') && raw.length === 12) {
            raw = raw.substring(2);
        } else if (raw.startsWith('1') && raw.length === 11) { // generic US support if ever needed, but requirement is strict
           // For now, strict: User said "accepted regardless... strictly accept 10 digit". 
           // If I allow 12 digits, I might be too loose. 
           // But typical user behavior is pasting +91.
           // I'll stick to my plan: strip 91 if length is 12.
        }
    }

    // 3. Strict 10 Digit Check
    if (raw.length !== 10) {
        throw new HttpException(
            `Phone number must be exactly 10 digits. Provided: ${phone}`,
            HttpStatus.BAD_REQUEST
        );
    }
    
    // 4. Format to E.164 (+91 prefix for storage ID/consistency)
    // We assume IN context as per project
    return `+91${raw}`;
  }

  async create(
    userId: number,
    data: {
      name: string;
      phone?: string;
      phones?: (string | { value: string, type?: string })[];
      group?: string;
      // skipGoogleSync removed - Strict Mode
    },
  ) {
    let googleId: string | null = null;

    // Normalize phones to structure { value: string, type: string }
    let rawPhones: { value: string, type: string }[] = [];
    
    if (data.phones && Array.isArray(data.phones)) {
        data.phones.forEach(p => {
            if (typeof p === 'string') rawPhones.push({ value: p, type: 'mobile' });
            else if (p && typeof p === 'object' && p.value) rawPhones.push({ value: p.value as string, type: (p.type as string) || 'mobile' });
        });
    }
    if (data.phone) {
        rawPhones.push({ value: data.phone, type: 'mobile' });
    }

    // De-duplicate by formatted value, preserving type
    const uniquePhones = new Map<string, string>();
    rawPhones.forEach(p => {
        const fmt = this.validateAndFormatPhone(p.value);
        if (fmt && !uniquePhones.has(fmt)) {
            uniquePhones.set(fmt, p.type);
        }
    });

    const finalPhones = Array.from(uniquePhones.entries()).map(([phone, type]) => ({ phone, type }));

    // Strict Sync: Always try to push
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user?.googleRefreshToken) {
      throw new HttpException(
        'Action Blocked: Google Account not linked. Please connect Google Contacts to proceed.',
        HttpStatus.FORBIDDEN,
      );
    }

    try {
        if (user.googleRefreshToken === 'MOCK_TOKEN') {
            googleId = 'people/mock_123';
        } else {
            // We know it is present due to check above.
            googleId = await this.pushToGoogle(user.googleRefreshToken!, { name: data.name, phones: finalPhones.map(p => ({ value: p.phone, type: p.type })) });
        }
    } catch (error) {
        console.error('Google Sync Failed:', error);
        throw new HttpException(
          'Google Sync Failed: ' + (error.message || 'Unknown'),
          HttpStatus.BAD_GATEWAY, 
        );
    }

    // 2. Create Local Contact
    return this.prisma.contact.create({
      data: {
        name: data.name,
        phone: finalPhones.length > 0 ? finalPhones[0].phone : null, // Backward compatibility
        group: data.group,
        userId,
        googleId,
        phones: {
            create: finalPhones.map(p => ({ phone: p.phone, type: p.type }))
        }
      },
      include: { phones: true }
    });
  }

  async update(id: number, updateContactDto: UpdateContactDto) {
    const { phones, phone, ...rest } = updateContactDto;
    
    // Authorization Check / Fetch Contact
    const contact = await this.prisma.contact.findUnique({ where: { id }, include: { user: true } });
    if (!contact) throw new Error("Contact not found");
    
    if (!contact.user?.googleRefreshToken) {
        // Enforce strict connection
        throw new HttpException("Action Blocked: Google Account not linked.", HttpStatus.FORBIDDEN);
    }

    // Normalize phones
    let rawPhones: { value: string, type: string }[] = [];
    
    if (phones && Array.isArray(phones)) {
         phones.forEach(p => {
            if (typeof p === 'string') rawPhones.push({ value: p, type: 'mobile' });
            else if (p && typeof p === 'object' && (p as any).value) rawPhones.push({ value: (p as any).value, type: (p as any).type || 'mobile' });
        });
    }
    if (phone) {
        rawPhones.push({ value: phone, type: 'mobile' });
    }

    const uniquePhones = new Map<string, string>();
    rawPhones.forEach(p => {
        const fmt = this.validateAndFormatPhone(p.value);
        if (fmt && !uniquePhones.has(fmt)) {
            uniquePhones.set(fmt, p.type);
        }
    });

    const finalPhones = Array.from(uniquePhones.entries()).map(([phone, type]) => ({ phone, type }));

    // Google Sync logic
    try {
        if (contact.user.googleRefreshToken === 'MOCK_TOKEN') {
            // Skip Real Sync
        } else if (contact.googleId) {
             // 1. Update Existing on Google
             try {
                 await this.updateGoogleContact(contact.user.googleRefreshToken!, contact.googleId, {
                     name: rest.name || contact.name,
                     phones: finalPhones.map(p => ({ value: p.phone, type: p.type }))
                 });
             } catch (e) {
                 if (e.code === 404 || e.status === 404 || (e.message && e.message.includes('NOT_FOUND'))) {
                     console.warn('Google Contact not found (404), re-creating to heal sync.');
                     const newGoogleId = await this.pushToGoogle(contact.user.googleRefreshToken!, {
                         name: rest.name || contact.name,
                         phones: finalPhones.map(p => ({ value: p.phone, type: p.type }))
                     });
                     (rest as any).googleId = newGoogleId;
                 } else {
                     throw e;
                 }
             }
        } else {
             // 2. If no googleId, Create on Google (Repair Sync)
             const newGoogleId = await this.pushToGoogle(contact.user.googleRefreshToken!, {
                 name: rest.name || contact.name,
                 phones: finalPhones.map(p => ({ value: p.phone, type: p.type }))
             });
             (rest as any).googleId = newGoogleId;
        }
    } catch (error) {
         console.error("Google Update Failed", error);
         throw new HttpException("Google Sync Failed: " + error.message, HttpStatus.BAD_GATEWAY);
    }

    const data: any = { ...rest };
    
    if (phones || phone) {
        data.phone = finalPhones.length > 0 ? finalPhones[0].phone : null; // Backward compatibility
        data.phones = {
            deleteMany: {}, 
            create: finalPhones.map(p => ({ phone: p.phone, type: p.type })), 
        };
    }
    
    return this.prisma.contact.update({
      where: { id },
      data: data,
      include: { phones: true },
    });
  }

  // Helper to push to Google (Create)
  private async pushToGoogle(
    refreshToken: string,
    contact: { name: string; phones: { value: string, type: string }[] },
  ) {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
    );
    oauth2Client.setCredentials({ refresh_token: refreshToken });

    const people = google.people({ version: 'v1', auth: oauth2Client });

    // 1. Get or Create Label
    const labelResourceName = await this.getOrCreateLabel(people);

    // 2. Create Contact with Label
    const res = await people.people.createContact({
      requestBody: {
        names: [{ givenName: contact.name }],
        phoneNumbers: contact.phones.map(p => {
             // p is { value, type }
             const type = (p as any).type || 'mobile';
             if (type === 'whatsapp') {
                 return { value: (p as any).value, type: 'other', formattedType: 'WhatsApp' }; // Custom Label
             }
             return { value: (p as any).value, type: type };
        }),
        memberships: labelResourceName
          ? [
              {
                contactGroupMembership: {
                  contactGroupResourceName: labelResourceName,
                },
              },
            ]
          : [],
      },
    });

    return res.data.resourceName as string; 
  }

  // Helper to Update Google Contact
  private async updateGoogleContact(
      refreshToken: string, 
      resourceName: string,
      data: { name: string, phones: { value: string, type: string }[] }
  ) {
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
      );
      oauth2Client.setCredentials({ refresh_token: refreshToken });
      const people = google.people({ version: 'v1', auth: oauth2Client });

      // 1. Get Etag
      // If resourceName is invalid (e.g. deleted on Google), this might throw 404.
      // Ideally we catch 404 and maybe recreate? Or throw error?
      // User said "Complete two way sync". If it's gone on Google, 
      // strict sync implies we probably shouldn't edit it locally or should restore it?
      // For now, let's assume if 404, we fail the update (User action blocked), 
      // or we treat it as "Sync Error".
      const getRes = await people.people.get({
          resourceName: resourceName,
          personFields: 'names,phoneNumbers,metadata'
      });
      const etag = getRes.data.etag;

      // 2. Update
      await people.people.updateContact({
          resourceName: resourceName,
          updatePersonFields: 'names,phoneNumbers',
          requestBody: {
              etag: etag,
              names: [{ givenName: data.name }],
              phoneNumbers: data.phones.map(p => {
                    const type = (p as any).type || 'mobile';
                    if (type === 'whatsapp') {
                        return { value: (p as any).value, type: 'other', formattedType: 'WhatsApp' };
                    }
                    return { value: (p as any).value, type: type };
              }),
          }
      });
  }

  private async getOrCreateLabel(peopleClient: any): Promise<string | null> {
    const LABEL_NAME = 'Zenkar App';
    try {
      const res = await peopleClient.contactGroups.list({
        groupFields: 'name,groupType',
      }); 
      const groups = res.data.contactGroups || [];
      const existing = groups.find(
        (g: any) =>
          g.name === LABEL_NAME && g.groupType === 'USER_CONTACT_GROUP',
      );

      if (existing) return existing.resourceName;

      const createRes = await peopleClient.contactGroups.create({
        requestBody: { contactGroup: { name: LABEL_NAME } },
      });
      return createRes.data.resourceName;
    } catch (e) {
      console.error('Failed to manage Google Label:', e);
      return null; 
    }
  }

  async findAll(userId: number | undefined, query: any) {
    const { search, page = 1, limit = 50 } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where: any = {
        userId: userId,
        isDeleted: false,
    };
    
    if (search) {
        where.OR = [
            { name: { contains: search, mode: 'insensitive' } },
            { phones: { some: { phone: { contains: search } } } }
        ];
    }

    const [data, total] = await Promise.all([
        this.prisma.contact.findMany({
            where,
            include: {
                user: { select: { username: true } },
                phones: true, 
            },
            orderBy: { name: 'asc' },
            skip,
            take,
        }),
        this.prisma.contact.count({ where })
    ]);

    return {
        data,
        meta: {
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(total / Number(limit))
        }
    };
  }

  async findOne(userId: number, id: number) {
    return this.prisma.contact.findFirst({
      where: { id, userId, isDeleted: false },
      include: { phones: true },
    });
  }

  async remove(userId: number, id: number) {
    const contact = await this.findOne(userId, id);
    if (!contact) throw new Error('Contact not found or access denied');
    
    // We do NOT delete from Google as per "We are not dealing with delete in the google servers."
    return this.prisma.contact.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date() },
    });
  }

  async importContacts(userId: number, accessToken: string) {
    const people = google.people({
      version: 'v1',
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    let nextPageToken: string | undefined = undefined;
    let count = 0;
    let totalFound = 0;

    do {
      try {
        const res = await people.people.connections.list({
          resourceName: 'people/me',
          personFields: 'names,phoneNumbers,addresses,metadata', 
          pageSize: 1000,
          pageToken: nextPageToken,
        });

        const connections = res.data.connections || [];
        totalFound += connections.length;

        for (const person of connections) {
          const name = person.names?.[0]?.displayName;
          const googleId = person.resourceName; 
          
          const rawPhones = person.phoneNumbers || [];
          
          const finalPhones: { phone: string, type: string }[] = [];
          
          rawPhones.forEach((p: any) => {
               const val = p.value;
               // Import might fail if we enforce strictness on dirty google data.
               // But user said "customer and contact creation logic". 
               // For import, maybe we should be cleaner?
               // Let's use relax logic for import to avoid crashing sync if Google has old bad data?
               // BUT requirement said "save the number in our desired format".
               // I'll try to use strict, but wrap in try/catch to filter out bad numbers instead of crashing.
               let fmt: string | null = null;
               try {
                   fmt = this.validateAndFormatPhone(val);
               } catch (e) {
                   // Ignore invalid numbers during import
               }
               
               let type = p.type || 'mobile';
               if (p.formattedType === 'WhatsApp' || (p.type === 'other' && p.formattedType === 'WhatsApp')) {
                   type = 'whatsapp';
               } else if (p.formattedType && !['mobile','home','work'].includes(type) ) {
                    // Try to use label if standard type is other/missing
                   // But user only asked for whatsapp support specifically.
                   // Let's keep existing logic + whatsapp.
               }
               
               if (fmt) {
                   finalPhones.push({ phone: fmt, type: type.toLowerCase() }); // standardize
               }
          });

          // De-duplicate
          const uniqueMap = new Map();
          finalPhones.forEach(item => {
              if (!uniqueMap.has(item.phone)) uniqueMap.set(item.phone, item.type);
              // Priority logic? e.g. if whatsapp exists and mobile exists for same number?
              // For now, first wins.
          });
          const dedupedCtxPhones = Array.from(uniqueMap.entries()).map(([phone, type]) => ({ phone, type }));

          if (name) {
            let existing: any = null;

            if (googleId) {
              existing = await this.prisma.contact.findFirst({
                where: {
                  userId: userId,
                  googleId: googleId,
                },
              });
            }

            if (!existing) {
              await this.prisma.contact.create({
                data: {
                  name,
                  phone: dedupedCtxPhones.length > 0 ? dedupedCtxPhones[0].phone : null,
                  userId,
                  googleId: googleId || null,
                  phones: {
                    create: dedupedCtxPhones.map(p => ({ phone: p.phone, type: p.type }))
                  }
                },
              });
              count++;
            } else {
                // UPDATE existing contact (Google -> App Sync)
                // We overwrite local phones with Google phones to ensure strict sync
                await this.prisma.contact.update({
                    where: { id: existing.id },
                    data: {
                        name: name,
                        phone: dedupedCtxPhones.length > 0 ? dedupedCtxPhones[0].phone : null,
                        phones: {
                            deleteMany: {},
                            create: dedupedCtxPhones.map(p => ({ phone: p.phone, type: p.type }))
                        }
                    }
                });
                count++;
            }
          }
        }

        nextPageToken = res.data.nextPageToken || undefined;
      } catch (error) {
        console.error('Error importing contacts from Google:', error);
        if (error.code === 404 || error.status === 404) {
          console.warn(
            'Google People API returned 404. User might not have a Google Profile or Contacts.',
          );
          break;
        }
        throw error;
      }
    } while (nextPageToken);

    return { imported: count, totalFound: totalFound };
  }
}
