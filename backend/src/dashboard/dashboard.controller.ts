import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';

@ApiTags('dashboard')
@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get aggregated dashboard stats' })
  @ApiQuery({ name: 'date', required: false })
  getStats(@Query('date') date?: string) {
    return this.dashboardService.getStats(date);
  }

  @Get('payments')
  @ApiOperation({ summary: 'Get payments for a specific date (or today)' })
  @ApiQuery({ name: 'date', required: false })
  getPayments(@Query('date') date?: string) {
    return this.dashboardService.getPayments(date);
  }

  @Get('activities')
  @ApiOperation({ summary: 'Get recent audit activities' })
  getActivities() {
    return this.dashboardService.getRecentActivities();
  }

  @Get('cashflow')
  @ApiOperation({ summary: 'Get cashflow timeline and summary' })
  @ApiQuery({ name: 'from', required: true })
  @ApiQuery({ name: 'to', required: true })
  getCashflow(@Query('from') from: string, @Query('to') to: string) {
    return this.dashboardService.getCashflow(from, to);
  }
}
