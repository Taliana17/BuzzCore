import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotificationStatisticsService } from './notification-statistics.service';
import { Notification } from '../../entities/notification.entity';

describe('NotificationStatisticsService', () => {
  let service: NotificationStatisticsService;
  let mockNotificationRepo: any;

  const mockNotifications = [
    { id: '1', status: 'sent', channel: 'email' },
    { id: '2', status: 'sent', channel: 'sms' },
    { id: '3', status: 'failed', channel: 'email' },
    { id: '4', status: 'pending', channel: 'email' },
  ] as Notification[];

  beforeEach(async () => {
    mockNotificationRepo = {
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationStatisticsService,
        {
          provide: getRepositoryToken(Notification),
          useValue: mockNotificationRepo,
        },
      ],
    }).compile();

    service = module.get<NotificationStatisticsService>(NotificationStatisticsService);
  });

  describe('getNotificationStats', () => {
    it('should calculate correct statistics', async () => {
      mockNotificationRepo.find.mockResolvedValue(mockNotifications);

      const result = await service.getNotificationStats('user-1');

      expect(result).toEqual({
        total: 4,
        sent: 2,
        failed: 1,
        pending: 1,
        by_channel: {
          email: 3,
          sms: 1,
        },
        success_rate: '50.0%',
      });
    });

    it('should handle zero notifications', async () => {
      mockNotificationRepo.find.mockResolvedValue([]);

      const result = await service.getNotificationStats('user-1');

      expect(result.success_rate).toBe('0%');
      expect(result.total).toBe(0);
    });
  });
});