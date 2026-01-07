import { Module } from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { ContactsController } from './contacts.controller';
import { PrismaModule } from '../prisma/prisma.module';

import { ContactsSyncService } from './contacts-sync.service';

@Module({
  imports: [PrismaModule],
  controllers: [ContactsController],
  providers: [ContactsService, ContactsSyncService],
  exports: [ContactsService], // Export so ExpensesModule might use it if linked
})
export class ContactsModule {}
