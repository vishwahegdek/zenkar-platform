import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, Request, Query } from '@nestjs/common';
import { SuppliersService } from './suppliers.service';

@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Post()
  create(
    @Body() createData: { name: string; phone?: string; address?: string },
    @Request() req: any,
  ) {
    const userId = req.user?.id;
    return this.suppliersService.create({ ...createData, userId });
  }

  @Get()
  findAll(@Query('query') query: string) {
    return this.suppliersService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.suppliersService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateData: { name?: string; phone?: string; address?: string },
  ) {
    return this.suppliersService.update(id, updateData);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.suppliersService.remove(id);
  }
}
