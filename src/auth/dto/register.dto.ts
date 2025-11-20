import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsIn, IsOptional, IsString, MinLength, MaxLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    description: "User's full name",
    example: 'Alice Doe',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'Unique email address for authentication',
    example: 'alice@example.com',
    format: 'email',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Password (will be hashed). Minimum 6 characters',
    example: 'SecurePass123!',
    minLength: 6,
    maxLength: 50,
    format: 'password',
  })
  @IsString()
  @MinLength(6)
  @MaxLength(50)
  password: string;

  @ApiProperty({
    description: 'Preferred notification channel',
    example: 'email',
    enum: ['email', 'sms'],
    default: 'email',
  })
  @IsIn(['email', 'sms'])
  preferred_channel: 'email' | 'sms';

  @ApiProperty({
    description: 'User role. Defaults to "user" if not specified',
    example: 'user',
    enum: ['user', 'admin'],
    default: 'user',
    required: false,
  })
  @IsOptional()
  @IsIn(['user', 'admin'])
  role?: 'user' | 'admin';
}