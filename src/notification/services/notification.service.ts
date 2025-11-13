import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../entities/notification.entity';
import { CreateNotificationDto } from '../dto/create-notification.dto';
import { User } from 'src/user/entities/user.entity';
import { NotificationQueueService } from './notification-queue.service';
import { GooglePlacesService } from './google-places.service';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
    private readonly queueService: NotificationQueueService,
    private readonly googlePlaces: GooglePlacesService,
  ) {}

  async create(dto: CreateNotificationDto, user: User) {
    try {
      // 1. Crear notificación en DB
      const notification = this.notificationRepo.create({
        ...dto,
        user,
        status: 'pending',
      });

      const savedNotification = await this.notificationRepo.save(notification);

      // 2. Enriquecer con datos de Google Places si hay ubicación
      if (dto.location_data?.coordinates) {
        try {
          const placeDetails = await this.googlePlaces.getPlaceDetails(
            dto.recommended_place,
            dto.location_data.coordinates,
          );
          
          savedNotification.metadata = { 
            ...savedNotification.metadata,
            placeDetails 
          };
          await this.notificationRepo.save(savedNotification);
        } catch (error) {
          this.logger.warn(`Error fetching place details: ${error.message}`);
        }
      }

      // 3. Encolar notificación
      await this.queueService.enqueueNotification(savedNotification, user.preferred_channel);

      this.logger.log(`Notification ${savedNotification.id} queued for ${user.preferred_channel}`);
      
      return savedNotification;
    } catch (error) {
      this.logger.error(`Error creating notification: ${error.message}`);
      throw error;
    }
  }

  async findAllByUser(userId: string): Promise<Notification[]> {
    return this.notificationRepo.find({
      where: { user: { id: userId } },
      relations: ['user'],
      order: { sent_at: 'DESC' },
    });
  }

  async updateStatus(notificationId: string, status: 'sent' | 'failed', errorMessage?: string) {
    await this.notificationRepo.update(notificationId, { 
      status,
      ...(errorMessage && { 
        metadata: { errorMessage } 
      })
    });
  }
}