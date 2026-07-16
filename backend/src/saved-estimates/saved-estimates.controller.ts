import { Controller, Get, Post, Body, Param, Delete, Req } from '@nestjs/common';
import { SavedEstimatesService } from './saved-estimates.service';

@Controller('saved-estimates')
export class SavedEstimatesController {
  constructor(private readonly savedEstimatesService: SavedEstimatesService) {}

  @Post()
  create(@Body() createDto: any, @Req() req: any) {
    const userId = req.user?.id;
    return this.savedEstimatesService.create(createDto, userId);
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
