
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ContactsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: number, data: { name: string; phone?: string; group?: string }) {
    return this.prisma.contact.create({
      data: {
        ...data,
        userId,
      },
    });
  }

  async findAll(userId: number) {
    return this.prisma.contact.findMany({
      where: {
        userId,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async findOne(userId: number, id: number) {
    return this.prisma.contact.findFirst({
      where: {
        id,
        userId,
      },
    });
  }

  async update(userId: number, id: number, data: { name?: string; phone?: string; group?: string }) {
    // Verify ownership
    const contact = await this.findOne(userId, id);
    if (!contact) throw new Error('Contact not found or access denied');

    return this.prisma.contact.update({
      where: { id },
      data,
    });
  }

  async remove(userId: number, id: number) {
    // Verify ownership
    const contact = await this.findOne(userId, id);
    if (!contact) throw new Error('Contact not found or access denied');

    return this.prisma.contact.delete({
      where: { id },
    });
  }

  async importContacts(userId: number, accessToken: string) {
    const { google } = require('googleapis');
    const people = google.people({ version: 'v1', headers: { Authorization: `Bearer ${accessToken}` } });
    
    let nextPageToken = undefined;
    let count = 0;
    let totalFound = 0;

    do {
      try {
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
          // const address = person.addresses?.[0]?.formattedValue; // Contact model doesn't have address?
          // Schema Check: Contact model: name, phone, group. No address.
          // Ignoring address for now or I should add it? User didn't request address change.

          if (name) {
            const exists = await this.prisma.contact.findFirst({
                where: { 
                    AND: [
                        { userId: userId },
                        { name: name }
                    ]
                }
            });

            if (!exists) {
               await this.prisma.contact.create({
                 data: {
                   name,
                   phone: phone || null,
                   userId
                 }
               });
               count++;
            }
          }
        }
        
        nextPageToken = res.data.nextPageToken;

      } catch (error) {
          console.error('Error importing contacts from Google:', error);
          if (error.code === 404 || error.status === 404) {
             console.warn('Google People API returned 404. User might not have a Google Profile or Contacts.');
             break; 
          }
          throw error; 
      }

    } while (nextPageToken);

    return { imported: count, totalFound: totalFound };
  }
}
