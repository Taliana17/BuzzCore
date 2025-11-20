import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException } from '@nestjs/common';

import { LocationHistoryService } from './location-history.service';
import { LocationHistory } from './entities/location-history.entity';
import { CreateLocationHistoryDto } from './dto/create-location-history.dto';
import { User } from '../user/entities/user.entity';
import { NotificationService } from '../notification/services/core/notification.service';
import { UserService } from '../user/user.service';

/**
 * Mock TypeORM Repository for LocationHistory entity
 */
const mockLocationRepository = {
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
};

/**
 * Mock NotificationService for testing location processing
 */
const mockNotificationService = {
  processLocationAndNotify: jest.fn(),
};

/**
 * Mock UserService for user operations
 */
const mockUserService = {
  // User service methods can be added here if needed
};

describe('LocationHistoryService', () => {
  let service: LocationHistoryService;
  let locationRepo: Repository<LocationHistory>;

  /**
   * Set up test module before each test
   * Provides mocked dependencies for all service dependencies
   */
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocationHistoryService,
        {
          provide: getRepositoryToken(LocationHistory),
          useValue: mockLocationRepository,
        },
        {
          provide: NotificationService,
          useValue: mockNotificationService,
        },
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    service = module.get<LocationHistoryService>(LocationHistoryService);
    locationRepo = module.get<Repository<LocationHistory>>(getRepositoryToken(LocationHistory));
  });

  /**
   * Clean up mocks after each test
   * Ensures test isolation and prevents cross-test contamination
   */
  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Basic service existence test
   * Verifies that the service is properly instantiated
   */
  describe('Service Initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });
  });

  /**
   * Test suite for receiveAndProcessLocation method
   * Tests location reception, validation, and processing delegation
   */
  describe('receiveAndProcessLocation', () => {
    const mockUser: User = {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
    } as User;

    const validDto: CreateLocationHistoryDto = {
      lat: 4.7110,
      lng: -74.0721,
      city: 'Bogotá',
    };

    it('should successfully process location with all data', async () => {
      // Arrange
      const notificationResult = {
        success: true,
        message: 'Notification sent successfully',
        city: 'Bogotá',
        places: ['Place 1', 'Place 2'],
      };

      mockNotificationService.processLocationAndNotify.mockResolvedValue(notificationResult);

      // Act
      const result = await service.receiveAndProcessLocation(validDto, mockUser);

      // Assert
      expect(mockNotificationService.processLocationAndNotify).toHaveBeenCalledWith(
        {
          userId: mockUser.id,
          lat: validDto.lat,
          lng: validDto.lng,
          city: validDto.city,
        },
        mockUserService,
        service,
      );
      expect(result).toEqual(notificationResult);
    });

    it('should process location without city and let Google detect it', async () => {
      // Arrange
      const dtoWithoutCity: CreateLocationHistoryDto = {
        lat: 4.7110,
        lng: -74.0721,
      };

      const notificationResult = {
        success: true,
        message: 'Notification sent with detected city',
        city: 'Detected City',
        places: ['Place 1'],
      };

      mockNotificationService.processLocationAndNotify.mockResolvedValue(notificationResult);

      // Act
      const result = await service.receiveAndProcessLocation(dtoWithoutCity, mockUser);

      // Assert
      expect(mockNotificationService.processLocationAndNotify).toHaveBeenCalledWith(
        {
          userId: mockUser.id,
          lat: dtoWithoutCity.lat,
          lng: dtoWithoutCity.lng,
          city: undefined, // City should be undefined when not provided
        },
        mockUserService,
        service,
      );
      expect(result).toEqual(notificationResult);
    });

    it('should throw BadRequestException when latitude is missing', async () => {
      // Arrange
      const invalidDto: CreateLocationHistoryDto = {
        lat: undefined as any,
        lng: -74.0721,
      };

      // Act & Assert
      await expect(service.receiveAndProcessLocation(invalidDto, mockUser))
        .rejects
        .toThrow(BadRequestException);
      
      await expect(service.receiveAndProcessLocation(invalidDto, mockUser))
        .rejects
        .toThrow('lat y lng son obligatorios');
      
      expect(mockNotificationService.processLocationAndNotify).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when longitude is missing', async () => {
      // Arrange
      const invalidDto: CreateLocationHistoryDto = {
        lat: 4.7110,
        lng: undefined as any,
      };

      // Act & Assert
      await expect(service.receiveAndProcessLocation(invalidDto, mockUser))
        .rejects
        .toThrow(BadRequestException);
      
      await expect(service.receiveAndProcessLocation(invalidDto, mockUser))
        .rejects
        .toThrow('lat y lng son obligatorios');
      
      expect(mockNotificationService.processLocationAndNotify).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when both coordinates are missing', async () => {
      // Arrange
      const invalidDto: CreateLocationHistoryDto = {
        lat: undefined as any,
        lng: undefined as any,
      };

      // Act & Assert
      await expect(service.receiveAndProcessLocation(invalidDto, mockUser))
        .rejects
        .toThrow(BadRequestException);
      
      expect(mockNotificationService.processLocationAndNotify).not.toHaveBeenCalled();
    });

    it('should handle notification service errors gracefully', async () => {
      // Arrange
      const errorMessage = 'Notification service failed';
      mockNotificationService.processLocationAndNotify.mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      await expect(service.receiveAndProcessLocation(validDto, mockUser))
        .rejects
        .toThrow(errorMessage);
      
      expect(mockNotificationService.processLocationAndNotify).toHaveBeenCalled();
    });
  });

  /**
   * Test suite for create method
   * Tests internal location history record creation
   */
  describe('create', () => {
    const mockUser: User = {
      id: 'user-123',
      email: 'test@example.com',
    } as User;

    const locationData = {
      city: 'Bogotá',
      coordinates: { lat: 4.7110, lng: -74.0721 },
    };

    it('should create and save a location history record', async () => {
      // Arrange
      const savedRecord: LocationHistory = {
        id: 'location-1',
        city: locationData.city,
        coordinates: locationData.coordinates,
        user: mockUser,
        arrival_date: new Date(),
      };

      mockLocationRepository.create.mockReturnValue(savedRecord);
      mockLocationRepository.save.mockResolvedValue(savedRecord);

      // Act
      const result = await service.create(locationData, mockUser);

      // Assert
      expect(mockLocationRepository.create).toHaveBeenCalledWith({
        city: locationData.city,
        coordinates: locationData.coordinates,
        user: mockUser,
      });
      expect(mockLocationRepository.save).toHaveBeenCalledWith(savedRecord);
      expect(result).toEqual(savedRecord);
    });

    it('should handle repository errors during creation', async () => {
      // Arrange
      const errorMessage = 'Database error';
      mockLocationRepository.create.mockReturnValue({});
      mockLocationRepository.save.mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      await expect(service.create(locationData, mockUser))
        .rejects
        .toThrow(errorMessage);
    });
  });

  /**
   * Test suite for findAllByUser method
   * Tests retrieval of user location history
   */
  describe('findAllByUser', () => {
    const userId = 'user-123';
    const mockUser: User = {
      id: userId,
      email: 'test@example.com',
    } as User;

    it('should return all location records for user ordered by date DESC', async () => {
      // Arrange
      const mockRecords: LocationHistory[] = [
        {
          id: 'location-1',
          city: 'Bogotá',
          coordinates: { lat: 4.7110, lng: -74.0721 },
          user: mockUser,
          arrival_date: new Date('2023-01-02'),
        },
        {
          id: 'location-2',
          city: 'Medellín',
          coordinates: { lat: 6.2442, lng: -75.5812 },
          user: mockUser,
          arrival_date: new Date('2023-01-01'),
        },
      ];

      mockLocationRepository.find.mockResolvedValue(mockRecords);

      // Act
      const result = await service.findAllByUser(userId);

      // Assert
      expect(mockLocationRepository.find).toHaveBeenCalledWith({
        where: { user: { id: userId } },
        relations: ['user'],
        order: { arrival_date: 'DESC' },
      });
      expect(result).toEqual(mockRecords);
      expect(result.length).toBe(2);
    });

    it('should return empty array when user has no location history', async () => {
      // Arrange
      mockLocationRepository.find.mockResolvedValue([]);

      // Act
      const result = await service.findAllByUser(userId);

      // Assert
      expect(mockLocationRepository.find).toHaveBeenCalledWith({
        where: { user: { id: userId } },
        relations: ['user'],
        order: { arrival_date: 'DESC' },
      });
      expect(result).toEqual([]);
    });

    it('should handle repository errors during find', async () => {
      // Arrange
      const errorMessage = 'Database query failed';
      mockLocationRepository.find.mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      await expect(service.findAllByUser(userId))
        .rejects
        .toThrow(errorMessage);
    });
  });

  /**
   * Test suite for edge cases and error scenarios
   */
  describe('Edge Cases', () => {
    const mockUser: User = {
      id: 'user-123',
      email: 'test@example.com',
    } as User;

    it('should handle boundary coordinate values', async () => {
      // Arrange
      const boundaryDto: CreateLocationHistoryDto = {
        lat: 90, // Maximum valid latitude
        lng: 180, // Maximum valid longitude
        city: 'North Pole Area',
      };

      const notificationResult = { success: true };
      mockNotificationService.processLocationAndNotify.mockResolvedValue(notificationResult);

      // Act
      const result = await service.receiveAndProcessLocation(boundaryDto, mockUser);

      // Assert
      expect(mockNotificationService.processLocationAndNotify).toHaveBeenCalled();
      expect(result).toEqual(notificationResult);
    });

    it('should handle null city value correctly', async () => {
      // Arrange
      const dtoWithNullCity: CreateLocationHistoryDto = {
        lat: 4.7110,
        lng: -74.0721,
        city: null as any,
      };

      const notificationResult = { success: true };
      mockNotificationService.processLocationAndNotify.mockResolvedValue(notificationResult);

      // Act
      const result = await service.receiveAndProcessLocation(dtoWithNullCity, mockUser);

      // Assert
      expect(mockNotificationService.processLocationAndNotify).toHaveBeenCalledWith(
        expect.objectContaining({
          city: undefined, // Should convert null to undefined
        }),
        mockUserService,
        service,
      );
      expect(result).toEqual(notificationResult);
    });
  });
});