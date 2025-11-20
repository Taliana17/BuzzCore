import { IsString, IsIn, IsOptional, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateNotificationDto {
  @ApiProperty({
    description: 'Notification message content to be sent to the user. Should contain information about weather, events, or recommendations.',
    example: 'The weather in Bogotá is sunny today! Perfect for outdoor activities.',
    type: String,
    minLength: 10,
    maxLength: 500,
  })
  @IsString()
  message: string;

  @ApiProperty({
    description: 'Recommended place or activity based on current conditions. Personalized suggestion for the user.',
    example: 'Visit Monserrate for a great view',
    type: String,
    minLength: 3,
    maxLength: 200,
  })
  @IsString()
  recommended_place: string;

  @ApiProperty({
    description: 'Communication channel to send the notification. Email is preferred for detailed messages, SMS for urgent alerts.',
    example: 'email',
    enum: ['email', 'sms'],
    default: 'email',
    type: String,
  })
  @IsIn(['email', 'sms'])
  channel: 'email' | 'sms';

  @ApiProperty({
    description: 'Optional location data associated with the notification. Includes city name and geographic coordinates.',
    example: {
      city: 'Bogotá',
      coordinates: { lat: 4.7110, lng: -74.0721 }
    },
    required: false,
    nullable: true,
    type: 'object',
    properties: {
      city: {
        type: 'string',
        example: 'Bogotá',
        description: 'City name where the notification is relevant'
      },
      coordinates: {
        type: 'object',
        properties: {
          lat: { type: 'number', example: 4.7110, description: 'Latitude' },
          lng: { type: 'number', example: -74.0721, description: 'Longitude' }
        },
        required: false,
        description: 'Geographic coordinates (optional)'
      }
    }
  })
  @IsOptional()
  @IsObject()
  location_data?: {
    city: string;
    coordinates?: { lat: number; lng: number };
  };
}