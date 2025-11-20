import { Test, TestingModule } from '@nestjs/testing';
import { EmailNotificationProcessor } from './email-notification.processor';
import { NotificationService } from '../core/notification.service';
import { EmailTemplateService } from '../templates/email-template.service';
import { EmailProvider } from '../providers/email.provider';
import { Notification } from '../../entities/notification.entity';
import { User } from '../../../user/entities/user.entity';
import { PlaceDetails } from '../../types/places.types';

describe('EmailNotificationProcessor', () => {
  let processor: EmailNotificationProcessor;
  let mockNotificationService: any;
  let mockEmailProvider: any;
  let mockEmailTemplateService: any;

  // Mock completo de User con todas las propiedades requeridas
  const mockUser: Partial<User> = {
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
    phone: '+573001234567',
    preferred_channel: 'email' as const,
    last_detected_city: 'Bogotá',
    password: 'hashedpassword',
    role: 'user' as const,
    location_history: [],
    notifications: [],
  };

  const mockPlaceDetails: PlaceDetails = {
    name: 'Test Place',
    formatted_address: 'Test Address, Test City',
    rating: 4.5,
    opening_hours: {
      open_now: true,
      weekday_text: ['Monday-Friday: 9:00-18:00']
    },
    website: 'https://example.com',
    international_phone_number: '+573001234567',
    user_ratings_total: 100
  };

  // Mock de Notification usando Partial para evitar errores de tipo
  const mockNotification: Partial<Notification> = {
    id: 'notif-1',
    message: 'Test message',
    recommended_place: 'Test Place',
    channel: 'email' as const,
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

    mockEmailProvider = {
      sendTouristNotification: jest.fn(),
      send: jest.fn(),
    };

    mockEmailTemplateService = {
      buildBasicEmailTemplate: jest.fn().mockReturnValue('<html>Test template</html>'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailNotificationProcessor,
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: EmailProvider, useValue: mockEmailProvider },
        { provide: EmailTemplateService, useValue: mockEmailTemplateService },
      ],
    }).compile();

    processor = module.get<EmailNotificationProcessor>(EmailNotificationProcessor);
  });

  describe('processEmailNotification', () => {
    it('should process enhanced tourist notification successfully', async () => {
      const enhancedNotification = {
        ...mockNotification,
        metadata: {
          travelTime: { duration: '10 min', distance: '1 km', success: true },
          location: { city: 'Test City' },
          placeDetails: mockPlaceDetails,
        },
      };

      mockEmailProvider.sendTouristNotification.mockResolvedValue({ success: true });

      await processor.processEmailNotification(enhancedNotification as Notification);

      expect(mockEmailProvider.sendTouristNotification).toHaveBeenCalledWith(
        'test@example.com',
        'Test User',
        'Test City',
        'Test Place',
        mockPlaceDetails,
        { duration: '10 min', distance: '1 km', success: true }
      );
      expect(mockNotificationService.updateStatus).toHaveBeenCalledWith('notif-1', 'sent');
    });

    it('should process basic notification when metadata is incomplete', async () => {
      const basicNotification = {
        ...mockNotification,
        metadata: {
          location: { city: 'Test City' }
        },
      };

      mockEmailProvider.send.mockResolvedValue({ success: true });

      await processor.processEmailNotification(basicNotification as Notification);

      expect(mockEmailProvider.send).toHaveBeenCalled();
      expect(mockEmailTemplateService.buildBasicEmailTemplate).toHaveBeenCalledWith(
        'Test message',
        'Test Place'
      );
    });

    it('should handle email sending failure', async () => {
      const enhancedNotification = {
        ...mockNotification,
        metadata: {
          travelTime: { duration: '10 min', distance: '1 km', success: true },
          location: { city: 'Test City' },
          placeDetails: mockPlaceDetails,
        },
      };

      mockEmailProvider.sendTouristNotification.mockResolvedValue({ 
        success: false, 
        error: 'Email failed' 
      });

      await expect(processor.processEmailNotification(enhancedNotification as Notification)).rejects.toThrow();

      expect(mockNotificationService.markAsFailed).toHaveBeenCalledWith(
        'notif-1', 
        'Email failed'
      );
    });

    it('should handle processing errors', async () => {
      const enhancedNotification = {
        ...mockNotification,
        metadata: {
          travelTime: { duration: '10 min', distance: '1 km', success: true },
          location: { city: 'Test City' },
          placeDetails: mockPlaceDetails,
        },
      };

      mockEmailProvider.sendTouristNotification.mockRejectedValue(new Error('Network error'));

      await expect(processor.processEmailNotification(enhancedNotification as Notification)).rejects.toThrow();

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