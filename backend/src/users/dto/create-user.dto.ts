import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'admin', description: 'Username for login' })
  @IsNotEmpty()
  @IsString()
  username: string;

  @ApiProperty({
    example: 'password123',
    description: 'Password (min 6 chars)',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;
}
