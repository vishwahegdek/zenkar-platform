import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFinancePartyDto } from './dto/create-party.dto';
import { CreateFinanceTransactionDto, TransactionType } from './dto/create-transaction.dto';

@Injectable()
export class FinanceService {
  constructor(private prisma: PrismaService) {}

  async createParty(userId: number, dto: CreateFinancePartyDto) {
    const party = await this.prisma.financeParty.create({
      data: {
        userId,
        name: dto.name,
        phone: dto.phone,
        contactId: dto.contactId,
        notes: dto.notes,
        type: dto.type,
      },
      include: { contact: true }
    });

    return {
        ...party,
        name: party.contact ? party.contact.name : party.name,
        phone: party.contact ? party.contact.phone : party.phone,
    };
  }

  async getAllParties(userId: number, type?: string) {
    const whereClause: any = { userId };
    // If type is provided, filter by it (optional view filter)
    if (type) {
      whereClause.type = type;
    }

    const parties = await this.prisma.financeParty.findMany({
      where: whereClause,
      include: {
        transactions: true,
        contact: true, // Fetch contact details
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Calculate balances
    return parties.map((party) => {
      let borrowed = 0;
      let repaid = 0;
      let lent = 0;
      let collected = 0;

      party.transactions.forEach((tx) => {
        const amt = Number(tx.amount);
        switch (tx.type) {
          case 'BORROWED':
            borrowed += amt;
            break;
          case 'REPAID':
            repaid += amt;
            break;
          case 'LENT':
            lent += amt;
            break;
          case 'COLLECTED':
            collected += amt;
            break;
        }
      });

      const netPayable = borrowed - repaid; // We owe
      const netReceivable = lent - collected; // They owe
      const netBalance = netPayable - netReceivable; 
      // Positive = We Owe (Liability)
      // Negative = They Owe (Asset)

      return {
        ...party,
        name: party.contact ? party.contact.name : party.name,
        phone: party.contact ? party.contact.phone : party.phone,
        stats: {
          borrowed,
          repaid,
          lent,
          collected,
          netBalance,
        },
      };
    });
  }

  async getParty(id: number, userId: number) {
    const party = await this.prisma.financeParty.findFirst({
      where: { id, userId },
      include: { 
          transactions: { orderBy: { date: 'desc' } },
          contact: true
      },
    });

    if (!party) throw new NotFoundException('Party not found');
    
    // Calculate stats same as list
    let borrowed = 0;
    let repaid = 0;
    let lent = 0;
    let collected = 0;

    party.transactions.forEach((tx) => {
      const amt = Number(tx.amount);
      switch (tx.type) {
        case 'BORROWED': borrowed += amt; break;
        case 'REPAID': repaid += amt; break;
        case 'LENT': lent += amt; break;
        case 'COLLECTED': collected += amt; break;
      }
    });

    const netBalance = (borrowed - repaid) - (lent - collected);

    return {
      ...party,
      name: party.contact ? party.contact.name : party.name,
      phone: party.contact ? party.contact.phone : party.phone,
      stats: {
        borrowed, repaid, lent, collected, netBalance
      }
    };
  }

  async addTransaction(partyId: number, dto: CreateFinanceTransactionDto) {
      return this.prisma.financeTransaction.create({
          data: {
              financePartyId: partyId,
              amount: dto.amount,
              type: dto.type, // ENUM
              date: new Date(dto.date),
              note: dto.note
          }
      });
  }

  async updateParty(id: number, userId: number, data: Partial<CreateFinancePartyDto>) {
      return this.prisma.financeParty.updateMany({
          where: { id, userId },
          data
      });
  }
}
