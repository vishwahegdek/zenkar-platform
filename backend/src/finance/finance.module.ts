import { Module } from '@nestjs/common';
import { FinanceController } from './finance.controller';
import { FinanceService } from './finance.service';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [FinanceController],
  providers: [FinanceService],
  exports: [FinanceService], // Export if needed elsewhere
})
export class FinanceModule {}
