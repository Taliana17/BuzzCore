import { Test, TestingModule } from '@nestjs/testing';
import { NotificationController } from './notification.controller';
import { NotificationService } from './services/core/notification.service';
import { NotificationStatisticsService } from './services/core/notification-statistics.service';
import { NotificationQueueService } from './services/core/notification-queue.service';
import { TouristPlacesService } from './services/external/tourist-places.service';
import { CityDetectionService } from './services/external/city-detection.service';
import { EmailProvider } from './services/providers/email.provider';
import { SmsProvider } from './services/providers/sms.provider';
import { UserService } from '../user/user.service';
import { LocationHistoryService } from '../location-history/location-history.service';

describe('NotificationController', () => {
  let controller: NotificationController;
  let mockNotificationService: any;
  let mockStatisticsService: any;
  let mockQueueService: any;
  let mockTouristPlacesService: any;
  let mockCityDetectionService: any;
  let mockEmailProvider: any;
  let mockSmsProvider: any;
  let mockUserService: any;
  let mockLocationHistoryService: any;

  beforeEach(async () => {
    mockNotificationService = {
      findAllByUser: jest.fn(),
      processLocationAndNotify: jest.fn(),
    };

    mockStatisticsService = {
      getNotificationStats: jest.fn(),
    };

    mockQueueService = {
      enqueueNotification: jest.fn(),
      getQueueStats: jest.fn(),
    };

    mockTouristPlacesService = {
      findNearbyPlaces: jest.fn(),
      getStatus: jest.fn(),
      findRecommendedPlace: jest.fn(),
    };

    mockCityDetectionService = {
      detectCity: jest.fn(),
      getStatus: jest.fn(),
      validateCoordinates: jest.fn(),
    };

    mockEmailProvider = {
      getStatus: jest.fn(),
      sendTouristNotification: jest.fn(),
      send: jest.fn(),
    };

    mockSmsProvider = {
      getStatus: jest.fn(),
      sendTouristNotification: jest.fn(),
      send: jest.fn(),
    };

    // MOCK COMPLETO DE UserService
    mockUserService = {
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findAll: jest.fn(),
      remove: jest.fn(),
    };

    mockLocationHistoryService = {
      create: jest.fn(),
      findByUser: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationController],
      providers: [
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: NotificationStatisticsService, useValue: mockStatisticsService },
        { provide: NotificationQueueService, useValue: mockQueueService },
        { provide: TouristPlacesService, useValue: mockTouristPlacesService },
        { provide: CityDetectionService, useValue: mockCityDetectionService },
        { provide: EmailProvider, useValue: mockEmailProvider },
        { provide: SmsProvider, useValue: mockSmsProvider },
        // USAR LA CLASE UserService DIRECTAMENTE
        { provide: UserService, useValue: mockUserService },
        // USAR LA CLASE LocationHistoryService DIRECTAMENTE
        { provide: LocationHistoryService, useValue: mockLocationHistoryService },
      ],
    }).compile();

    controller = module.get<NotificationController>(NotificationController);
  });

  describe('GET /notifications', () => {
    it('should return user notifications', async () => {
      const mockNotifications = [
        { id: '1', message: 'Test 1', channel: 'email' },
        { id: '2', message: 'Test 2', channel: 'sms' }
      ];
      mockNotificationService.findAllByUser.mockResolvedValue(mockNotifications);

      const mockReq = { user: { id: 'user-1' } };
      const result = await controller.getUserNotifications(mockReq);

      expect(result).toEqual(mockNotifications);
      expect(mockNotificationService.findAllByUser).toHaveBeenCalledWith('user-1');
    });

    it('should return empty array when no notifications', async () => {
      mockNotificationService.findAllByUser.mockResolvedValue([]);

      const mockReq = { user: { id: 'user-1' } };
      const result = await controller.getUserNotifications(mockReq);

      expect(result).toEqual([]);
    });
  });

  describe('GET /notifications/stats', () => {
    it('should return notification statistics', async () => {
      const mockStats = {
        total: 5,
        sent: 3,
        failed: 1,
        pending: 1,
        by_channel: { email: 3, sms: 2 },
        success_rate: '60.0%'
      };
      mockStatisticsService.getNotificationStats.mockResolvedValue(mockStats);

      const mockReq = { user: { id: 'user-1' } };
      const result = await controller.getNotificationStats(mockReq);

      expect(result).toEqual(mockStats);
      expect(mockStatisticsService.getNotificationStats).toHaveBeenCalledWith('user-1');
    });
  });

  describe('GET /notifications/queue/stats', () => {
    it('should return queue statistics for admin', async () => {
      const mockQueueStats = {
        email: { waiting: 2, active: 1, completed: 5 },
        sms: { waiting: 1, active: 0, completed: 3 }
      };
      mockQueueService.getQueueStats.mockResolvedValue(mockQueueStats);

      const mockReq = { user: { id: 'user-1', role: 'admin' } };
      const result = await controller.getQueueStats(mockReq);

      expect(result).toEqual(mockQueueStats);
      expect(mockQueueService.getQueueStats).toHaveBeenCalled();
    });
  });

  describe('GET /notifications/providers-status', () => {
    it('should return providers status', async () => {
      const mockEmailStatus = { initialized: false, service: 'Resend' };
      const mockSmsStatus = { initialized: false, service: 'Twilio' };
      const mockPlacesStatus = { initialized: true, hasApiKey: false };
      const mockCityStatus = { available: true, service: 'OpenStreetMap Nominatim' };

      mockEmailProvider.getStatus.mockReturnValue(mockEmailStatus);
      mockSmsProvider.getStatus.mockReturnValue(mockSmsStatus);
      mockTouristPlacesService.getStatus.mockReturnValue(mockPlacesStatus);
      mockCityDetectionService.getStatus.mockReturnValue(mockCityStatus);

      const result = await controller.getProvidersStatus();

      expect(result).toEqual({
        sms: mockSmsStatus,
        email: mockEmailStatus,
        touristPlaces: mockPlacesStatus,
        cityDetection: mockCityStatus
      });
    });
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});