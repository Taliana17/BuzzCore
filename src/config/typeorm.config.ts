// src/config/typeorm.config.ts
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from '../users/entities/user.entity';
import { Notification } from '../notifications/entities/notification.entity';
import { NotificationLog } from '../notification-log/entities/notification-log.entity';
import { Channel } from '../channel/entities/channel.entity';

export const typeOrmConfig = async (configService: ConfigService): Promise<TypeOrmModuleOptions> => ({
  type: 'postgres',
  host: configService.get('DB_HOST'),
  port: Number(configService.get('DB_PORT') ?? 5432),
  username: configService.get('DB_USERNAME'),
  password: configService.get('DB_PASSWORD'),
  database: configService.get('DB_NAME'),
  entities: [User, Notification, NotificationLog, Channel],
  synchronize: true, // para desarrollo; en producción usar migraciones
  logging: true,
});
