import { IsDateString, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSettlementDto {
  @ApiProperty({ example: '2025-12-01', description: 'The zero date' })
  @IsDateString()
  settlementDate: string;

  @ApiProperty({ required: false, example: 'Paid in full via cash' })
  @IsOptional()
  @IsString()
  note?: string;
}
