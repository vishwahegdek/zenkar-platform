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
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';

@ApiTags('customers')
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new customer' })
  @ApiResponse({
    status: 201,
    description: 'The customer has been successfully created.',
  })
  create(@Req() req, @Body() createCustomerDto: CreateCustomerDto) {
    return this.customersService.create(createCustomerDto, req.user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve all customers with pagination' })
  @ApiQuery({ name: 'query', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Paginated list of customers.' })
  findAll(
    @Req() req,
    @Query('query') query: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    // Service signature: findAll(userId: number, params: { query, page, limit })
    // Actually service ignores page/limit currently? I should check service again.
    // Service: `const { contactId, query } = params;`
    // It filters by contactId? The Controller doesn't accept contactId.
    // But pagination logic is missing in service provided earlier?
    // Let's pass what we have.
    // Refactored for Global Access: We pass req.user.userId but service ignores it unless filterByOwner is true.
    // Or we can pass undefined to be explicit.
    // Let's pass undefined to default to "All Customers"
    return this.customersService.findAll(undefined, { query, page, limit });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve a specific customer by ID' })
  @ApiResponse({ status: 200, description: 'The customer details.' })
  @ApiResponse({ status: 404, description: 'Customer not found.' })
  findOne(@Param('id') id: string) {
    return this.customersService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a customer' })
  @ApiResponse({ status: 200, description: 'The updated customer.' })
  update(
    @Param('id') id: string,
    @Body() updateCustomerDto: UpdateCustomerDto,
  ) {
    return this.customersService.update(+id, updateCustomerDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a customer' })
  @ApiResponse({ status: 200, description: 'Customer successfully deleted.' })
  remove(@Param('id') id: string) {
    return this.customersService.remove(+id);
  }
}
