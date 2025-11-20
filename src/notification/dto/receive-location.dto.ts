import { IsNumber, IsOptional, IsString, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReceiveLocationDto {
  @ApiProperty({
    description: 'Latitude coordinate of the user location. Valid range: -90 to 90 degrees.',
    example: 4.7110,
    type: Number,
    minimum: -90,
    maximum: 90,
  })
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat: number;

  @ApiProperty({
    description: 'Longitude coordinate of the user location. Valid range: -180 to 180 degrees.',
    example: -74.0721,
    type: Number,
    minimum: -180,
    maximum: 180,
  })
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng: number;

  @ApiProperty({
    description: 'Detected city name based on geolocation or IP address. Optional, can be determined automatically by the system.',
    example: 'Bogotá',
    required: false,
    nullable: true,
    type: String,
  })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({
    description: 'User unique identifier (UUID). Optional, can be extracted from JWT token if authenticated.',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
    required: false,
    nullable: true,
    type: String,
  })
  @IsOptional()
  @IsString()
  userId?: string;
}