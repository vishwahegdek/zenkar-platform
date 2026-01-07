import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateContactDto {
  @ApiProperty({ example: 'John Doe', description: 'Name of the contact' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: '9988776655', description: 'Phone number' })
  @IsNotEmpty()
  @IsString()
  phone: string;

  @ApiPropertyOptional({ example: 'Family', description: 'Group Name' })
  @IsOptional()
  @IsString()
  group?: string;

  @ApiPropertyOptional({ example: false, description: 'Skip Google Sync' })
  @IsOptional()
  skipGoogleSync?: boolean;
}
