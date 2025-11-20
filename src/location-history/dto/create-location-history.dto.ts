import { IsNumber, IsOptional, IsString, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateLocationHistoryDto {
  @ApiProperty({
    description: 'Latitude coordinate of the detected location. Valid range: -90 to 90 degrees.',
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
    description: 'Longitude coordinate of the detected location. Valid range: -180 to 180 degrees.',
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
    description: 'City name where the user was detected. Optional, can be determined automatically via reverse geocoding if not provided.',
    example: 'Bogotá',
    required: false,
    nullable: true,
    type: String,
  })
  @IsOptional()
  @IsString()
  city?: string;   
}