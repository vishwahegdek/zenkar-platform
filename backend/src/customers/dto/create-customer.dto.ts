import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { MinLength } from 'class-validator';

export class CreateCustomerDto {
  @ApiPropertyOptional({
    example: 'Alice Smith',
    description: 'Name of the customer (Min 6 chars if provided)',
  })
  @IsOptional()
  @IsString()
  @MinLength(4)
  name?: string;

  @ApiPropertyOptional({ example: '9876543210', description: 'Phone number' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: '123 Main St', description: 'Address' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 1, description: 'Linked Contact ID' })
  @IsOptional()
  contactId?: number;

  @ApiPropertyOptional({
    example: false,
    description: 'Skip Google Contact Sync',
  })
  @IsOptional()
  skipGoogleSync?: boolean;
}
