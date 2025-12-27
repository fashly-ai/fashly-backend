import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ComfyUIController } from './comfyui.controller';
import { ComfyUIService } from './comfyui.service';
import { GlassTryOnHistoryController } from './glass-tryon-history.controller';
import { GlassTryOnHistoryService } from './glass-tryon-history.service';
import { Glasses } from '../database/entities/glasses.entity';
import { GlassTryOnHistory } from '../database/entities/glass-tryon-history.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Glasses, GlassTryOnHistory])],
  controllers: [ComfyUIController, GlassTryOnHistoryController],
  providers: [ComfyUIService, GlassTryOnHistoryService],
  exports: [ComfyUIService, GlassTryOnHistoryService],
})
export class ComfyUIModule {}
