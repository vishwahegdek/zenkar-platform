import { Module } from '@nestjs/common';
import { RecipientsService } from './recipients.service';
import { RecipientsController } from './recipients.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [RecipientsController],
  providers: [RecipientsService],
  exports: [RecipientsService],
})
export class RecipientsModule {}
