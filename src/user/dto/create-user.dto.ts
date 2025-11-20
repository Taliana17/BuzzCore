import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, IsIn, MinLength, MaxLength } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    description: "User's full name (first name and last name)",
    example: 'John Doe',
    minLength: 2,
    maxLength: 100,
    type: String,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'Unique email address for user authentication and email notifications',
    example: 'john.doe@example.com',
    format: 'email',
    type: String,
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Mobile phone number for SMS notifications. International format recommended (E.164)',
    example: '+573001234567',
    required: false,
    nullable: true,
    type: String,
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({
    description: "User's preferred channel for receiving notifications. Defaults to 'email' if not specified",
    example: 'email',
    enum: ['email', 'sms'],
    default: 'email',
    type: String,
  })
  @IsIn(['email', 'sms'])
  preferred_channel: 'email' | 'sms';

  @ApiProperty({
    description: 'User password (plain text). Will be hashed using bcrypt before storage. Minimum 6 characters recommended',
    example: 'SecurePassword123!',
    minLength: 6,
    maxLength: 50,
    format: 'password',
    type: String,
  })
  @IsString()
  @MinLength(6)
  @MaxLength(50)
  password: string;

  @ApiProperty({
    description: "User's role in the system. Determines access permissions. Defaults to 'user' if not specified",
    example: 'user',
    enum: ['user', 'admin'],
    default: 'user',
    required: false,
    type: String,
  })
  @IsOptional()
  @IsIn(['user', 'admin'])
  role?: 'user' | 'admin';
}