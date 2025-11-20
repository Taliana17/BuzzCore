import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SmsProvider } from './sms.provider';

describe('SmsProvider', () => {
  let provider: SmsProvider;
  let mockConfigService: any;

  beforeEach(async () => {
    mockConfigService = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SmsProvider,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    provider = module.get<SmsProvider>(SmsProvider);
  });

  describe('validatePhoneNumber', () => {
    it('should validate Colombian phone numbers', () => {
      expect(provider.validatePhoneNumber('+573001234567')).toBe(true);
      expect(provider.validatePhoneNumber('3001234567')).toBe(true);
      expect(provider.validatePhoneNumber('573001234567')).toBe(true);
    });

    it('should reject invalid phone numbers', () => {
      expect(provider.validatePhoneNumber('')).toBe(false);
      expect(provider.validatePhoneNumber('invalid')).toBe(false);
      expect(provider.validatePhoneNumber('123')).toBe(false);
      expect(provider.validatePhoneNumber('123456')).toBe(false); // Número muy corto
      expect(provider.validatePhoneNumber('1234567890123456')).toBe(false); // Número muy largo
    });
  });

  describe('getStatus', () => {
    it('should return provider status with valid credentials', () => {
      mockConfigService.get
        .mockReturnValueOnce('AC123')
        .mockReturnValueOnce('auth123')
        .mockReturnValueOnce('+123456789');

      const status = provider.getStatus();

      expect(status.service).toBe('Twilio');
      expect(status.hasValidCredentials).toBe(true);
      expect(status.hasValidPhone).toBe(true);
    });

    it('should return provider status with invalid credentials', () => {
      mockConfigService.get.mockReturnValue('');
      
      const status = provider.getStatus();

      expect(status.initialized).toBe(false);
      expect(status.hasValidCredentials).toBe(false);
    });
  });

  describe('sendTouristNotification', () => {
    it('should handle send failure when not configured', async () => {
      const result = await provider.sendTouristNotification(
        '+573001234567',
        'Test User',
        'Bogotá',
        'Test Place',
        { duration: '15 min', distance: '1.2 km', success: true }
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Twilio not configured');
    });
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});