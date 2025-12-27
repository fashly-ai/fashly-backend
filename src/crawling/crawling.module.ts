import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CrawlingController } from './crawling.controller';
import { CrawlingService } from './crawling.service';
import { Glasses } from '../database/entities/glasses.entity';
import { Clothes } from '../database/entities/clothes.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Glasses, Clothes])],
  controllers: [CrawlingController],
  providers: [CrawlingService],
  exports: [CrawlingService],
})
export class CrawlingModule {}
