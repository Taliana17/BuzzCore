import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * JWT Authentication Guard
 * 
 * @description
 * Guard that protects routes by validating JWT tokens.
 * Extends Passport's AuthGuard with 'jwt' strategy.
 * 
 * When applied to a route:
 * 1. Extracts JWT token from Authorization header (Bearer token)
 * 2. Validates token signature and expiration
 * 3. Decodes payload and attaches user data to request object
 * 4. Allows access if token is valid, returns 401 Unauthorized if invalid
 * 
 * Works in conjunction with JwtStrategy which defines validation logic.
 * 
 * @export
 * @class JwtAuthGuard
 * @extends {AuthGuard('jwt')}
 * 
 * @example
 * ```typescript
 * // Protect a single route
 * @UseGuards(JwtAuthGuard)
 * @Get('profile')
 * getProfile(@Req() req) {
 *   return req.user; // User data from JWT payload
 * }
 * 
 * // Protect entire controller
 * @UseGuards(JwtAuthGuard)
 * @Controller('users')
 * export class UserController { ... }
 * ```
 * 
 * @example
 * ```typescript
 * // In Swagger documentation
 * @ApiBearerAuth()
 * @UseGuards(JwtAuthGuard)
 * @Get()
 * async findAll() { ... }
 * ```
 * 
 * @see JwtStrategy - Defines JWT validation logic
 * @see AuthGuard - Base Passport guard from @nestjs/passport
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}