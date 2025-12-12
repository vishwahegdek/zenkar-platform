import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateContactDto {
  @ApiProperty({ example: 'John Doe', description: 'Name of the contact' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: '9988776655', description: 'Phone number' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'Family', description: 'Group name' })
  @IsOptional()
  @IsString()
  group?: string;
}
