import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsArray } from 'class-validator';

export class CreateContactDto {
  @ApiProperty({ example: 'John Doe', description: 'Name of the contact' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: [{ value: '+919988776655', type: 'mobile' }], description: 'Phone numbers' })
  @IsOptional()
  @IsArray()
  phones?: (string | { value: string, type?: string })[];

  // Deprecated: Backwards compatibility only, mapped to phones[0] if phones empty
  @ApiPropertyOptional({ example: '9988776655', description: 'Legacy Phone number' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'Family', description: 'Group Name' })
  @IsOptional()
  @IsString()
  group?: string;

  @ApiPropertyOptional({ example: false, description: 'Skip Google Sync' })
  @IsOptional()
  skipGoogleSync?: boolean;
}
