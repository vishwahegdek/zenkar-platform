import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateContactDto } from './dto/update-contact.dto';

@Injectable()
export class ContactsService {
  constructor(private prisma: PrismaService) {}

  async create(
    userId: number,
    data: {
      name: string;
      phone?: string;
      group?: string;
      skipGoogleSync?: boolean;
    },
  ) {
    let googleId = null;

    // 1. Try pushing to Google if not skipped
    // 1. Try pushing to Google if not skipped
    const { HttpException, HttpStatus } = require('@nestjs/common');

    if (!data.skipGoogleSync) {
      try {
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
        });

        // Check 1: User must have Google Auth
        if (!user?.googleRefreshToken) {
          console.warn(
            'Google Sync Skipped: No Refresh Token. Throwing 424 to warn user.',
          );
          throw new HttpException(
            'Google Contact Sync failed: No Google Account linked.',
            HttpStatus.FAILED_DEPENDENCY,
          );
        }

        // Check 2: Phone is usually required for meaningful sync, though API allows name-only.
        // User requested warning if "created without phone number".
        // If phone is missing, let's treat it as a Sync "Warning" case so they know.
        if (!data.phone) {
          console.warn(
            'Google Sync Warning: Phone missing. Throwing 424 to warn user.',
          );
          throw new HttpException(
            'Google Contact Sync warning: Phone number missing.',
            HttpStatus.FAILED_DEPENDENCY,
          );
        }

        googleId = await this.pushToGoogle(user.googleRefreshToken, data);
      } catch (error) {
        console.error('Google Sync Failed:', error);
        // Throw 424 to trigger frontend "Save Local?" modal
        // If it's already an HttpException, rethrow it, otherwise wrap it
        if (error instanceof HttpException) {
          throw error;
        }
        throw new HttpException(
          'Google Sync Failed: ' + (error.message || 'Unknown'),
          HttpStatus.FAILED_DEPENDENCY,
        );
      }
    }

    // 2. Create Local Contact
    return this.prisma.contact.create({
      data: {
        name: data.name,
        phone: data.phone,
        group: data.group,
        userId,
        googleId,
      },
    });
  }

  // Helper to push to Google
  private async pushToGoogle(
    refreshToken: string,
    contact: { name: string; phone?: string },
  ) {
    const { google } = require('googleapis');
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
        phoneNumbers: contact.phone ? [{ value: contact.phone }] : [],
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

    return res.data.resourceName; // e.g. "people/c123..."
  }

  private async getOrCreateLabel(peopleClient: any): Promise<string | null> {
    const LABEL_NAME = 'Zenkar App';
    try {
      // List groups
      const res = await peopleClient.contactGroups.list({
        groupFields: 'name,groupType',
      }); // optimize: handle pagination if user has > 1000 groups
      const groups = res.data.contactGroups || [];
      const existing = groups.find(
        (g: any) =>
          g.name === LABEL_NAME && g.groupType === 'USER_CONTACT_GROUP',
      );

      if (existing) return existing.resourceName;

      // Create if not exists
      const createRes = await peopleClient.contactGroups.create({
        requestBody: { contactGroup: { name: LABEL_NAME } },
      });
      return createRes.data.resourceName;
    } catch (e) {
      console.error('Failed to manage Google Label:', e);
      return null; // Don't fail the whole sync just for a label
    }
  }

  async findAll(userId: number | undefined, params: any) {
    const { query } = params;
    return this.prisma.contact.findMany({
      where: {
        userId: userId, // undefined means ignore this filter in Prisma (if mapped correctly) OR we need conditional object construction
        // Prisma excludes undefined fields from the query, effectively "Universal View"
        name: query ? { contains: query, mode: 'insensitive' } : undefined,
        isDeleted: false,
      },
      include: {
        user: { select: { username: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(userId: number, id: number) {
    return this.prisma.contact.findFirst({
      where: { id, userId, isDeleted: false },
    });
  }

  async update(id: number, updateContactDto: UpdateContactDto) {
    return this.prisma.contact.update({
      where: { id },
      data: updateContactDto,
    });
  }

  async remove(userId: number, id: number) {
    const contact = await this.findOne(userId, id);
    if (!contact) throw new Error('Contact not found or access denied');

    return this.prisma.contact.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date() },
    });
  }

  async importContacts(userId: number, accessToken: string) {
    const { google } = require('googleapis');
    const people = google.people({
      version: 'v1',
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    let nextPageToken = undefined;
    let count = 0;
    let totalFound = 0;

    do {
      try {
        const res = await people.people.connections.list({
          resourceName: 'people/me',
          personFields: 'names,phoneNumbers,addresses,metadata', // Request metadata
          pageSize: 1000,
          pageToken: nextPageToken,
        });

        const connections = res.data.connections || [];
        totalFound += connections.length;

        for (const person of connections) {
          const name = person.names?.[0]?.displayName;
          const phone = person.phoneNumbers?.[0]?.value;
          const googleId = person.resourceName; // Get the unique ID (e.g., people/c123...)

          if (name) {
            // Priority 1: Check by Google ID (Strict Match)
            let existing: any = null;

            if (googleId) {
              existing = await this.prisma.contact.findFirst({
                where: {
                  userId: userId,
                  googleId: googleId,
                },
              });
            }

            // Simplified Rule: If exists by Google ID -> Skip. If not -> Create.
            // We removed the Name fallback matching as requested by User ("Dont check for name matching")

            if (!existing) {
              await this.prisma.contact.create({
                data: {
                  name,
                  phone: phone || null,
                  userId,
                  googleId: googleId || null,
                },
              });
              count++;
            }
          }
        }

        nextPageToken = res.data.nextPageToken;
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
