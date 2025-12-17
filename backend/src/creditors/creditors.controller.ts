import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { CreditorsService } from './creditors.service';
import { CreateCreditorDto } from './dto/create-creditor.dto';
import { UpdateCreditorDto } from './dto/update-creditor.dto';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('creditors')
@UseGuards(JwtAuthGuard)
export class CreditorsController {
  constructor(private readonly creditorsService: CreditorsService) {}

  @Post()
  create(@Body() createCreditorDto: CreateCreditorDto, @Request() req) {
    return this.creditorsService.create(createCreditorDto, req.user.id);
  }

  @Get()
  findAll(@Request() req) {
    return this.creditorsService.findAll(req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.creditorsService.findOne(+id, req.user.id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCreditorDto: UpdateCreditorDto, @Request() req) {
    return this.creditorsService.update(+id, updateCreditorDto, req.user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.creditorsService.remove(+id, req.user.id);
  }

  @Post(':id/transactions')
  addTransaction(@Param('id') id: string, @Body() createTransactionDto: CreateTransactionDto, @Request() req) {
    return this.creditorsService.addTransaction(+id, createTransactionDto, req.user.id);
  }
}
