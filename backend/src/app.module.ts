import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core'; // Import APP_GUARD
import { ScheduleModule } from '@nestjs/schedule'; // Import ScheduleModule
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { CustomersModule } from './customers/customers.module';
import { ProductsModule } from './products/products.module';
import { OrdersModule } from './orders/orders.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { AuditModule } from './audit/audit.module'; // Import AuditModule
import { DashboardModule } from './dashboard/dashboard.module'; // Import DashboardModule
import { JwtAuthGuard } from './auth/jwt-auth.guard'; // Import Guard
import { ExpensesModule } from './expenses/expenses.module';
import { ContactsModule } from './contacts/contacts.module';
import { LabourModule } from './labour/labour.module';
import { RecipientsModule } from './recipients/recipients.module';
import { NoCacheInterceptor } from './common/interceptors/no-cache.interceptor';
import { FinanceModule } from './finance/finance.module';
import { ProductCategoriesModule } from './product-categories.module';
import { InventoryModule } from './inventory/inventory.module';
import { PurchasesModule } from './purchases/purchases.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule,
    CustomersModule,
    RecipientsModule,
    ProductsModule,
    OrdersModule,
    UsersModule,
    AuthModule,
    AuditModule,
    DashboardModule,
    ExpensesModule,
    ContactsModule,
    LabourModule,
    FinanceModule,
    ProductCategoriesModule,
    InventoryModule,
    PurchasesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: NoCacheInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply((req, res, next) => {
        console.log(`[Request] ${req.method} ${req.url}`);
        next();
      })
      .forRoutes('*');
  }
}
