
import { Controller, Request, Post, UseGuards, Body, UnauthorizedException, Get, Query, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
// import { AuthGuard } from '@nestjs/passport'; // Removed generic
import { CustomersService } from '../customers/customers.service';
import { ContactsService } from '../contacts/contacts.service';
import { AuthService } from './auth.service';
import { Public } from './public.decorator';
import { GoogleAuthGuard } from './google.guard'; // Import custom guard
import { AuthGuard } from '@nestjs/passport';

import { LoginDto } from './dto/login.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private contactsService: ContactsService
  ) {}

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Login with username/password (Basic)' })
  @ApiResponse({ status: 200, description: 'JWT access token' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto) {
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

  @Public()
  @UseGuards(GoogleAuthGuard) // Use custom guard
  @Get('google')
  @ApiOperation({ summary: 'Initiate Google OAuth flow' })
  @ApiQuery({ name: 'userId', required: false, description: 'Optional User ID to bind to' })
  async googleAuth(@Request() req, @Query('userId') userId: string) {
    // Initiates the Google OAuth flow
  }

  @Public()
  @UseGuards(AuthGuard('google')) // Callback still uses standard guard to verify token? Or custom?
  // Actually, standard guard verifies the code and gets the profile. 
  // State is passed back in query. We need to read it.
  @Get('google/callback')
  @ApiOperation({ summary: 'Google OAuth Callback URL' })
  async googleAuthRedirect(@Request() req, @Res() res, @Query('state') state: string) {
    // req.user contains the user info and accessToken from strategy
    
    let userId = 1; // Default fallback (Admin)
    
    if (state) {
      try {
        const decoded = JSON.parse(state);
        if (decoded.userId) {
          userId = Number(decoded.userId);
        }
      } catch (e) {
        console.error('Failed to parse OAuth state:', e);
      }
    }
    
    console.log(`Importing contacts for User ID: ${userId}`);
    
    const result = await this.contactsService.importContacts(userId, req.user.accessToken);
    
    res.send(`
      <div style="font-family: sans-serif; text-align: center; padding: 50px;">
        <h1>Import Successful!</h1>
        <p>Imported ${result.imported} new contacts (Found ${result.totalFound}).</p>
        <p>No duplicates were added.</p>
        <script>
          setTimeout(() => window.close(), 2000);
        </script>
      </div>
    `);
  }
}
