import { Module } from '@nestjs/common';
import { ImagesService } from './images.service';
import { StorageModule } from '../storage/storage.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [StorageModule, PrismaModule],
  providers: [ImagesService],
  exports: [ImagesService],
})
export class ImagesModule {}
