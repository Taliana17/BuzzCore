import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmConfig } from './config/typeorm.config';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ChannelModule } from './channel/channel.module';
import { NotificationLogModule } from './notification-log/notification-log.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: typeOrmConfig,
      inject: [ConfigService],
    }),
    UsersModule,
    AuthModule,
    NotificationsModule,
    ChannelModule,
    NotificationLogModule,
  ],
})
export class AppModule {}
