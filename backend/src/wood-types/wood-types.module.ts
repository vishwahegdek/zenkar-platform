import { Module } from '@nestjs/common';
import { WoodTypesService } from './wood-types.service';
import { WoodTypesController } from './wood-types.controller';

@Module({
  controllers: [WoodTypesController],
  providers: [WoodTypesService],
})
export class WoodTypesModule {}
