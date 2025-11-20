import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EmailProcessor } from './email.processor';
import { EmailNotificationProcessor } from '../services/processors/email-notification.processor';
import { Notification } from '../entities/notification.entity';

describe('EmailProcessor', () => {
  let processor: EmailProcessor;
  let mockNotificationRepo: any;
  let mockEmailProcessor: any;

  const mockJob = {
    data: { notificationId: 'notif-1', channel: 'email' }
  };

  beforeEach(async () => {
    mockNotificationRepo = {
      findOne: jest.fn(),
    };

    mockEmailProcessor = {
      processEmailNotification: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailProcessor,
        { provide: getRepositoryToken(Notification), useValue: mockNotificationRepo },
        { provide: EmailNotificationProcessor, useValue: mockEmailProcessor },
      ],
    }).compile();

    processor = module.get<EmailProcessor>(EmailProcessor);
  });

  describe('process', () => {
    it('should process email notification successfully', async () => {
      const mockNotification = { id: 'notif-1' } as Notification;
      mockNotificationRepo.findOne.mockResolvedValue(mockNotification);
      mockEmailProcessor.processEmailNotification.mockResolvedValue(undefined);

      const result = await processor.process(mockJob as any);

      expect(result).toEqual({ success: true, notificationId: 'notif-1' });
      expect(mockEmailProcessor.processEmailNotification).toHaveBeenCalledWith(mockNotification);
    });

    it('should throw if notification not found', async () => {
      mockNotificationRepo.findOne.mockResolvedValue(null);

      await expect(processor.process(mockJob as any)).rejects.toThrow('Notification notif-1 not found');
    });
  });
});