import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Req,
} from '@nestjs/common';
import { PurchasesService } from './purchases.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('purchases')
@Controller('purchases')
export class PurchasesController {
  constructor(private readonly purchasesService: PurchasesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new purchase' })
  @ApiResponse({
    status: 201,
    description: 'The purchase has been successfully created.',
  })
  create(@Body() createPurchaseDto: CreatePurchaseDto, @Req() req) {
    return this.purchasesService.create(createPurchaseDto, req.user?.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve all purchases' })
  findAll() {
    return this.purchasesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve a specific purchase by ID' })
  findOne(@Param('id') id: string) {
    return this.purchasesService.findOne(+id);
  }
}
