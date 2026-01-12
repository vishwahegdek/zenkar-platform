import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, IsBoolean } from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ example: 'Super Widget', description: 'Name of the product' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 99.99, description: 'Default unit price' })
  @IsNumber()
  defaultUnitPrice: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ example: 1, description: 'Category ID' })
  @IsNotEmpty()
  categoryId: number;

  @ApiPropertyOptional({ example: true, description: 'Track inventory for this product' })
  @IsBoolean()
  @IsOptional()
  isPurchasable?: boolean;
}
