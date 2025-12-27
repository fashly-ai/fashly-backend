import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { ProfileController } from './profile.controller';
import { UserImagesController } from './user-images.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { User } from '../database/entities/user.entity';
import { Otp } from '../database/entities/otp.entity';
import { UserImage } from '../database/entities/user-image.entity';
import { OtpService } from './services/otp.service';
import { EmailService } from './services/email.service';
import { ProfileService } from './services/profile.service';
import { UserImageService } from './services/user-image.service';
import { S3Module } from '../s3/s3.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Otp, UserImage]),
    forwardRef(() => S3Module),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET', 'default-secret-key'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRATION', '24h'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController, ProfileController, UserImagesController],
  providers: [
    AuthService,
    ProfileService,
    UserImageService,
    OtpService,
    EmailService,
    JwtStrategy,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
  exports: [AuthService, JwtModule, UserImageService],
})
export class AuthModule {}
