import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../../entities/notification.entity';
import { User } from '../../../user/entities/user.entity';
import type { NotificationMetadata } from '../../types/notification.types';
import type { Coordinates } from '../../types/core.types';

@Injectable()
export class NotificationFactory {
  constructor(
    @InjectRepository(Notification)
    private notificationRepo: Repository<Notification>,
  ) {}

  async createTouristNotification(
    user: User,
    message: string,
    placeName: string,
    channel: 'email' | 'sms',
    metadata: NotificationMetadata
  ): Promise<Notification> {
    const notification = this.notificationRepo.create({
      user,
      message,
      recommended_place: placeName,
      channel,
      status: 'pending',
      metadata,
      sent_at: new Date(),
    });

    // GUARDAR EN BASE DE DATOS
    return await this.notificationRepo.save(notification);
  }

  async createBasicNotification(
    user: User,
    message: string,
    channel: 'email' | 'sms' = 'email'
  ): Promise<Notification> {
    const defaultCoordinates: Coordinates = { lat: 4.710989, lng: -74.072092 };
    
    return await this.createTouristNotification(
      user,
      message,
      'Lugar de prueba',
      channel,
      {
        location: {
          city: 'Ciudad de prueba',
          coordinates: defaultCoordinates
        },
        fallback: true
      }
    );
  }

  async save(notification: Notification): Promise<Notification> {
    return await this.notificationRepo.save(notification);
  }
}