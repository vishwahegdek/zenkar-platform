
import { Controller, Request, Post, UseGuards, Body, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from './public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('login')
  async login(@Body() loginDto: any) {
    // Manually validating for now to keep it simple, or we could use LocalStrategy
    // But since the plan didn't explicitly mention LocalStrategy, I'll use AuthService.validateUser directly here 
    // or standard pattern is Guard -> Request -> Login.
    
    // Let's do a direct call to keep it simple and explicit
    const user = await this.authService.validateUser(loginDto.username, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.authService.login(user);
  }
}
