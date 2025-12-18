
import { Controller, Get, Post, Body, Query, UseGuards, Request, Param, Delete } from '@nestjs/common';
import { LabourService } from './labour.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

import { CreateLabourerDto } from './dto/create-labourer.dto';
import { UpdateDailyViewDto } from './dto/update-daily-view.dto';
import { CreateSettlementDto } from './dto/create-settlement.dto';

import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';

@ApiTags('labour')
@Controller('labour')
@UseGuards(JwtAuthGuard)
export class LabourController {
  constructor(private readonly labourService: LabourService) {}

  @Get('daily')
  @ApiOperation({ summary: 'Get daily labour view' })
  @ApiQuery({ name: 'date', required: false, type: Date })
  getDailyView(@Request() req, @Query('date') date: string) {
    return this.labourService.getDailyView(new Date(date || new Date()));
  }

  @Post('daily')
  updateDailyView(@Request() req, @Body() body: UpdateDailyViewDto) {
    return this.labourService.updateDailyView(req.user.userId, body.date, body.updates);
  }

  @Get('report')
  getReport(@Request() req, @Query('from') from?: string, @Query('to') to?: string, @Query('labourerId') labourerId?: string, @Query('settlementId') settlementId?: string) {
    return this.labourService.getReport(from, to, labourerId ? Number(labourerId) : undefined, settlementId ? Number(settlementId) : undefined);
  }

  @Post()
  create(@Request() req, @Body() body: CreateLabourerDto) {
      return this.labourService.createLabourer(body);
  }

  @Get() 
  findAll(@Request() req) {
      // We can reuse getReport or just get basic list
      // Let's use getReport for now or just simple list without report data?
      // LabourManage needs simple list. Reuse partial reasoning of getDailyView or just fetch.
      // Ideally separate method, but for speed let's just use getReport or add findAll in service.
      // Actually, LabourManage calls /contacts currently. We need to redirect it to /labour.
      // Let's add simple list method.
      return this.labourService.getReport(); // Report returns list with details, heavy but works.
  }

  @Post(':id') // Using POST for update to avoid PATCH complexity/CORS sometimes
  update(@Request() req, @Param('id') id: string, @Body() body: CreateLabourerDto) {
      return this.labourService.updateLabourer(Number(id), body);
  }

  @Delete(':id')
  delete(@Request() req, @Param('id') id: string) {
      return this.labourService.deleteLabourer(Number(id));
  }

  @Post(':id/settle')
  @ApiOperation({ summary: 'Create a settlement (Zero Date)' })
  createSettlement(@Param('id') id: string, @Body() body: CreateSettlementDto) {
      return this.labourService.createSettlement(Number(id), new Date(body.settlementDate), body.note, body.isCarryForward);
  }

  @Get(':id/settlements')
  @ApiOperation({ summary: 'Get history of settlements' })
  getSettlements(@Param('id') id: string) {
      return this.labourService.getSettlements(Number(id));
  }
}
