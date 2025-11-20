import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'User email address',
    example: 'alice@example.com',
    format: 'email',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'User password',
    example: 'SecurePass123!',
    format: 'password',
  })
  @IsString()
  password: string;
}