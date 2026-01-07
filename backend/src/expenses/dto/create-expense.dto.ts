import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, IsDateString } from 'class-validator';

export class CreateExpenseDto {
  @ApiProperty({ example: 500, description: 'Amount of the expense' })
  @IsNumber()
  amount: number;

  @ApiProperty({ example: 1, description: 'ID of the expense category' })
  @IsNumber()
  categoryId: number;

  @ApiPropertyOptional({
    example: 'Office supplies',
    description: 'Description of the expense',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: 'Staples',
    description: 'Name of the recipient/payee',
  })
  @IsOptional()
  @IsString()
  recipientName?: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'ID of the contact associated with this expense',
  })
  @IsOptional()
  @IsNumber()
  contactId?: number;

  @ApiPropertyOptional({
    example: 1,
    description: 'ID of the recipient associated with this expense',
  })
  @IsOptional()
  @IsNumber()
  recipientId?: number;

  @ApiPropertyOptional({
    example: '2023-10-25T10:00:00Z',
    description: 'Date of the expense (ISO String)',
  })
  @IsOptional()
  @IsDateString()
  date?: string;
}
