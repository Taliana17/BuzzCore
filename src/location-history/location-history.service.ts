import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { LocationHistory } from './entities/location-history.entity';
import { CreateLocationHistoryDto } from './dto/create-location-history.dto';
import { User } from '../user/entities/user.entity';
import { NotificationService } from '../notification/services/core/notification.service';
import { UserService } from '../user/user.service';

/**
 * Service for managing user location history
 *
 * @description
 * Handles the reception, processing, and storage of user location data.
 * Works in coordination with NotificationService to:
 * - Detect city from coordinates using Google Geocoding API
 * - Get tourist place recommendations
 * - Send notifications based on location
 * - Store location history records
 *
 * @export
 * @class LocationHistoryService
 */
@Injectable()
export class LocationHistoryService {
  private readonly logger = new Logger(LocationHistoryService.name);

  /**
   * Creates an instance of LocationHistoryService
   *
   * @param {Repository<LocationHistory>} locationRepo - TypeORM repository for LocationHistory entity
   * @param {NotificationService} notificationService - Service for handling notification logic
   * @param {UserService} userService - Service for user operations
   */
  constructor(
    @InjectRepository(LocationHistory)
    private readonly locationRepo: Repository<LocationHistory>,

    private readonly notificationService: NotificationService,
    private readonly userService: UserService,
  ) {}

  /**
   * Receives and processes user location coordinates
   *
   * @description
   * Main entry point for location processing. Receives coordinates and delegates to NotificationService for:
   * - City detection via Google Geocoding API
   * - Tourist place recommendations via Google Places API
   * - Notification sending (email/SMS)
   * - Location history storage
   *
   * @param {CreateLocationHistoryDto} dto - Location data (lat, lng, optional city)
   * @param {User} user - Authenticated user
   * @returns {Promise<any>} Result object containing notification and location history details
   * @throws {BadRequestException} If latitude or longitude are missing
   */
  async receiveAndProcessLocation(dto: CreateLocationHistoryDto, user: User) {
    if (!dto.lat || !dto.lng) {
      throw new BadRequestException('lat y lng son obligatorios');
    }

    this.logger.log(
      `Procesando ubicación para usuario ${user.id}: (${dto.lat}, ${dto.lng})`,
    );

    // Adapt DTO to NotificationService format
    const payload = {
      userId: user.id,
      lat: dto.lat,
      lng: dto.lng,
      city: dto.city ?? undefined, // la ciudad la detecta Google
    };

    // Delegate all logic to NotificationService
    const resultado = await this.notificationService.processLocationAndNotify(
      payload,
      this.userService,
      this,
    );

    return resultado;
  }

  /**
   * Creates a location history record
   *
   * @description
   * Internal method used by NotificationService to save location history.
   * Called after successfully detecting city and processing notification.
   *
   * @param {Object} data - Location data to save
   * @param {string} data.city - Detected city name
   * @param {Object} data.coordinates - Geographic coordinates
   * @param {number} data.coordinates.lat - Latitude
   * @param {number} data.coordinates.lng - Longitude
   * @param {User} user - User associated with this location
   * @returns {Promise<LocationHistory>} The created location history record
   */
  async create(data: { city: string; coordinates: any }, user: User) {
    const registro = this.locationRepo.create({
      city: data.city,
      coordinates: data.coordinates,
      user,
    });

    return await this.locationRepo.save(registro);
  }

  /**
   * Retrieves complete location history for a user
   *
   * @description
   * Fetches all location history records for a specific user,
   * ordered by arrival date (most recent first).
   * Includes user relationship in the response.
   *
   * @param {string} userId - User UUID
   * @returns {Promise<LocationHistory[]>} Array of location history records ordered by date (DESC)
   */
  async findAllByUser(userId: string) {
    return await this.locationRepo.find({
      where: { user: { id: userId } },
      relations: ['user'],
      order: { arrival_date: 'DESC' },
    });
  }
}
