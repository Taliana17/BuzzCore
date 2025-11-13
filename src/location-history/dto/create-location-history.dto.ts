import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateLocationHistoryDto {
  @IsNumber()
  lat: number;

  @IsNumber()
  lng: number;

  @IsOptional()
  @IsString()
  city?: string;   
}
