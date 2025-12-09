import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { CustomersModule } from './customers/customers.module';
import { ProductsModule } from './products/products.module';
import { OrdersModule } from './orders/orders.module';
import { ImagesModule } from './images/images.module';

@Module({
  imports: [PrismaModule, CustomersModule, ProductsModule, OrdersModule, ImagesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
