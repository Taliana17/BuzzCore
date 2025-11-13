import { IsString, IsIn } from 'class-validator';

export class CreateNotificationDto {
  @IsString()
  message: string;

  @IsString()
  recommended_place: string;

  @IsIn(['email', 'sms'])
  channel: 'email' | 'sms';
}
