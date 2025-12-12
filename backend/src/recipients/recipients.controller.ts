import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { RecipientsService } from './recipients.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';

@ApiTags('recipients')
@UseGuards(JwtAuthGuard)
@Controller('recipients')
export class RecipientsController {
  constructor(private readonly recipientsService: RecipientsService) {}

  @Get()
  @ApiOperation({ summary: 'Search recipients' })
  @ApiQuery({ name: 'query', required: false })
  findAll(@Request() req, @Query('query') query?: string) {
    return this.recipientsService.findAll(req.user.userId, query);
  }
}
