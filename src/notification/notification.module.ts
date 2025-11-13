import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Notification } from './entities/notification.entity';
import { NotificationController } from './notification.controller';
import { NotificationService } from './services/notification.service';
import { NotificationQueueService } from './services/notification-queue.service';
import { GooglePlacesService } from './services/google-places.service';
import { EmailProvider } from './services/providers/email.provider';
import { SmsProvider } from './services/providers/sms.provider';
import { EmailProcessor } from './processors/email.processor';
import { SmsProcessor } from './processors/sms.processor';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification]),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get('REDIS_HOST') || 'localhost',
          port: configService.get('REDIS_PORT') || 6379,
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue(
      { name: 'email-queue' },
      { name: 'sms-queue' },
      { name: 'location-queue' }
    ),
  ],
  controllers: [NotificationController],
  providers: [
    NotificationService,
    NotificationQueueService,
    GooglePlacesService,
    EmailProvider,
    SmsProvider,
    EmailProcessor,
    SmsProcessor,
  ],
  exports: [NotificationService],
})
export class NotificationModule {}