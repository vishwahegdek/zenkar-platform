import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { PrismaModule } from '../prisma/prisma.module';

import { ProductsModule } from '../products/products.module';
import { CustomersModule } from '../customers/customers.module';
import { AuditModule } from '../audit/audit.module';
import { LedgerModule } from '../ledger/ledger.module';

@Module({
  imports: [PrismaModule, ProductsModule, CustomersModule, AuditModule, LedgerModule],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
