import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VirtualTryOnService } from './virtual-tryon.service';
import { VirtualTryOnController } from './virtual-tryon.controller';
import { TryOn } from '../database/entities/tryon.entity';
import { Glasses } from '../database/entities/glasses.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TryOn, Glasses])],
  controllers: [VirtualTryOnController],
  providers: [VirtualTryOnService],
  exports: [VirtualTryOnService],
})
export class VirtualTryOnModule {}
