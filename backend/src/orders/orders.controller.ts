import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

import { SyncPaymentsDto } from './dto/sync-payments.dto';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(@Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.create(createOrderDto);
  }

  @Get()
  findAll(@Query('view') view?: string) {
    return this.ordersService.findAll(view);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateOrderDto: UpdateOrderDto) {
    return this.ordersService.update(+id, updateOrderDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ordersService.remove(+id);
  }

  @Post(':id/payments')
  addPayment(@Param('id') id: string, @Body() body: { amount: number; date: string; note?: string }) {
    return this.ordersService.addPayment(+id, +body.amount, new Date(body.date), body.note);
  }

  @Patch(':id/payments')
  syncPayments(@Param('id') id: string, @Body() body: SyncPaymentsDto) {
    return this.ordersService.syncPayments(+id, body.payments);
  }
}
