import { IsString, IsIn, IsOptional, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';


export class CreateNotificationDto {
  @ApiProperty({ example: 'Hay un evento cerca de ti' })
  @IsString()
  message: string;

  @ApiProperty({ example: 'Centro Comercial Santa Fe' })
  @IsString()
  recommended_place: string;

  @ApiProperty({ example: 'email', enum: ['email', 'sms'] })
  @IsIn(['email', 'sms'])
  channel: 'email' | 'sms';

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  location_data?: {
    city: string;
    coordinates?: { lat: number; lng: number };
  };
}