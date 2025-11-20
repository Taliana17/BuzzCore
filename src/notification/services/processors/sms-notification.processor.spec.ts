import { Test, TestingModule } from '@nestjs/testing';
import { SmsNotificationProcessor } from './sms-notification.processor';
import { NotificationService } from '../core/notification.service';
import { SmsTemplateService } from '../templates/sms-template.service';
import { SmsProvider } from '../providers/sms.provider';
import { Notification } from '../../entities/notification.entity';
import { User } from '../../../user/entities/user.entity';

describe('SmsNotificationProcessor', () => {
  let processor: SmsNotificationProcessor;
  let mockNotificationService: any;
  let mockSmsProvider: any;
  let mockSmsTemplateService: any;

  // Mock completo de User con todas las propiedades requeridas
  const mockUser: Partial<User> = {
    id: 'user-1',
    name: 'Test User',
    phone: '+573001234567',
    email: 'test@example.com',
    preferred_channel: 'sms' as const,
    last_detected_city: 'Bogotá',
    password: 'hashedpassword',
    role: 'user' as const,
    location_history: [],
    notifications: []
  };

  // Mock de Notification usando Partial
  const mockNotification: Partial<Notification> = {
    id: 'notif-1',
    message: 'Test message',
    recommended_place: 'Test Place',
    channel: 'sms' as const,
    user: mockUser as User,
    metadata: {},
    sent_at: new Date(),
    status: 'pending' as const
  };

  beforeEach(async () => {
    mockNotificationService = {
      updateStatus: jest.fn(),
      markAsFailed: jest.fn(),
    };

    mockSmsProvider = {
      sendTouristNotification: jest.fn(),
      send: jest.fn(),
    };

    mockSmsTemplateService = {
      buildBasicSmsMessage: jest.fn().mockReturnValue('Test SMS message'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SmsNotificationProcessor,
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: SmsProvider, useValue: mockSmsProvider },
        { provide: SmsTemplateService, useValue: mockSmsTemplateService },
      ],
    }).compile();

    processor = module.get<SmsNotificationProcessor>(SmsNotificationProcessor);
  });

  describe('processSmsNotification', () => {
    it('should process SMS notification successfully', async () => {
      const enhancedNotification = {
        ...mockNotification,
        metadata: {
          travelTime: { duration: '10 min', distance: '1 km', success: true },
          location: { city: 'Test City' },
        },
      };

      mockSmsProvider.sendTouristNotification.mockResolvedValue({ 
        success: true,
        sid: 'test-sid' 
      });

      await processor.processSmsNotification(enhancedNotification as Notification);

      expect(mockSmsProvider.sendTouristNotification).toHaveBeenCalledWith(
        '+573001234567',
        'Test User',
        'Test City',
        'Test Place',
        { duration: '10 min', distance: '1 km', success: true }
      );
      expect(mockNotificationService.updateStatus).toHaveBeenCalledWith('notif-1', 'sent');
    });

    it('should process basic SMS notification', async () => {
      mockSmsProvider.send.mockResolvedValue({ success: true });

      await processor.processSmsNotification(mockNotification as Notification);

      expect(mockSmsProvider.send).toHaveBeenCalled();
      expect(mockSmsTemplateService.buildBasicSmsMessage).toHaveBeenCalledWith(
        'Test message',
        'Test Place'
      );
    });

    it('should throw for user without phone', async () => {
      const userWithoutPhone = { ...mockUser, phone: '' };
      const notification = { ...mockNotification, user: userWithoutPhone as User };

      await expect(processor.processSmsNotification(notification as Notification)).rejects.toThrow();
    });

    it('should handle SMS sending failure', async () => {
      mockSmsProvider.sendTouristNotification.mockResolvedValue({ 
        success: false, 
        error: 'SMS failed' 
      });

      const enhancedNotification = {
        ...mockNotification,
        metadata: {
          travelTime: { duration: '10 min', distance: '1 km', success: true },
          location: { city: 'Test City' },
        },
      };

      await expect(processor.processSmsNotification(enhancedNotification as Notification)).rejects.toThrow();

      // CORREGIDO: Usar el mensaje real del error
      expect(mockNotificationService.markAsFailed).toHaveBeenCalledWith(
        'notif-1', 
        'SMS failed'  // ← Cambiado de 'Failed to send SMS' a 'SMS failed'
      );
    });

    it('should handle processing errors', async () => {
      mockSmsProvider.sendTouristNotification.mockRejectedValue(new Error('Network error'));

      const enhancedNotification = {
        ...mockNotification,
        metadata: {
          travelTime: { duration: '10 min', distance: '1 km', success: true },
          location: { city: 'Test City' },
        },
      };

      await expect(processor.processSmsNotification(enhancedNotification as Notification)).rejects.toThrow();

      expect(mockNotificationService.markAsFailed).toHaveBeenCalledWith(
        'notif-1', 
        'Network error'
      );
    });
  });

  it('should be defined', () => {
    expect(processor).toBeDefined();
  });
});