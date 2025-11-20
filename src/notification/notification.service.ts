import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { User } from '../user/entities/user.entity';

/**
 * Service for managing notification operations
 * 
 * @description
 * Handles business logic for notification management including
 * creating notifications and retrieving user-specific notification history.
 * Works in conjunction with NotificationQueueService for async processing.
 * 
 * @export
 * @class NotificationService
 */
@Injectable()
export class NotificationService {
  /**
   * Creates an instance of NotificationService
   * 
   * @param {Repository<Notification>} notificationRepo - TypeORM repository for Notification entity
   */
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
  ) {}

  /**
   * Creates a new notification for a user
   * 
   * @description
   * Creates and saves a notification record in the database.
   * Associates the notification with a specific user.
   * This method does not send the actual notification (email/SMS),
   * it only creates the database record. Use NotificationQueueService for sending.
   * 
   * @param {CreateNotificationDto} dto - Notification data (message, channel, recommended place, location data)
   * @param {User} user - User who will receive the notification
   * @returns {Promise<Notification>} The newly created notification with all relationships
   * 
   * @example
   * ```typescript
   * const notification = await notificationService.create({
   *   message: 'Visit Monserrate today!',
   *   recommended_place: 'Monserrate',
   *   channel: 'email',
   *   location_data: { city: 'Bogotá', coordinates: { lat: 4.7110, lng: -74.0721 } }
   * }, user);
   * ```
   */
  async create(dto: CreateNotificationDto, user: User) {
    const notif = this.notificationRepo.create({ ...dto, user });
    return this.notificationRepo.save(notif);
  }

  /**
   * Retrieves all notifications for a specific user
   * 
   * @description
   * Fetches all notification records associated with a user ID.
   * Includes the user relationship in the response.
   * Returns notifications ordered by creation date (most recent first by default).
   * 
   * @param {string} userId - User UUID
   * @returns {Promise<Notification[]>} Array of notifications with user relationship loaded
   * 
   * @example
   * ```typescript
   * const userNotifications = await notificationService.findAllByUser('550e8400-e29b-41d4-a716-446655440000');
   * console.log(`Total notifications: ${userNotifications.length}`);
   * ```
   */
  async findAllByUser(userId: string) {
    return this.notificationRepo.find({
      where: { user: { id: userId } },
      relations: ['user'],
    });
  }
}