import { IsString, IsObject, IsOptional } from 'class-validator';

export class CreateLocationHistoryDto {
  @IsString()
  city: string;

  @IsOptional()
  @IsObject()
  coordinates?: { lat: number; lng: number };
}
