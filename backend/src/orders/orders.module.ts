
import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { PrismaModule } from '../prisma/prisma.module';

import { ProductsModule } from '../products/products.module';
import { CustomersModule } from '../customers/customers.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, ProductsModule, CustomersModule, AuditModule],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}

