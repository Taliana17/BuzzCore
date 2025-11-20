import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SmsProcessor } from './sms.processor';
import { SmsNotificationProcessor } from '../services/processors/sms-notification.processor';
import { Notification } from '../entities/notification.entity';

describe('SmsProcessor', () => {
  let processor: SmsProcessor;
  let mockNotificationRepo: any;
  let mockSmsProcessor: any;

  const mockJob = {
    data: { notificationId: 'notif-1' }
  };

  beforeEach(async () => {
    mockNotificationRepo = {
      findOne: jest.fn(),
    };

    mockSmsProcessor = {
      processSmsNotification: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SmsProcessor,
        { provide: getRepositoryToken(Notification), useValue: mockNotificationRepo },
        { provide: SmsNotificationProcessor, useValue: mockSmsProcessor },
      ],
    }).compile();

    processor = module.get<SmsProcessor>(SmsProcessor);
  });

  describe('process', () => {
    it('should process SMS notification successfully', async () => {
      const mockNotification = { id: 'notif-1' } as Notification;
      mockNotificationRepo.findOne.mockResolvedValue(mockNotification);
      mockSmsProcessor.processSmsNotification.mockResolvedValue(undefined);

      const result = await processor.process(mockJob as any);

      expect(result).toEqual({ success: true, notificationId: 'notif-1' });
    });

    it('should handle processing errors', async () => {
      const mockNotification = { id: 'notif-1' } as Notification;
      mockNotificationRepo.findOne.mockResolvedValue(mockNotification);
      mockSmsProcessor.processSmsNotification.mockRejectedValue(new Error('SMS failed'));

      await expect(processor.process(mockJob as any)).rejects.toThrow('SMS failed');
    });
  });
});