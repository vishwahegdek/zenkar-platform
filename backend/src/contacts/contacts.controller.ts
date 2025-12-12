
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
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
  findAll(@Request() req) {
    return this.contactsService.findAll(req.user.userId);
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
