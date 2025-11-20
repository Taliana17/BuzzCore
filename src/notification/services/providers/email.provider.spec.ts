import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EmailProvider } from './email.provider';

describe('EmailProvider', () => {
  let provider: EmailProvider;
  let mockConfigService: any;

  beforeEach(async () => {
    mockConfigService = {
      get: jest.fn().mockReturnValue('mock-key'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailProvider,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    provider = module.get<EmailProvider>(EmailProvider);
  });

  describe('getStatus', () => {
    it('should return provider status with invalid API key', () => {
      const status = provider.getStatus();

      expect(status.initialized).toBe(false);
      expect(status.service).toBe('Resend');
      expect(status.hasValidApiKey).toBe(false);
    });

    it('should return provider status with valid API key', () => {
      mockConfigService.get.mockReturnValue('re_valid_key_123');
      const providerWithValidKey = new EmailProvider(mockConfigService);
      
      const status = providerWithValidKey.getStatus();

      expect(status.service).toBe('Resend');
      expect(status.hasValidApiKey).toBe(true);
    });
  });

  describe('sendTouristNotification', () => {
    it('should handle send failure when not configured', async () => {
      const result = await provider.sendTouristNotification(
        'test@example.com',
        'Test User',
        'Bogotá',
        'Test Place',
        {
          formatted_address: 'Test Address',
          rating: 4.5,
          opening_hours: { open_now: true }
        },
        { duration: '10 min', distance: '1 km', success: true }
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Resend not configured');
    });
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});