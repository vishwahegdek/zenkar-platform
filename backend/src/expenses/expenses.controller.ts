import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Req,
} from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { Prisma } from '@prisma/client';

import { CreateExpenseDto } from './dto/create-expense.dto';
import { CreateCategoryDto } from './dto/create-category.dto';

import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';

@ApiTags('expenses')
@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new expense' })
  create(@Req() req, @Body() createExpenseDto: CreateExpenseDto) {
    const userId = req.user.id;
    return this.expensesService.createExpense(userId, createExpenseDto);
  }

  @Get()
  @ApiOperation({ summary: 'Filter expenses' })
  @ApiQuery({ name: 'categoryId', required: false, type: Number })
  @ApiQuery({ name: 'from', required: false, type: Date })
  @ApiQuery({ name: 'to', required: false, type: Date })
  findAll(
    @Query('categoryId') categoryId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const where: Prisma.ExpenseWhereInput = {};
    
    if (categoryId) {
      where.categoryId = parseInt(categoryId);
    }

    if (from || to) {
      where.date = {};
      if (from) where.date.gte = new Date(from);
      if (to) where.date.lte = new Date(to);
    }

    return this.expensesService.findAllExpenses({
      where,
      orderBy: { date: 'desc' },
    });
  }

  @Get('categories')
  findAllCategories() {
    return this.expensesService.findAllCategories();
  }

  @Post('categories')
  createCategory(@Body() body: CreateCategoryDto) {
    return this.expensesService.createCategory(body.name);
  }
  
  // Payee endpoints moved to ContactsController

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateExpenseDto: Prisma.ExpenseUpdateInput, @Req() req) {
    return this.expensesService.updateExpense(+id, updateExpenseDto, req.user?.userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req) {
    return this.expensesService.removeExpense(+id, req.user?.userId);
  }
}
