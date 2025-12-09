
import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { ImagesModule } from '../images/images.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule, ImagesModule],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}

