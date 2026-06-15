import { Controller, Get, Post, Body, Patch, Request, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { Public } from '../auth/public.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findAll() {
    return this.usersService.findAll();
  }

  @Public()
  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(createUserDto.password, salt);
    const user = await this.usersService.create({
      ...createUserDto,
      password: hashedPassword,
    });
    const { password, ...result } = user;
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/settings')
  async getSettings(@Request() req) {
    return this.usersService.getSettings(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me/settings')
  async updateSettings(@Request() req, @Body() preferences: any) {
    return this.usersService.updateSettings(req.user.userId, preferences);
  }
}
