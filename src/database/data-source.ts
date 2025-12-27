import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
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

config(); // Load environment variables

const configService = new ConfigService();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: configService.get('DB_HOST', 'localhost'),
  port: configService.get('DB_PORT', 5432),
  username: configService.get('DB_USERNAME', 'postgres'),
  password: configService.get('DB_PASSWORD', 'postgres'),
  database: configService.get('DB_NAME', 'fashly'),
  entities: [User, UserImage, Glasses, Clothes, Otp, Favorite, TryOn, GlassTryOnHistory, FashnHistory, FashnJob],
  migrations: ['src/database/migrations/*.ts'],
  migrationsTableName: 'migrations',
  synchronize: false, // Always use migrations in production
  logging: configService.get('NODE_ENV') === 'development',
});
