import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { S3Module } from './s3/s3.module';
import { VirtualTryOnModule } from './virtual-tryon/virtual-tryon.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Makes the config available throughout the app
      envFilePath: '.env', // Explicitly specify the .env file path
    }),
    DatabaseModule,
    AuthModule,
    S3Module,
    VirtualTryOnModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
