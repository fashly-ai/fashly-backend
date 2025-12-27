import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { FashnController } from './fashn.controller';
import { FashnService } from './fashn.service';
import { FashnHistory } from '../database/entities/fashn-history.entity';
import { FashnJob } from '../database/entities/fashn-job.entity';
import { FashnJobsGateway } from './fashn-jobs.gateway';
import { S3Module } from '../s3/s3.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([FashnHistory, FashnJob]),
    S3Module,
    forwardRef(() => AuthModule),
  ],
  controllers: [FashnController],
  providers: [FashnService, FashnJobsGateway],
  exports: [FashnService, FashnJobsGateway],
})
export class FashnModule {}

