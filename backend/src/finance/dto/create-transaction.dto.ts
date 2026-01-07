import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsDateString,
  IsEnum,
} from 'class-validator';

export enum TransactionType {
  BORROWED = 'BORROWED', // We owe more
  REPAID = 'REPAID', // We owe less
  LENT = 'LENT', // They owe us more
  COLLECTED = 'COLLECTED', // They owe us less
}

export class CreateFinanceTransactionDto {
  @ApiProperty({ example: 1000 })
  @IsNumber()
  amount: number;

  @ApiProperty({ example: 'BORROWED', enum: TransactionType })
  @IsEnum(TransactionType)
  type: TransactionType;

  @ApiProperty({ example: '2023-12-18' })
  @IsDateString()
  date: string;

  @ApiPropertyOptional({ example: 'Bank Loan' })
  @IsOptional()
  @IsString()
  note?: string;
}
