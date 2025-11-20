import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationQueueService } from './notification-queue.service';
import { NotificationValidator } from './notification-validator.service';
import { NotificationFactory } from './notification-factory.service';
import { Notification } from '../../entities/notification.entity';
import { User } from '../../../user/entities/user.entity';

describe('NotificationService', () => {
  let service: NotificationService;
  let mockNotificationRepo: any;
  let mockQueueService: any;
  let mockValidator: any;
  let mockFactory: any;
  let mockPlaceFinder: any;
  let mockLocationDetector: any;

  const mockUser: User = {
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
    preferred_channel: 'email',
  } as User;

  beforeEach(async () => {
    mockNotificationRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
    };

    mockQueueService = {
      enqueueNotification: jest.fn(),
    };

    mockValidator = {
      validateLocationData: jest.fn(),
    };

    mockFactory = {
      createTouristNotification: jest.fn(),
    };

    mockPlaceFinder = {
      findRecommendedPlace: jest.fn(),
    };

    mockLocationDetector = {
      detectCity: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        { provide: getRepositoryToken(Notification), useValue: mockNotificationRepo },
        { provide: NotificationQueueService, useValue: mockQueueService },
        { provide: NotificationValidator, useValue: mockValidator },
        { provide: NotificationFactory, useValue: mockFactory },
        { provide: 'PlaceFinder', useValue: mockPlaceFinder },
        { provide: 'LocationDetector', useValue: mockLocationDetector },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
  });

  describe('findAllByUser', () => {
    it('should return user notifications', async () => {
      const mockNotifications = [{ id: '1' }, { id: '2' }] as Notification[];
      mockNotificationRepo.find.mockResolvedValue(mockNotifications);

      const result = await service.findAllByUser('user-1');

      expect(result).toEqual(mockNotifications);
      expect(mockNotificationRepo.find).toHaveBeenCalledWith({
        where: { user: { id: 'user-1' } },
        relations: ['user'],
        order: { sent_at: 'DESC' },
      });
    });
  });

  describe('findOne', () => {
    it('should return notification by id', async () => {
      const mockNotification = { id: '1' } as Notification;
      mockNotificationRepo.findOne.mockResolvedValue(mockNotification);

      const result = await service.findOne('1');

      expect(result).toEqual(mockNotification);
    });

    it('should throw if notification not found', async () => {
      mockNotificationRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne('invalid')).rejects.toThrow('Notification not found');
    });
  });

  describe('updateStatus', () => {
    it('should update notification status', async () => {
      const mockNotification = { id: '1', status: 'sent' } as Notification;
      mockNotificationRepo.update.mockResolvedValue({ affected: 1 });
      mockNotificationRepo.findOne.mockResolvedValue(mockNotification);

      const result = await service.updateStatus('1', 'sent');

      expect(result.status).toBe('sent');
      expect(mockNotificationRepo.update).toHaveBeenCalledWith('1', { status: 'sent' });
    });
  });
});