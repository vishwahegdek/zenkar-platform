import { IsString, IsNumber, IsEnum, IsOptional, IsDateString } from 'class-validator';

export enum TransactionType {
  DEBT_INC = 'DEBT_INC', // Borrowed more / Purchased on credit
  DEBT_DEC = 'DEBT_DEC', // Paid back
}

export class CreateTransactionDto {
  @IsNumber()
  amount: number;

  @IsEnum(TransactionType)
  type: TransactionType;

  @IsDateString()
  date: string;

  @IsOptional()
  @IsString()
  note?: string;
}
