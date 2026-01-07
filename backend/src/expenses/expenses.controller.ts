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
  @ApiQuery({ name: 'date', required: false, type: Date })
  findAll(
    @Query('categoryId') categoryId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('date') date?: string,
    @Query('search') search?: string,
  ) {
    const where: Prisma.ExpenseWhereInput = {};

    if (categoryId) {
      where.categoryId = parseInt(categoryId);
    }

    if (date) {
      where.date = new Date(date);
    } else if (from || to) {
      where.date = {};
      if (from) where.date.gte = new Date(from);
      if (to) where.date.lte = new Date(to);
    } // else default is ALL time if no params, but frontend will default to Today.

    if (search) {
      const searchLower = search.toLowerCase();
      // Since Prisma search on relations can be tricky with OR, we might need advanced filtering or just simple contains on Description.
      // For now, let's search description. Relation search (Recipient/Labourer name) requires joined filtering which Prisma supports via 'some'.
      where.OR = [
        { description: { contains: search, mode: 'insensitive' } },
        { recipient: { name: { contains: search, mode: 'insensitive' } } },
        { labourer: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    return this.expensesService.findAllExpenses({
      where,
      orderBy: { updatedAt: 'desc' },
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

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.expensesService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateExpenseDto: Prisma.ExpenseUpdateInput,
    @Req() req,
  ) {
    return this.expensesService.updateExpense(
      +id,
      updateExpenseDto,
      req.user?.id,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req) {
    return this.expensesService.removeExpense(+id, req.user?.id);
  }
}
