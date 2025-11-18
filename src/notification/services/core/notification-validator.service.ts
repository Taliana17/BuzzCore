import { Injectable, BadRequestException } from '@nestjs/common';
import { ReceiveLocationDto } from '../../dto/receive-location.dto';
import { CreateNotificationDto } from '../../dto/create-notification.dto';

@Injectable()
export class NotificationValidator {
  validateLocationData(dto: ReceiveLocationDto): void {
    if (!this.isValidCoordinates(dto.lat, dto.lng)) {
      throw new BadRequestException('Coordenadas geográficas inválidas');
    }
  }

  validateNotificationData(dto: CreateNotificationDto): void {
    if (!dto.location_data?.coordinates) {
      throw new BadRequestException('Location data with coordinates is required for tourist notifications');
    }
    
    if (!this.isValidChannel(dto.channel)) {
      throw new BadRequestException('Invalid notification channel');
    }
  }

  private isValidCoordinates(lat: number, lng: number): boolean {
    return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  }

  private isValidChannel(channel: string): boolean {
    return ['email', 'sms'].includes(channel);
  }

  validateUserPhone(phone: string): void {
    if (!phone) {
      throw new BadRequestException('User phone number is required for SMS notifications');
    }
  }
}