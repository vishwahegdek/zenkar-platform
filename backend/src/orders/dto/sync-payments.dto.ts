import { IsArray, IsNumber, IsOptional, IsString, IsDateString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class PaymentItemDto {
  @IsOptional()
  @IsNumber()
  id?: number;

  @IsNumber()
  amount: number;

  @IsDateString()
  date: string;

  @IsOptional()
  @IsString()
  note?: string;
}

export class SyncPaymentsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PaymentItemDto)
  payments: PaymentItemDto[];
}
