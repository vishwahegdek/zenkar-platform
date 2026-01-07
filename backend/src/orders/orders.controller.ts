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
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { SyncPaymentsDto } from './dto/sync-payments.dto';

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new order' })
  @ApiResponse({
    status: 201,
    description: 'The order has been successfully created.',
  })
  create(@Body() createOrderDto: CreateOrderDto, @Req() req) {
    return this.ordersService.create(createOrderDto, req.user?.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve all orders' })
  @ApiResponse({ status: 200, description: 'List of all orders.' })
  findAll(
    @Query('view') view: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('search') search: string,
  ) {
    return this.ordersService.findAll(view, +page || 1, +limit || 20, search);
  }

  @Get('production/items')
  getProductionItems(
    @Query('categoryId') categoryId: string,
    @Query('productId') productId?: string,
  ) {
    if (!categoryId) {
      // Return empty or fail? User said "Upon selecting a category..." implies filtered view.
      // Return empty array if not selected
      return [];
    }
    return this.ordersService.findProductionItems(
      +categoryId,
      productId ? +productId : undefined,
    );
  }

  @Patch('items/:itemId/status')
  @ApiOperation({ summary: 'Update order item status' })
  updateItemStatus(
      @Param('itemId') itemId: string,
      @Body('status') status: string,
      @Req() req
  ) {
      return this.ordersService.updateItemStatus(+itemId, status, req.user?.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve a specific order by ID' })
  @ApiResponse({ status: 200, description: 'The order details.' })
  @ApiResponse({ status: 404, description: 'Order not found.' })
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an order' })
  @ApiResponse({ status: 200, description: 'The updated order.' })
  update(
    @Param('id') id: string,
    @Body() updateOrderDto: UpdateOrderDto,
    @Req() req,
  ) {
    return this.ordersService.update(+id, updateOrderDto, req.user?.userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete (soft delete) an order' })
  @ApiResponse({ status: 200, description: 'Order successfully deleted.' })
  remove(@Param('id') id: string, @Req() req) {
    return this.ordersService.remove(+id, req.user?.userId);
  }

  @Post(':id/payments')
  @ApiOperation({ summary: 'Add a payment to an order' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        amount: { type: 'number' },
        method: { type: 'string', example: 'CASH' },
        date: { type: 'string' },
        note: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Payment added successfully.' })
  addPayment(
    @Param('id') id: string,
    @Body()
    body: { amount: number; method?: string; date: string; note?: string },
    @Req() req,
  ) {
    return this.ordersService.addPayment(
      +id,
      +body.amount,
      body.method || 'CASH',
      new Date(body.date),
      body.note,
      req.user?.userId,
    );
  }

  @Patch(':id/payments')
  @ApiOperation({ summary: 'Sync/Replace all payments for an order' })
  @ApiResponse({ status: 200, description: 'Payments synced successfully.' })
  syncPayments(
    @Param('id') id: string,
    @Body() body: SyncPaymentsDto,
    @Req() req,
  ) {
    return this.ordersService.syncPayments(
      +id,
      body.payments,
      req.user?.userId,
    );
  }

  @Get(':id/gst-invoice')
  @ApiOperation({ summary: 'Get GST Invoice for order' })
  getGstInvoice(@Param('id') id: string) {
    return this.ordersService.getGstInvoice(+id);
  }

  @Post(':id/gst-invoice')
  @ApiOperation({ summary: 'Create/Update GST Invoice' })
  upsertGstInvoice(@Param('id') id: string, @Body() body: any, @Req() req) {
    return this.ordersService.upsertGstInvoice(+id, body, req.user?.userId);
  }
}
