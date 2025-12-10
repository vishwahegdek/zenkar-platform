
import { Controller, Get, Post, Body } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findAll() {
      return this.usersService.findAll();
  }

  @Post()
  async create(@Body() createUserDto: any) {
    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(createUserDto.password, salt);
    
    return this.usersService.create({
        username: createUserDto.username,
        password: passwordHash
    });
  }
}
