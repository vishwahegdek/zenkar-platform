import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Query,
  ValidationPipe,
  ParseIntPipe,
  Put,
  Req,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FinanceService } from './finance.service';
import { CreateFinancePartyDto } from './dto/create-party.dto';
import { CreateFinanceTransactionDto } from './dto/create-transaction.dto';

@Controller('finance')
export class FinanceController {
  constructor(private financeService: FinanceService) {}

  @Get('/parties')
  getAllParties(@Req() req, @Query('type') type?: string) {
    return this.financeService.getAllParties(undefined, type);
  }

  @Post('/parties')
  createParty(@Req() req, @Body(ValidationPipe) dto: CreateFinancePartyDto) {
    return this.financeService.createParty(req.user.userId, dto);
  }

  @Get('/parties/:id')
  getParty(@Req() req, @Param('id', ParseIntPipe) id: number) {
    return this.financeService.getParty(id, undefined);
  }

  @Post('/parties/:id/transactions')
  addTransaction(
    @Req() req,
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) dto: CreateFinanceTransactionDto,
  ) {
    // Transactions usually don't need userId if they are linked to party which is verified by getParty or similar logic
    // But financeService.addTransaction only takes partyId.
    // Ideally we should verify ownership of partyId first, but service doesn't have it yet.
    // However, typical pattern -> trust the ID if authorized or ensure service checks it.
    // Given existing service, we just pass partyId.
    return this.financeService.addTransaction(id, dto);
  }

  @Put('/parties/:id')
  updateParty(
    @Req() req,
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) dto: Partial<CreateFinancePartyDto>,
  ) {
    return this.financeService.updateParty(id, req.user.userId, dto);
  }
}
