import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';

export class CreateNotificationLogDto {
  @IsInt()
  notificationId: number;

  @IsInt()
  attempt: number;

  @IsEnum(['exitoso', 'error'])
  status: 'exitoso' | 'error';

  @IsOptional()
  @IsString()
  response?: string;
}
