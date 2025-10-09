import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GlassesController } from './glasses.controller';
import { GlassesService } from './glasses.service';
import { Glasses } from '../database/entities/glasses.entity';
import { Favorite } from '../database/entities/favorite.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Glasses, Favorite])],
  controllers: [GlassesController],
  providers: [GlassesService],
  exports: [GlassesService],
})
export class GlassesModule {}
