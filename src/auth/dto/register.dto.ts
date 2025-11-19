import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsIn, IsOptional, IsString } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'Alice Doe' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'alice@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  password: string;

   @ApiProperty({ example: '+573001234567' }) 
  @IsString()
  phone: string;

  @ApiProperty({ example: 'email', enum: ['email', 'sms'] })
  @IsIn(['email', 'sms'])
  preferred_channel: 'email' | 'sms';

  @ApiProperty({ example: 'user', enum: ['user', 'admin'], required: false })
  @IsOptional()
  role?: 'user' | 'admin';
}
