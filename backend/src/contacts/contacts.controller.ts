
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
  findAll(@Request() req, @Query('userId') userId?: string) {
    // If userId query param provided, use it. Else return all (pass undefined).
    // Note: req.user.userId is still available if we wanted to enforce default to "My Contacts" but allow "All".
    // Instruction says "every user can access all contacts", implies default might be All.
    return this.contactsService.findAll(userId ? Number(userId) : undefined);
  }

  @Patch(':id')
  update(@Request() req, @Param('id') id: string, @Body() body: { name?: string; phone?: string; group?: string }) {
    return this.contactsService.update(req.user.userId, +id, body);
  }

  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    return this.contactsService.remove(req.user.userId, +id);
  }
}
