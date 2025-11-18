import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

/**
 * Service for managing user operations
 * 
 * @description
 * Handles all business logic related to user management including
 * CRUD operations, authentication support, and user queries.
 * Interacts with the User repository for database operations.
 * 
 * @export
 * @class UserService
 */
@Injectable()
export class UserService {
  /**
   * Creates an instance of UserService
   * 
   * @param {Repository<User>} userRepository - TypeORM repository for User entity
   */
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Creates a new user in the system
   * 
   * @description
   * Registers a new user with the provided information.
   * Password will be hashed automatically by the entity's BeforeInsert hook.
   * Email must be unique across the system.
   * 
   * @param {CreateUserDto} dto - User creation data
   * @returns {Promise<User>} The newly created user
   * @throws {BadRequestException} If email already exists
   * 
   * @example
   * ```typescript
   * const newUser = await userService.create({
   *   name: 'John Doe',
   *   email: 'john@example.com',
   *   password: 'securePass123',
   *   preferred_channel: 'email'
   * });
   * ```
   */
  async create(dto: CreateUserDto): Promise<User> {
    const newUser = this.userRepository.create(dto);
    return await this.userRepository.save(newUser);
  }

  /**
   * Retrieves all users from the database
   * 
   * @description
   * Fetches a complete list of all registered users in the system.
   * Does not include relations by default.
   * 
   * @returns {Promise<User[]>} Array of all users
   * 
   * @example
   * ```typescript
   * const allUsers = await userService.findAll();
   * console.log(`Total users: ${allUsers.length}`);
   * ```
   */
  async findAll(): Promise<User[]> {
    return await this.userRepository.find();
  }

  /**
   * Finds a user by their unique identifier
   * 
   * @description
   * Searches for a user by UUID. Throws NotFoundException if user doesn't exist.
   * Used for retrieving user details and verifying user existence.
   * 
   * @param {string} id - User UUID
   * @returns {Promise<User>} The found user
   * @throws {NotFoundException} If user with given ID doesn't exist
   * 
   * @example
   * ```typescript
   * const user = await userService.findOne('550e8400-e29b-41d4-a716-446655440000');
   * console.log(user.name);
   * ```
   */
  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`User with ID ${id} not found`);
    return user;
  }

  /**
   * Finds a user by their email address
   * 
   * @description
   * Searches for a user using their email address.
   * Primarily used by AuthService for login validation and JwtStrategy for token verification.
   * Returns null if user is not found (does not throw exception).
   * 
   * @param {string} email - User email address
   * @returns {Promise<User | null>} The found user or null if not found
   * 
   * @example
   * ```typescript
   * const user = await userService.findByEmail('john@example.com');
   * if (user) {
   *   console.log('User exists');
   * }
   * ```
   */
  async findByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findOne({ where: { email } });
  }

  /**
   * Updates an existing user's information
   * 
   * @description
   * Updates user data with the provided fields. Only the fields present in the DTO
   * will be updated. Verifies user existence before updating.
   * If password is provided, it will be hashed automatically by the entity's BeforeUpdate hook.
   * 
   * @param {string} id - User UUID
   * @param {UpdateUserDto} dto - Updated user data (all fields optional)
   * @returns {Promise<User>} The updated user
   * @throws {NotFoundException} If user with given ID doesn't exist
   * 
   * @example
   * ```typescript
   * const updatedUser = await userService.update('550e8400-e29b-41d4-a716-446655440000', {
   *   name: 'Jane Doe',
   *   preferred_channel: 'sms'
   * });
   * ```
   */
  async update(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    Object.assign(user, dto);
    return await this.userRepository.save(user);
  }

  /**
   * Permanently deletes a user from the system
   * 
   * @description
   * Removes a user and all associated data from the database.
   * This action cannot be undone. Verifies user existence before deletion.
   * Related entities (notifications, location history) may be cascade deleted depending on configuration.
   * 
   * @param {string} id - User UUID
   * @returns {Promise<void>}
   * @throws {NotFoundException} If user with given ID doesn't exist
   * 
   * @example
   * ```typescript
   * await userService.remove('550e8400-e29b-41d4-a716-446655440000');
   * console.log('User deleted successfully');
   * ```
   */
  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepository.remove(user);
  }
}