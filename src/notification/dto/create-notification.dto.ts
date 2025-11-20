import { IsString, IsIn, IsOptional, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Data Transfer Object for creating notifications
 * 
 * Used to send personalized notifications to users based on their location
 * and preferences. Supports both email and SMS channels.
 */
export class CreateNotificationDto {
  @ApiProperty({
    description: 'Main notification content',
    example: 'Hay un evento cerca de ti',
    minLength: 5,
    maxLength: 500
  })
  @IsString()
  message: string;

  @ApiProperty({
    description: 'Recommended place for the user to visit',
    example: 'Centro Comercial Santa Fe',
    minLength: 3,
    maxLength: 200
  })
  @IsString()
  recommended_place: string;

  @ApiProperty({
    description: 'Communication channel for the notification',
    example: 'email',
    enum: ['email', 'sms'],
    default: 'email'
  })
  @IsIn(['email', 'sms'])
  channel: 'email' | 'sms';

  @ApiProperty({
    description: 'Optional location context for the notification',
    required: false,
    example: {
      city: 'Bogotá',
      coordinates: { lat: 4.7110, lng: -74.0721 }
    }
  })
  @IsOptional()
  @IsObject()
  location_data?: {
    city: string;
    coordinates?: { lat: number; lng: number };
  };
}