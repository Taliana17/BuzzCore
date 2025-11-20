import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LocationHistory } from './entities/location-history.entity';
import { LocationHistoryService } from './location-history.service';
import { LocationHistoryController } from './location-history.controller';
import { NotificationModule } from '../notification/notification.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([LocationHistory]),
    forwardRef(() => NotificationModule), // ← Importa NotificationModule
    UserModule, // ← Importa UserModule
  ],
  controllers: [LocationHistoryController],
  providers: [LocationHistoryService],
  exports: [LocationHistoryService],
})
export class LocationHistoryModule {}