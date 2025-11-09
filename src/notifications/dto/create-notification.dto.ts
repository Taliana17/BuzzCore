import { IsString, IsNotEmpty, IsIn, IsOptional, IsDateString } from 'class-validator';

export class CreateNotificationDto {
  @IsIn(['email', 'sms'])
  type: 'email' | 'sms';

  @IsString()
  @IsNotEmpty()
  destination: string;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsOptional()
  @IsDateString()
  sendAt?: string;
}
