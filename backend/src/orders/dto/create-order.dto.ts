import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
  ArrayMinSize,
  IsBoolean,
} from 'class-validator';

class OrderItemDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  productId: number;

  @ApiPropertyOptional({ example: 'Product Name' })
  @IsOptional()
  @IsString()
  productName?: string;

  @ApiPropertyOptional({ example: 'Description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 2 })
  @IsOptional()
  @IsNumber()
  quantity: number = 0;

  @ApiProperty({ example: 50 })
  @IsOptional()
  @IsNumber()
  unitPrice: number = 0;

  @ApiProperty({ example: 100 })
  @IsOptional()
  @IsNumber()
  lineTotal: number = 0;
}

class PaymentDto {
  @ApiProperty({ example: 100 })
  @IsNumber()
  amount: number;

  @ApiProperty({ example: 'CASH' })
  @IsNotEmpty()
  @IsString()
  method: string;

  @ApiPropertyOptional({ example: 'Initial deposit' })
  @IsOptional()
  @IsString()
  note?: string;
}

export class CreateOrderDto {
  @ApiPropertyOptional({ example: 'ORD-123' })
  @IsOptional()
  @IsString()
  orderNo?: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'Customer ID (Either this or contactId required)',
  })
  @IsOptional()
  @IsNumber()
  customerId?: number;

  @ApiPropertyOptional({
    example: 'John Doe',
    description: 'Name for implicit creation',
  })
  @IsOptional()
  @IsString()
  customerName?: string;

  @ApiPropertyOptional({
    example: '9876543210',
    description: 'Phone for implicit creation',
  })
  @IsOptional()
  @IsString()
  customerPhone?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  contactId?: number;

  @ApiProperty({ example: '2023-10-25T10:00:00Z' })
  @IsOptional()
  @IsDateString()
  orderDate?: string;

  // Due date is null if not sent
  @ApiPropertyOptional({ example: '2023-11-25T10:00:00Z' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ example: 'enquired', default: 'enquired' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ example: 1000 })
  @IsOptional()
  @IsNumber()
  totalAmount?: number;

  @ApiPropertyOptional({ example: 'Urgent order' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: false, description: 'Is Quick Sale Order' })
  @IsOptional()
  @IsBoolean()
  isQuickSale?: boolean;

  @ApiPropertyOptional({
    example: false,
    description: 'Skip Google Contact Sync',
  })
  @IsOptional()
  @IsBoolean()
  skipGoogleSync?: boolean;

  @ApiPropertyOptional({
    example: 'CASH',
    description: 'Optional payment method',
  })
  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  discount?: number;

  @ApiPropertyOptional({
    example: 0,
    description: 'Legacy field for initial payment',
  })
  @IsOptional()
  @IsNumber()
  advanceAmount?: number;

  @ApiPropertyOptional({ type: [PaymentDto] })
  @IsOptional()
  @IsArray()
  payments?: PaymentDto[];

  @ApiProperty({ type: [OrderItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}
