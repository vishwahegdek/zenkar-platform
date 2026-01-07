import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class LabourUpdateItem {
  @ApiProperty({ example: 1, description: 'ID of the labourer' })
  labourerId: number;

  // Add other properties as needed based on logic, likely presence or wage override
  @ApiProperty({
    example: true,
    description: 'Whether the labourer was present',
  })
  isPresent: boolean;

  @ApiProperty({ example: 500, description: 'Wage for the day' })
  wage: number;
}

export class UpdateDailyViewDto {
  @ApiProperty({ example: '2023-10-25', description: 'Date to update' })
  @IsDateString()
  date: string;

  @ApiProperty({
    type: [LabourUpdateItem],
    description: 'List of updates for labourers',
  })
  @IsArray()
  // @ValidateNested({ each: true }) // Requires Type
  // @Type(() => LabourUpdateItem)
  updates: any[]; // Kept as any[] to match controller initially, but should verify structure
}
