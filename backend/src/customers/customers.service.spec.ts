import { Test, TestingModule } from '@nestjs/testing';
import { UtilsModule } from '../utils/utils.module';
import { CustomersService } from './customers.service';
import { PrismaService } from '../prisma/prisma.service';
import { mockPrismaService } from '../prisma/prisma.service.mock';
import { ContactsService } from '../contacts/contacts.service';
import { LedgerService } from '../ledger/ledger.service';

describe('CustomersService', () => {
  let service: CustomersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomersService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ContactsService, useValue: {} },
        { provide: LedgerService, useValue: {} },
      ],
    }).compile();

    service = module.get<CustomersService>(CustomersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
