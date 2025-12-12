import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ example: 'Super Widget', description: 'Name of the product' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 99.99, description: 'Default unit price' })
  @IsOptional()
  @IsNumber()
  defaultUnitPrice?: number;

  @ApiPropertyOptional({ example: 'A widget that does super things', description: 'Notes or description' })
  @IsOptional()
  @IsString()
  notes?: string;
}
