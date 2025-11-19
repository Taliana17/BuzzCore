import { Injectable, Logger, BadRequestException, NotFoundException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../../entities/notification.entity';
import { User } from '../../../user/entities/user.entity';
import { ReceiveLocationDto } from '../../dto/receive-location.dto';
import { NotificationQueueService } from './notification-queue.service';
import { NotificationValidator } from './notification-validator.service';
import { NotificationFactory } from './notification-factory.service';
import type { LocationDetector, PlaceFinder, RecommendedPlace } from '../../interfaces/location-detector.interface';
import { 
  NotificationCreateData, 
  TravelTime, 
  EmailResult,
  TestPlacesResponse,
  NotificationJobData 
} from './../../types';
import { Coordinates } from '../../types/core.types';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectRepository(Notification)
    private notificationRepo: Repository<Notification>,
    @Inject('PlaceFinder') private placeFinder: PlaceFinder,
    @Inject('LocationDetector') private locationDetector: LocationDetector,
    private notificationQueueService: NotificationQueueService,
    private notificationValidator: NotificationValidator,
    private notificationFactory: NotificationFactory,
  ) {}

  async processLocationAndNotify(
    dto: ReceiveLocationDto & { userId?: string }, 
    userService: any,
    locationHistoryService: any
  ) {
    this.logger.log(`📍 Procesando ubicación - Lat: ${dto.lat}, Lng: ${dto.lng}, Ciudad: ${dto.city}`);

    this.notificationValidator.validateLocationData(dto);
    
    if (!dto.userId) {
      throw new BadRequestException('userId es requerido para requests no autenticados');
    }

    const user = await userService.findOne(dto.userId);
    if (!user) {
      throw new NotFoundException(`Usuario con ID ${dto.userId} no encontrado`);
    }

    const location: Coordinates = { lat: dto.lat, lng: dto.lng };
    
    const city = await this.detectOrUseProvidedCity(dto);
    
    const recommendedPlace: RecommendedPlace = await this.placeFinder.findRecommendedPlace(location);

    // USAR AWAIT - ESTA ES LA LÍNEA CLAVE
    const notification = await this.createTouristNotification(
      user, 
      city, 
      location,
      recommendedPlace,
      !!dto.city
    );

    await this.notificationQueueService.enqueueNotification(
      notification, 
      user.preferred_channel as 'email' | 'sms'
    );

    let locationHistory = null;
    try {
      locationHistory = await locationHistoryService.create(
        { city, coordinates: location },
        user
      );
    } catch (error) {
      this.logger.warn(`No se pudo guardar en location history: ${error.message}`);
    }

    this.logger.log(`Notificación ${notification.id} encolada para envío por ${user.preferred_channel}`);

    return this.buildSuccessResponse(user, city, location, recommendedPlace, notification, locationHistory, !!dto.city);
  }

  private async detectOrUseProvidedCity(dto: ReceiveLocationDto & { userId?: string }): Promise<string> {
    if (dto.city) {
      return dto.city;
    }
    
    this.logger.log('🔍 Ciudad no proporcionada, detectando automáticamente...');
    const detection = await this.locationDetector.detectCity({
      lat: dto.lat,
      lng: dto.lng
    });
    
    this.logger.log(`✅ Ciudad detectada: ${detection.city}`);
    return detection.city;
  }

  private async createTouristNotification(
    user: User, 
    city: string, 
    coordinates: Coordinates,
    recommendedPlace: RecommendedPlace,
    cityProvided: boolean
  ): Promise<Notification> {
    // AQUÍ ESTÁ EL AWAIT CLAVE
    return await this.notificationFactory.createTouristNotification(
      user,
      `Recomendación turística para ${city}`,
      recommendedPlace.place.name,
      user.preferred_channel as 'email' | 'sms',
      {
        placeDetails: recommendedPlace.details,
        travelTime: recommendedPlace.travelTime,
        location: {
          city,
          coordinates,
          cityDetected: !cityProvided
        }
      }
    );
  }

  private buildSuccessResponse(
    user: User, 
    city: string, 
    coordinates: Coordinates,
    recommendedPlace: RecommendedPlace, 
    notification: Notification,
    locationHistory: any,
    cityProvided: boolean
  ) {
    return {
      success: true,
      message: 'Ubicación recibida y notificación encolada exitosamente',
      data: {
        user: {
          id: user.id,
          name: user.name,
          channel: user.preferred_channel
        },
        location: {
          city,
          coordinates: coordinates,
          detected: !cityProvided
        },
        recommended_place: {
          name: recommendedPlace.place.name,
          rating: recommendedPlace.place.rating,
          travel_time: recommendedPlace.travelTime
        },
        notification: {
          id: notification.id, // ✅ AHORA TENDRÁ ID
          status: notification.status,
          channel: notification.channel
        },
        location_history: locationHistory ? {
          id: locationHistory.id,
          arrival_date: locationHistory.arrival_date
        } : null
      }
    };
  }

  async findAllByUser(userId: string): Promise<Notification[]> {
    return await this.notificationRepo.find({
      where: { user: { id: userId } },
      relations: ['user'],
      order: { sent_at: 'DESC' }
    });
  }

  async findOne(id: string): Promise<Notification> {
    const notification = await this.notificationRepo.findOne({
      where: { id },
      relations: ['user']
    });
    
    if (!notification) {
      throw new Error('Notification not found');
    }
    
    return notification;
  }

  async updateStatus(id: string, status: 'sent' | 'failed' | 'pending'): Promise<Notification> {
    await this.notificationRepo.update(id, { status });
    return await this.findOne(id);
  }

  async markAsFailed(id: string, errorMessage: string): Promise<void> {
    const notification = await this.findOne(id);
    await this.notificationRepo.update(id, { 
      status: 'failed',
      metadata: {
        ...(notification.metadata || {}),
        errorMessage
      }
    });
  }
}