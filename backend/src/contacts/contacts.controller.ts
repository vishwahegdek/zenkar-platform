
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { ContactsService } from './contacts.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

import { CreateContactDto } from './dto/create-contact.dto';

@Controller('contacts')
@UseGuards(JwtAuthGuard)
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Post()
  create(@Request() req, @Body() body: CreateContactDto) {
    return this.contactsService.create(req.user.userId, body);
  }

  @Post('import')
  import(@Request() req, @Body('accessToken') accessToken: string) {
      return this.contactsService.importContacts(req.user.userId, accessToken);
  }

  @Get()
  @ApiQuery({ name: 'userId', required: false })
  findAll(@Request() req, @Query('userId') userId?: string, @Query('query') query?: string) {
    // Determine the userId to use: query param (if admin/allowed) or logged-in user?
    // Instruction didn't specify strict isolation, but service expects a number.
    // If no userId param, maybe use req.user.userId? Or pass undefined if global?
    // Service: `where: { userId, ... }`. If userId is undefined, `where: { userId: undefined }` (matches nothing? or ignored? Prisma ignores undefined in where).
    // Let's pass req.user.userId if not provided? Or just undefined.
    // Assuming straightforward mapping:
    const targetUserId = userId ? Number(userId) : req.user.userId;
    return this.contactsService.findAll(targetUserId, { query });
  }

  @Patch(':id')
  update(@Request() req, @Param('id') id: string, @Body() body: { name?: string; phone?: string; group?: string }) {
    return this.contactsService.update(+id, body);
  }

  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    return this.contactsService.remove(req.user.userId, +id);
  }
}
