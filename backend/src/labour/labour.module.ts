import { Module } from '@nestjs/common';
import { LabourService } from './labour.service';
import { LabourController } from './labour.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { LedgerModule } from '../ledger/ledger.module';

@Module({
  imports: [PrismaModule, LedgerModule],
  controllers: [LabourController],
  providers: [LabourService],
})
export class LabourModule {}
