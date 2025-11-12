import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LocationHistory } from './entities/location-history.entity';
import { LocationHistoryService } from './location-history.service';
import { LocationHistoryController } from './location-history.controller';

@Module({
  imports: [TypeOrmModule.forFeature([LocationHistory])],
  controllers: [LocationHistoryController],
  providers: [LocationHistoryService],
})
export class LocationHistoryModule {}
