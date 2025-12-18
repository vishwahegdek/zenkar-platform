import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsEnum } from 'class-validator';

export class CreateFinancePartyDto {
  @ApiPropertyOptional({ example: 'John Doe' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: '9988776655' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  contactId?: number;

  @ApiPropertyOptional({ example: 'Local vendor' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ example: 'CREDITOR', enum: ['CREDITOR', 'DEBTOR'] })
  @IsOptional()
  @IsEnum(['CREDITOR', 'DEBTOR'])
  type: string = 'CREDITOR'; // Default mostly for UI grouping hint
}
