import { Module } from '@nestjs/common';
import { SavedEstimatesController } from './saved-estimates.controller';
import { SavedEstimatesService } from './saved-estimates.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SavedEstimatesController],
  providers: [SavedEstimatesService],
})
export class SavedEstimatesModule {}
