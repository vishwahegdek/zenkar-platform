import { Controller, Get, Post, Body, UseGuards, Query } from '@nestjs/common';
import { LedgerService } from './ledger.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';

@ApiTags('ledger')
@Controller('ledger')
@UseGuards(JwtAuthGuard)
export class LedgerController {
  constructor(private readonly ledgerService: LedgerService) {}

  @Get('entries')
  @ApiOperation({ summary: 'Get ledger entries' })
  @ApiQuery({ name: 'from', required: true })
  @ApiQuery({ name: 'to', required: true })
  @ApiQuery({ name: 'accountId', required: false })
  getEntries(
    @Query('from') from: string, 
    @Query('to') to: string,
    @Query('accountId') accountId?: string
  ) {
    return this.ledgerService.getLedgerEntries(from, to, accountId ? Number(accountId) : undefined);
  }

  @Get('accounts')
  @ApiOperation({ summary: 'Get all ledger accounts' })
  getAccounts() {
    return this.ledgerService.getAccounts();
  }

  @Post('accounts')
  @ApiOperation({ summary: 'Create a new manual ledger account' })
  createAccount(
    @Body() data: { name: string; type: string; subType: string }
  ) {
    return this.ledgerService.createManualAccount(data.name, data.type, data.subType);
  }

  @Get('balance-sheet')
  @ApiOperation({ summary: 'Get balance sheet report' })
  @ApiQuery({ name: 'date', required: false })
  getBalanceSheet(@Query('date') date?: string) {
    return this.ledgerService.getBalanceSheet(date);
  }

  @Post('adjustments')
  @ApiOperation({ summary: 'Create a manual ledger adjustment' })
  async createAdjustment(
    @Body() data: { debitAccountId: number; creditAccountId: number; amount: number; note: string; date: string }
  ) {
    // Generate a unique transaction ID for the manual adjustment
    const transactionId = `MANUAL-${Date.now()}`;
    
    await this.ledgerService.recordDoubleEntry({
      transactionId,
      sourceType: 'MANUAL',
      sourceId: null, // No source entity for manual adjustments
      date: new Date(data.date),
      debitAccountId: data.debitAccountId,
      creditAccountId: data.creditAccountId,
      amount: data.amount,
      note: data.note,
    });
    
    return { success: true, transactionId };
  }
}
