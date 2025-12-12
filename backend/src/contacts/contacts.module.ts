
import { Module } from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { ContactsController } from './contacts.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ContactsController],
  providers: [ContactsService],
  exports: [ContactsService], // Export so ExpensesModule might use it if linked
})
export class ContactsModule {}
