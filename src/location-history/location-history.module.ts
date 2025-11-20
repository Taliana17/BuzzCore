import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LocationHistory } from './entities/location-history.entity';
import { LocationHistoryService } from './location-history.service';
import { LocationHistoryController } from './location-history.controller';
import { UserModule } from '../user/user.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([LocationHistory]),
    UserModule,
    NotificationModule   // ← IMPORTANTE
  ],
  controllers: [LocationHistoryController],
  providers: [LocationHistoryService],
  exports: [LocationHistoryService]
})
export class LocationHistoryModule {}
