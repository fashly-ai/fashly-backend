import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CrawlingController } from './crawling.controller';
import { CrawlingService } from './crawling.service';
import { Glasses } from '../database/entities/glasses.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Glasses])],
  controllers: [CrawlingController],
  providers: [CrawlingService],
  exports: [CrawlingService],
})
export class CrawlingModule {}
