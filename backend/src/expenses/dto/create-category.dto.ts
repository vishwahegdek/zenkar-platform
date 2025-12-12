import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Office Supplies', description: 'Name of the expense category' })
  @IsNotEmpty()
  @IsString()
  name: string;
}
