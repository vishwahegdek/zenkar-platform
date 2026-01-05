import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { ContactsService } from './contacts.service';

@Injectable()
export class ContactsSyncService {
  private readonly logger = new Logger(ContactsSyncService.name);

  constructor(
    private prisma: PrismaService,
    private contactsService: ContactsService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleCron() {
    this.logger.log('Starting hourly Google Contacts sync...');
    
    const users = await this.prisma.user.findMany({
      where: {
        googleRefreshToken: { not: null },
      },
    });

    for (const user of users) {
      if (!user.googleRefreshToken) continue;

      try {
        const { google } = require('googleapis');
        const oauth2Client = new google.auth.OAuth2(
          process.env.GOOGLE_CLIENT_ID,
          process.env.GOOGLE_CLIENT_SECRET,
        );

        oauth2Client.setCredentials({
          refresh_token: user.googleRefreshToken,
        });

        // Get new access token
        const { credentials } = await oauth2Client.refreshAccessToken();
        const newAccessToken = credentials.access_token;

        if (newAccessToken) {
           await this.contactsService.importContacts(user.id, newAccessToken);
           
           await this.prisma.user.update({
               where: { id: user.id },
               data: { lastSyncAt: new Date() }
           });
           this.logger.log(`Synced contacts for user ${user.username} (${user.id})`);
        }

      } catch (error) {
        this.logger.error(
          `Failed to sync contacts for user ${user.id}: ${error.message}`,
          error.stack,
        );
        // Optional: If error is "invalid_grant", we might want to nullify the refresh token
        // to stop retrying, but let's be conservative for now.
      }
    }
  }
}
