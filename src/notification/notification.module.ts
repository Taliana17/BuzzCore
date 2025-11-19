import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Notification } from './entities/notification.entity';
import { NotificationController } from './notification.controller';
import { NotificationService } from './services/core/notification.service';
import { NotificationQueueService } from './services/core/notification-queue.service';
import { NotificationValidator } from './services/core/notification-validator.service';
import { NotificationFactory } from './services/core/notification-factory.service';
import { NotificationStatisticsService } from './services/core/notification-statistics.service';
import { EmailNotificationProcessor } from './services/processors/email-notification.processor';
import { SmsNotificationProcessor } from './services/processors/sms-notification.processor';
import { EmailProvider } from './services/providers/email.provider';
import { SmsProvider } from './services/providers/sms.provider';
import { EmailTemplateService } from './services/templates/email-template.service';
import { SmsTemplateService } from './services/templates/sms-template.service';
import { CityDetectionService } from './services/external/city-detection.service';
import { TouristPlacesService } from './services/external/tourist-places.service';
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
    // Servicios Core
    NotificationService,
    NotificationQueueService,
    NotificationValidator,
    NotificationFactory,
    NotificationStatisticsService,
    
    // Procesadores
    EmailNotificationProcessor,
    SmsNotificationProcessor,
    
    // Proveedores
    EmailProvider,
    SmsProvider,
    
    // Servicios de Templates
    EmailTemplateService,
    SmsTemplateService,
    
    // Servicios Externos
    CityDetectionService,
    TouristPlacesService,
    
    // Workers BullMQ (para compatibilidad)
    EmailProcessor,
    SmsProcessor,
    
    // Inyección de dependencias para interfaces
    {
      provide: 'PlaceFinder',
      useExisting: TouristPlacesService,
    },
    {
      provide: 'LocationDetector', 
      useExisting: CityDetectionService,
    },
  ],
  exports: [NotificationService],
})
export class NotificationModule {}