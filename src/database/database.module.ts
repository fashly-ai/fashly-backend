import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from './entities/user.entity';
import { UserImage } from './entities/user-image.entity';
import { Glasses } from './entities/glasses.entity';
import { Clothes } from './entities/clothes.entity';
import { Otp } from './entities/otp.entity';
import { Favorite } from './entities/favorite.entity';
import { TryOn } from './entities/tryon.entity';
import { GlassTryOnHistory } from './entities/glass-tryon-history.entity';
import { FashnHistory } from './entities/fashn-history.entity';
import { FashnJob } from './entities/fashn-job.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get('DB_PORT', 5432),
        username: configService.get('DB_USERNAME', 'postgres'),
        password: configService.get('DB_PASSWORD', 'password'),
        database: configService.get('DB_NAME', 'fashly'),
        entities: [User, UserImage, Glasses, Clothes, Otp, Favorite, TryOn, GlassTryOnHistory, FashnHistory, FashnJob],
        synchronize: false, // Use migrations instead
        migrations: ['dist/database/migrations/*.js'],
        migrationsRun: true, // Auto-run migrations on startup
        logging: configService.get('NODE_ENV') === 'development',
        ssl:
          configService.get('NODE_ENV') === 'production'
            ? { rejectUnauthorized: false }
            : false,
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([User, UserImage, Glasses, Clothes, Otp, Favorite, TryOn, GlassTryOnHistory, FashnHistory, FashnJob]),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
