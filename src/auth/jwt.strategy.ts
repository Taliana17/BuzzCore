import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from 'src/user/user.service';
import { JwtPayload } from './types/jwt-payload.interface';
import { User } from 'src/user/entities/user.entity';

/**
 * JWT Authentication Strategy
 * 
 * @description
 * Passport strategy for validating JWT tokens and extracting user information.
 * Automatically invoked by JwtAuthGuard when a protected route is accessed.
 * 
 * Validation process:
 * 1. Extracts JWT token from Authorization header (Bearer token)
 * 2. Verifies token signature using JWT_SECRET from environment
 * 3. Checks token expiration (rejects expired tokens)
 * 4. Extracts payload and validates user existence in database
 * 5. Attaches user data to request object (req.user)
 * 
 * @export
 * @class JwtStrategy
 * @extends {PassportStrategy(Strategy)}
 * 
 * @example
 * ```typescript
 * // This strategy is automatically used by JwtAuthGuard
 * @UseGuards(JwtAuthGuard)
 * @Get('profile')
 * getProfile(@Req() req) {
 *   console.log(req.user.id);    // User ID from JWT
 *   console.log(req.user.email); // User email from JWT
 *   console.log(req.user.role);  // User role from JWT
 * }
 * ```
 * 
 * @see JwtAuthGuard - Guard that uses this strategy
 * @see JwtPayload - Interface defining JWT token payload structure
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  /**
   * Creates an instance of JwtStrategy
   * 
   * @description
   * Configures JWT validation strategy with:
   * - Token extraction from Authorization header (Bearer scheme)
   * - Expiration validation enabled
   * - Secret key from environment variables (JWT_SECRET)
   * 
   * @param {ConfigService} configService - NestJS config service for accessing environment variables
   * @param {UserService} userService - Service for user database operations
   */
  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // Extract from "Authorization: Bearer <token>"
      ignoreExpiration: false, // Reject expired tokens
      secretOrKey: configService.get<string>('JWT_SECRET') || 'secret', // Signing secret from .env
    });
  }

  /**
   * Validates JWT payload and returns user data
   * 
   * @description
   * Core validation method automatically called by Passport after token verification.
   * Checks if user still exists in database (handles deleted users scenario).
   * Returns minimal user data that will be attached to request object.
   * 
   * Security features:
   * - Verifies user existence in database
   * - Returns only necessary user fields (id, email, role)
   * - Throws UnauthorizedException if user not found
   * 
   * @param {JwtPayload} payload - Decoded JWT payload containing user information
   * @returns {Promise<Pick<User, 'id' | 'email' | 'role'>>} Validated user data (id, email, role)
   * @throws {UnauthorizedException} If user is not found in database
   * 
   * @example
   * ```typescript
   * // JWT Payload example:
   * {
   *   email: 'john@example.com',
   *   sub: '550e8400-e29b-41d4-a716-446655440000',
   *   iat: 1516239022,
   *   exp: 1516242622
   * }
   * 
   * // Returned user object attached to req.user:
   * {
   *   id: '550e8400-e29b-41d4-a716-446655440000',
   *   email: 'john@example.com',
   *   role: 'user'
   * }
   * ```
   */
  async validate(payload: JwtPayload): Promise<Pick<User, 'id' | 'email' | 'role'>> {
    const user = await this.userService.findByEmail(payload.email);

    // ✅ Verificación segura sin any
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
    };
  }
}