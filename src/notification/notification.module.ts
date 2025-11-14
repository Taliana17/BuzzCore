import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Notification } from './entities/notification.entity';
import { NotificationController } from './notification.controller';
import { NotificationService } from './services/notification.service';
import { NotificationQueueService } from './services/notification-queue.service';
import { TouristPlacesService } from './services/tourist-places.service'; 
import { EmailProvider } from './services/providers/email.provider';
import { SmsProvider } from './services/providers/sms.provider';
import { EmailProcessor } from './processors/email.processor';
import { SmsProcessor } from './processors/sms.processor';
import { UserModule } from '../user/user.module';
import { LocationHistoryModule } from '../location-history/location-history.module';

@Module({
  imports: [
    UserModule,
    LocationHistoryModule, 
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
      { name: 'sms-queue' }
    ),
  ],
  controllers: [NotificationController],
  providers: [
    NotificationService,
    NotificationQueueService,
    TouristPlacesService, 
    EmailProvider,
    SmsProvider,
    EmailProcessor,
    SmsProcessor,
  ],
  exports: [NotificationService],
})
export class NotificationModule {}