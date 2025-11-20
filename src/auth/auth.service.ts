import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserService } from 'src/user/user.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

/**
 * Authentication Service
 * 
 * @description
 * Handles user authentication operations including registration and login.
 * Manages password hashing with bcrypt and JWT token generation.
 * 
 * Security features:
 * - Password hashing with bcrypt (10 rounds)
 * - JWT token generation with user payload
 * - Email uniqueness validation
 * - Credential validation for login
 * 
 * @export
 * @class AuthService
 */
@Injectable()
export class AuthService {
  /**
   * Creates an instance of AuthService
   * 
   * @param {UserService} userService - Service for user database operations
   * @param {JwtService} jwtService - NestJS JWT service for token generation and validation
   */
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  /**
   * Registers a new user in the system
   * 
   * @description
   * Creates a new user account with the following steps:
   * 1. Validates email uniqueness
   * 2. Hashes password using bcrypt (10 rounds)
   * 3. Creates user record in database
   * 4. Returns success message with user data (excluding password)
   * 
   * Default role is 'user' if not specified in DTO.
   * 
   * @param {RegisterDto} dto - Registration data (name, email, password, phone, etc.)
   * @returns {Promise<{message: string, user: User}>} Success message and created user object
   * @throws {BadRequestException} If email already exists in database
   * 
   * @example
   * ```typescript
   * const result = await authService.register({
   *   name: 'John Doe',
   *   email: 'john@example.com',
   *   password: 'SecurePass123!',
   *   phone: '+573001234567',
   *   preferred_channel: 'email',
   *   role: 'user'
   * });
   * console.log(result.message); // 'User registered successfully'
   * console.log(result.user.id);  // New user UUID
   * ```
   */
  async register(dto: RegisterDto) {
    const existingUser = await this.userService.findByEmail(dto.email);
    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const newUser = await this.userService.create({
      ...dto,
      password: hashedPassword,
      role: dto.role || 'user',
    });

    return { message: 'User registered successfully', user: newUser };
  }

  /**
   * Authenticates user and generates JWT token
   * 
   * @description
   * Validates user credentials and returns JWT access token:
   * 1. Finds user by email
   * 2. Compares provided password with hashed password using bcrypt
   * 3. Generates JWT token with user payload (sub, email, role)
   * 4. Returns access token and user data
   * 
   * Token payload structure:
   * - sub: User ID (UUID)
   * - email: User email address
   * - role: User role (user/admin)
   * 
   * @param {LoginDto} dto - Login credentials (email and password)
   * @returns {Promise<{access_token: string, user: object}>} JWT token and user information
   * @throws {UnauthorizedException} If user not found or password doesn't match
   * 
   * @example
   * ```typescript
   * const result = await authService.login({
   *   email: 'john@example.com',
   *   password: 'SecurePass123!'
   * });
   * 
   * console.log(result.access_token); // 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
   * console.log(result.user.id);      // User UUID
   * console.log(result.user.role);    // 'user' or 'admin'
   * 
   * // Use token in subsequent requests:
   * // Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   * ```
   */
  async login(dto: LoginDto) {
    const user = await this.userService.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');

    const payload = { sub: user.id, email: user.email, role: user.role };
    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }
}