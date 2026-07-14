import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import { SavedEstimatesService } from './saved-estimates.service';

@Controller('saved-estimates')
export class SavedEstimatesController {
  constructor(private readonly savedEstimatesService: SavedEstimatesService) {}

  @Post()
  create(@Body() createDto: any) {
    return this.savedEstimatesService.create(createDto);
  }

  @Get()
  findAll() {
    return this.savedEstimatesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.savedEstimatesService.findOne(+id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.savedEstimatesService.remove(+id);
  }
}
