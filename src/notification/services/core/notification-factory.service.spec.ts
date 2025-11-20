import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotificationFactory } from './notification-factory.service';
import { Notification } from '../../entities/notification.entity';
import { User } from '../../../user/entities/user.entity';

describe('NotificationFactory', () => {
  let factory: NotificationFactory;
  let mockNotificationRepo: any;

  const mockUser: User = {
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
    preferred_channel: 'email',
  } as User;

  beforeEach(async () => {
    mockNotificationRepo = {
      create: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationFactory,
        {
          provide: getRepositoryToken(Notification),
          useValue: mockNotificationRepo,
        },
      ],
    }).compile();

    factory = module.get<NotificationFactory>(NotificationFactory);
  });

  describe('createTouristNotification', () => {
    it('should create tourist notification successfully', async () => {
      const mockNotification = {
        id: 'notif-1',
        message: 'Test message',
        recommended_place: 'Test Place',
        channel: 'email',
        status: 'pending',
      };

      mockNotificationRepo.create.mockReturnValue(mockNotification);
      mockNotificationRepo.save.mockResolvedValue(mockNotification);

      const result = await factory.createTouristNotification(
        mockUser,
        'Test message',
        'Test Place',
        'email',
        { location: { city: 'Test City' } }
      );

      expect(result).toEqual(mockNotification);
      expect(mockNotificationRepo.create).toHaveBeenCalled();
      expect(mockNotificationRepo.save).toHaveBeenCalled();
    });
  });

  describe('createBasicNotification', () => {
    it('should create basic notification with default values', async () => {
      const mockNotification = {
        id: 'notif-1',
        message: 'Basic message',
        recommended_place: 'Lugar de prueba',
        channel: 'email',
      };

      mockNotificationRepo.create.mockReturnValue(mockNotification);
      mockNotificationRepo.save.mockResolvedValue(mockNotification);

      const result = await factory.createBasicNotification(
        mockUser,
        'Basic message'
      );

      expect(result).toEqual(mockNotification);
      expect(mockNotificationRepo.create).toHaveBeenCalled();
    });
  });
});