import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateProductDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsNumber()
  defaultUnitPrice?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
