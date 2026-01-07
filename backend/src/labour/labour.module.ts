import { Module } from '@nestjs/common';
import { LabourService } from './labour.service';
import { LabourController } from './labour.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [LabourController],
  providers: [LabourService],
})
export class LabourModule {}
