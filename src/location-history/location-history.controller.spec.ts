// src/location-history/location-history.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { LocationHistoryController } from './location-history.controller';
import { LocationHistoryService } from './location-history.service';
import { CreateLocationHistoryDto } from './dto/create-location-history.dto';
import { User } from '../user/entities/user.entity';

/**
 * Mock LocationHistoryService for testing
 * Provides mocked implementations of service methods
 */
const mockLocationService = {
  create: jest.fn(),
  findAllByUser: jest.fn(),
  receiveAndProcessLocation: jest.fn(),
};

describe('LocationHistoryController', () => {
  let controller: LocationHistoryController;

  /**
   * Set up test module before each test
   * Provides mocked dependencies and compiles testing module
   */
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LocationHistoryController],
      providers: [
        {
          provide: LocationHistoryService,
          useValue: mockLocationService,
        },
      ],
    }).compile();

    controller = module.get<LocationHistoryController>(LocationHistoryController);
  });

  /**
   * Clean up mocks after each test
   * Ensures test isolation and prevents cross-test contamination
   */
  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Basic controller existence test
   * Verifies that the controller is properly instantiated
   */
  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  /**
   * Test suite for create location history endpoint
   * Tests successful creation of location records
   */
  describe('saveLocation', () => {
    it('should call service.receiveAndProcessLocation with DTO and user', async () => {
      // Arrange: Prepare test data
      const dto: CreateLocationHistoryDto = { 
        lat: 4.7110, 
        lng: -74.0721, 
        city: 'Bogotá' 
      };
      const user = { id: 'user-1', email: 'test@example.com' } as User;
      const req = { user };
      const savedRecord = { 
        id: 'location-1', 
        ...dto, 
        user,
        arrival_date: new Date()
      };

      // Setup mock implementation
      mockLocationService.receiveAndProcessLocation.mockResolvedValue(savedRecord);

      // Act: Call the controller method
      const result = await controller.saveLocation(dto, req);

      // Assert: Verify service call and result
      expect(mockLocationService.receiveAndProcessLocation).toHaveBeenCalledWith(dto, user);
      expect(result).toEqual(savedRecord);
    });

    it('should handle location creation without city parameter', async () => {
      // Arrange: Prepare test data without city
      const dto: CreateLocationHistoryDto = { 
        lat: 4.7110, 
        lng: -74.0721 
      };
      const user = { id: 'user-1' } as User;
      const req = { user };
      const savedRecord = { 
        id: 'location-1', 
        ...dto, 
        user,
        arrival_date: new Date()
      };

      mockLocationService.receiveAndProcessLocation.mockResolvedValue(savedRecord);

      // Act & Assert
      const result = await controller.saveLocation(dto, req);
      expect(mockLocationService.receiveAndProcessLocation).toHaveBeenCalledWith(dto, user);
      expect(result).toEqual(savedRecord);
    });
  });

  /**
   * Test suite for get user location history endpoint
   * Tests retrieval of location records for authenticated user
   */
  describe('findAllByUser', () => {
    it('should call service.findAllByUser with user id', async () => {
      // Arrange: Prepare test data
      const user = { id: 'user-1', email: 'test@example.com' } as User;
      const req = { user };
      const mockRecords = [
        { 
          id: 'location-1', 
          lat: 4.7110, 
          lng: -74.0721, 
          city: 'Bogotá',
          user,
          arrival_date: new Date() 
        }
      ];

      mockLocationService.findAllByUser.mockResolvedValue(mockRecords);

      // Act: Call the controller method
      const result = await controller.findAllByUser(req);

      // Assert: Verify service call and result
      expect(mockLocationService.findAllByUser).toHaveBeenCalledWith(user.id);
      expect(result).toEqual(mockRecords);
    });

    it('should return empty array when user has no location history', async () => {
      // Arrange: Prepare test data for user with no history
      const user = { id: 'user-2' } as User;
      const req = { user };

      mockLocationService.findAllByUser.mockResolvedValue([]);

      // Act & Assert
      const result = await controller.findAllByUser(req);
      expect(mockLocationService.findAllByUser).toHaveBeenCalledWith(user.id);
      expect(result).toEqual([]);
    });
  });
});