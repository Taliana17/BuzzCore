import { IsNumber, IsOptional, IsString, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReceiveLocationDto {
  @ApiProperty({ description: 'Latitud de la ubicación' })
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat: number;

  @ApiProperty({ description: 'Longitud de la ubicación' })
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng: number;

  @ApiProperty({ description: 'Ciudad detectada', required: false })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({ description: 'ID del usuario', required: false })
  @IsOptional()
  @IsString()
  userId?: string;
}