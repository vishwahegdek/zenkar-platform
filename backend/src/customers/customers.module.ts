import { Module } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CustomersController } from './customers.controller';
import { ContactsModule } from '../contacts/contacts.module';
import { LedgerModule } from '../ledger/ledger.module';

@Module({
  imports: [ContactsModule, LedgerModule],
  controllers: [CustomersController],
  providers: [CustomersService],
  exports: [CustomersService],
})
export class CustomersModule {}
