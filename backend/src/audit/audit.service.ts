
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(userId: number, action: string, resource: string, resourceId: string | number, details?: any) {
    // If no user is logged in (e.g. public action or system), userId might be null.
    // However, for auditing we usually want a user.
    // If userId is missing, we might log it as System (if we had a system user) or just null.
    
    try {
        await this.prisma.auditLog.create({
        data: {
            userId: userId || null,
            action,
            resource,
            resourceId: String(resourceId),
            details: details ? details : undefined, // Prisma handles JSON
        },
        });
    } catch (error) {
        console.error('Failed to create audit log', error);
        // Don't throw, so we don't break the main flow
    }
  }
}
