import { Type } from 'class-transformer';
import { IsArray, IsDateString, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

class OrderItemDto {
  @IsOptional() @IsNumber() productId?: number;
  @IsOptional() @IsString() productName?: string;
  @IsOptional() @IsString() description?: string;
  @IsNumber() quantity: number;
  @IsNumber() unitPrice: number;
  @IsNumber() lineTotal: number;
}

export class CreateOrderDto {
  @IsOptional() @IsString() orderNo?: string;
  @IsNumber() customerId: number;
    
  // Fields for creating a new customer (if customerId is 0 or null)
  @IsOptional() @IsString() customerName?: string;
  @IsOptional() @IsString() customerPhone?: string;
  @IsOptional() @IsString() customerAddress?: string;
  @IsDateString() orderDate?: string; // ISO Date
  @IsOptional() @IsDateString() dueDate?: string;
  @IsOptional() @IsString() status?: string;
  @IsNumber() totalAmount: number;
  @IsNumber() advanceAmount: number;
  @IsOptional() @IsString() notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}
