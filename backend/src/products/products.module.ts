import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { ImagesModule } from '../images/images.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule, ImagesModule],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}
