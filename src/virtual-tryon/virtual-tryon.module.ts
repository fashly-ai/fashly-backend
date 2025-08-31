import { Module } from '@nestjs/common';
import { VirtualTryOnService } from './virtual-tryon.service';
import { VirtualTryOnController } from './virtual-tryon.controller';

@Module({
  controllers: [VirtualTryOnController],
  providers: [VirtualTryOnService],
  exports: [VirtualTryOnService],
})
export class VirtualTryOnModule {}
