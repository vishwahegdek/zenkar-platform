import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber } from 'class-validator';

export class CreateLabourerDto {
  @ApiProperty({ example: 'John Doe', description: 'Name of the labourer' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 500, description: 'Default daily wage for the labourer' })
  @IsNumber()
  defaultDailyWage: number;
}
