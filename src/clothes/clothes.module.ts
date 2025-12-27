import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClothesController } from './clothes.controller';
import { ClothesService } from './clothes.service';
import { Clothes } from '../database/entities/clothes.entity';
import { Favorite } from '../database/entities/favorite.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Clothes, Favorite])],
  controllers: [ClothesController],
  providers: [ClothesService],
  exports: [ClothesService],
})
export class ClothesModule {}


