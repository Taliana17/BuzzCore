import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../entities/notification.entity';
import { User } from '../../user/entities/user.entity';
import { TouristPlacesService } from './tourist-places.service';
import { EmailProvider } from './providers/email.provider';
import { SmsProvider } from './providers/sms.provider';
import { NotificationMetadata, EmailResult, SmsResult } from '../types/notification.types';
import { ReceiveLocationDto } from '../dto/receive-location.dto';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectRepository(Notification)
    private notificationRepo: Repository<Notification>,
    private readonly touristPlacesService: TouristPlacesService,
    private readonly emailProvider: EmailProvider,
    private readonly smsProvider: SmsProvider,
  ) {}

  async create(data: {
    user: User;
    message: string;
    recommended_place: string;
    channel: 'email' | 'sms';
    status: 'sent' | 'failed' | 'pending';
    metadata?: NotificationMetadata;
  }): Promise<Notification> {
    const notification = this.notificationRepo.create(data);
    return await this.notificationRepo.save(notification);
  }

  async processLocationAndNotify(
    dto: ReceiveLocationDto,
    userService: any,
    locationHistoryService: any
  ) {
    this.logger.log(`Procesando ubicación - Lat: ${dto.lat}, Lng: ${dto.lng}, Ciudad: ${dto.city}`);
    
    if (!dto.userId) {
      throw new BadRequestException('userId es requerido para requests no autenticados');
    }

    // Validar coordenadas
    this.validateCoordinates({ lat: dto.lat, lng: dto.lng });
    
    // Buscar usuario
    const user = await userService.findOne(dto.userId);
    if (!user) {
      throw new NotFoundException(`Usuario con ID ${dto.userId} no encontrado`);
    }

    const location = { lat: dto.lat, lng: dto.lng };
    const city = dto.city || 'Ubicación actual';

    // Obtener lugar recomendado
    const recommendedPlace = await this.touristPlacesService.getRecommendedTouristPlace(location);

    // Enviar notificación
    let notificationResult;
    const userChannel = user.preferred_channel || 'email';

    if (userChannel === 'email' && user.email) {
      notificationResult = await this.emailProvider.sendTouristNotification(
        user.email,
        user.name,
        city,
        recommendedPlace.place.name,
        recommendedPlace.details,
        recommendedPlace.travelTime
      );
    } else if (userChannel === 'sms' && user.phone) {
      notificationResult = await this.smsProvider.sendTouristNotification(
        user.phone,
        user.name,
        city,
        recommendedPlace.place.name,
        recommendedPlace.travelTime
      );
    }

    // Guardar en historial de ubicaciones
    let locationHistory;
    try {
      locationHistory = await locationHistoryService.create(
        {
          city: city,
          coordinates: location
        },
        user
      );
    } catch (error) {
      this.logger.warn(`No se pudo guardar en location history: ${error.message}`);
    }

    // Crear notificación en BD
    const notification = await this.create({
      user: user,
      message: `Recomendación turística para ${city}`,
      recommended_place: recommendedPlace.place.name,
      channel: userChannel as 'email' | 'sms',
      status: notificationResult?.success ? 'sent' : 'failed',
      metadata: {
        placeDetails: recommendedPlace.details,
        travelTime: recommendedPlace.travelTime,
        location: {
          city: city,
          coordinates: location
        }
      }
    });

    this.logger.log(`Notificación creada: ${notification.id}`);

    return {
      success: true,
      message: 'Ubicación recibida y notificación enviada exitosamente',
      data: {
        user: {
          id: user.id,
          name: user.name,
          channel: userChannel
        },
        location: {
          city: city,
          coordinates: location
        },
        recommended_place: {
          name: recommendedPlace.place.name,
          rating: recommendedPlace.place.rating,
          travel_time: recommendedPlace.travelTime
        },
        notification: {
          id: notification.id,
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

  private validateCoordinates(coordinates: { lat: number; lng: number }) {
    if (coordinates.lat < -90 || coordinates.lat > 90 || coordinates.lng < -180 || coordinates.lng > 180) {
      throw new BadRequestException('Coordenadas geográficas inválidas');
    }
  }

  async createTouristNotification(user: User, city: string, coordinates: { lat: number; lng: number }) {
    try {
      this.logger.log(`Creando notificación turística para usuario: ${user.name} en ${city}`);
      const recommendedPlace = await this.touristPlacesService.getRecommendedTouristPlace(coordinates);
      
      let notificationResult;
      const userChannel = user.preferred_channel || 'email';
      if (userChannel === 'email' && user.email) {
        notificationResult = await this.emailProvider.sendTouristNotification(
          user.email,
          user.name,
          city,
          recommendedPlace.place.name,
          recommendedPlace.details,
          recommendedPlace.travelTime
        );
      } else if (userChannel === 'sms' && user.phone) {
        notificationResult = await this.smsProvider.sendTouristNotification(
          user.phone,
          user.name,
          city,
          recommendedPlace.place.name,
          recommendedPlace.travelTime
        );
      }

      const status: 'sent' | 'failed' = notificationResult?.success ? 'sent' : 'failed';
      const notification = await this.create({
        user: user,
        message: `Recomendación turística para ${city}`,
        recommended_place: recommendedPlace.place.name,
        channel: userChannel,
        status: status,
        metadata: {
          placeDetails: recommendedPlace.details,
          travelTime: recommendedPlace.travelTime,
          location: {
            city: city,
            coordinates: coordinates
          }
        }
      });

      this.logger.log(`Notificación turística creada: ${notification.id}`);
      
      return {
        notification,
        recommended_place: recommendedPlace,
        delivery_status: notificationResult
      };

    } catch (error) {
      this.logger.error(`Error creando notificación turística: ${error.message}`);
      throw error;
    }
  }

  async findAllByUser(userId: string): Promise<Notification[]> {
    return await this.notificationRepo.find({
      where: { user: { id: userId } },
      relations: ['user'],
      order: { sent_at: 'DESC' }
    });
  }

  async getNotificationStats(userId: string) {
    const notifications = await this.findAllByUser(userId);
    
    const total = notifications.length;
    const sent = notifications.filter(n => n.status === 'sent').length;
    const failed = notifications.filter(n => n.status === 'failed').length;
    const pending = notifications.filter(n => n.status === 'pending').length;
    const emailCount = notifications.filter(n => n.channel === 'email').length;
    const smsCount = notifications.filter(n => n.channel === 'sms').length;

    return {
      total,
      sent,
      failed,
      pending,
      by_channel: {
        email: emailCount,
        sms: smsCount
      },
      success_rate: total > 0 ? (sent / total * 100).toFixed(1) + '%' : '0%'
    };
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

  async createBasicNotification(user: User, message: string, channel: 'email' | 'sms' = 'email') {
    return await this.create({
      user: user,
      message: message,
      recommended_place: 'Lugar de prueba',
      channel: channel,
      status: 'pending',
      metadata: {
        location: {
          city: 'Ciudad de prueba',
          coordinates: { lat: 4.710989, lng: -74.072092 }
        },
        fallback: true
      }
    });
  }

  async updateStatus(id: string, status: 'sent' | 'failed' | 'pending'): Promise<Notification> {
    await this.notificationRepo.update(id, { status });
    return await this.findOne(id);
  }
}