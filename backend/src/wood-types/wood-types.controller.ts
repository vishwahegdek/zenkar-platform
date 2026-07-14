import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { WoodTypesService } from './wood-types.service';

@Controller('wood-types')
export class WoodTypesController {
  constructor(private readonly woodTypesService: WoodTypesService) {}

  @Get()
  findAll() {
    return this.woodTypesService.findAll();
  }

  @Post()
  create(@Body() data: { name: string; price: number }) {
    return this.woodTypesService.create(data);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: { name?: string; price?: number }) {
    return this.woodTypesService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.woodTypesService.remove(id);
  }
}
