import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';
import { NotificationService } from './services/notification.service';
import { TouristPlacesService } from './services/tourist-places.service';
import { EmailProvider } from './services/providers/email.provider';
import { SmsProvider } from './services/providers/sms.provider';
import { GooglePlacesService } from './services/google-places.service';
import { GeocodingService } from './services/google-geocoding.service';

@Module({
  imports: [TypeOrmModule.forFeature([Notification])],
  providers: [
    NotificationService,
    TouristPlacesService,
    GooglePlacesService,
    GeocodingService,
    EmailProvider,
    SmsProvider
  ],
  exports: [NotificationService, GeocodingService]
})
export class NotificationModule {}
