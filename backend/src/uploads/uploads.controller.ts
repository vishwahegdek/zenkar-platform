import { Controller, Get, Param, Res } from '@nestjs/common';
import { UploadsService } from './uploads.service';
import type { Response } from 'express';
import { Public } from '../auth/public.decorator';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('uploads')
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Get(':filename')
  @Public()
  @ApiOperation({ summary: 'Serve an uploaded photo' })
  serveFile(@Param('filename') filename: string, @Res() res: Response) {
    return this.uploadsService.serveFile(filename, res);
  }
}
