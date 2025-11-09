import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateChannelDto {
  @IsString()
  @IsNotEmpty()
  name: string; // email, sms, etc.

  @IsString()
  @IsNotEmpty()
  provider: string; // Twilio, Resend, etc.

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
