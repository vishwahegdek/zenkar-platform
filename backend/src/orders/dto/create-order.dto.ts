import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsDateString, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

class OrderItemDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional() @IsNumber() productId?: number;

  @ApiPropertyOptional({ example: 'Custom Item' })
  @IsOptional() @IsString() productName?: string;
  
  @ApiPropertyOptional({ example: 'Description' })
  @IsOptional() @IsString() description?: string;

  @ApiProperty({ example: 2 })
  @IsNumber() quantity: number;

  @ApiProperty({ example: 50 })
  @IsNumber() unitPrice: number;

  @ApiProperty({ example: 100 })
  @IsNumber() lineTotal: number;
}

class PaymentDto {
    @ApiProperty({ example: 100 })
    amount: number;

    @ApiProperty({ example: 'CASH' })
    method: string;
    
    @ApiPropertyOptional({ example: 'Initial deposit' })
    note?: string;
}

export class CreateOrderDto {
  @ApiPropertyOptional({ example: 'ORD-123' })
  @IsOptional() @IsString() orderNo?: string;

  @ApiProperty({ example: 1, description: 'Customer ID (0 for new/walk-in)' })
  @IsNumber() customerId: number;
    
  @ApiPropertyOptional({ example: 'John Walkin' })
  @IsOptional() @IsString() customerName?: string;

  @ApiPropertyOptional({ example: '9988776655' })
  @IsOptional() @IsString() customerPhone?: string;
  
  @ApiPropertyOptional({ example: '123 Street' })
  @IsOptional() @IsString() customerAddress?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional() @IsNumber() contactId?: number;

  @ApiProperty({ example: '2023-10-25T10:00:00Z' })
  @IsDateString() orderDate?: string;

  @ApiPropertyOptional({ example: '2023-11-25T10:00:00Z' })
  @IsOptional() @IsDateString() dueDate?: string;

  @ApiPropertyOptional({ example: 'pending', enum: ['pending', 'completed', 'cancelled', 'closed'] })
  @IsOptional() @IsString() status?: string;

  @ApiProperty({ example: 1000 })
  @IsNumber() totalAmount: number;

  @ApiProperty({ example: 0, description: 'Legacy advance amount field' })
  @IsNumber() advanceAmount: number;

  @ApiPropertyOptional({ example: 'Urgent order' })
  @IsOptional() @IsString() notes?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional() isQuickSale?: boolean;

  @ApiPropertyOptional({ example: 'CASH' })
  @IsOptional() @IsString() paymentMethod?: string;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional() @IsNumber() discount?: number;

  @ApiPropertyOptional({ type: [PaymentDto] })
  @IsOptional() 
  @IsArray()
  payments?: { amount: number, method: string, note?: string }[];


  @ApiProperty({ type: [OrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}
