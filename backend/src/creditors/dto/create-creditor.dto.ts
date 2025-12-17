import { IsString, IsOptional, IsInt } from 'class-validator';

export class CreateCreditorDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsInt()
  contactId?: number; // Optional link to existing contact
}
