
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, Prisma } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findOne(username: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { username },
    });
  }

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({
      data,
    });
  }

  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        username: true,
        createdAt: true
      }
    });
  }
  async updateGoogleCredentials(userId: number, refreshToken: string | null) {
      // Only update if refreshToken is provided (it might be null on subsequent logins if prompt is not consent)
      // But we forced prompt='consent', so it should be there.
      // If it is null, we shouldn't overwrite existing token with null unless intended.
      
      const data: any = { lastSyncAt: new Date() };
      if (refreshToken) {
          data.googleRefreshToken = refreshToken;
      }

      return this.prisma.user.update({
          where: { id: userId },
          data: data
      });
  }
}
