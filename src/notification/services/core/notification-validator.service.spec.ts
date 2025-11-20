import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { NotificationValidator } from './notification-validator.service';
import { ReceiveLocationDto } from '../../dto/receive-location.dto';
import { CreateNotificationDto } from '../../dto/create-notification.dto';

describe('NotificationValidator', () => {
  let validator: NotificationValidator;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NotificationValidator],
    }).compile();

    validator = module.get<NotificationValidator>(NotificationValidator);
  });

  describe('validateLocationData', () => {
    it('should validate correct coordinates', () => {
      const dto: ReceiveLocationDto = { lat: 40.7128, lng: -74.0060 };
      expect(() => validator.validateLocationData(dto)).not.toThrow();
    });

    it('should throw for invalid latitude', () => {
      const dto: ReceiveLocationDto = { lat: 100, lng: -74.0060 };
      expect(() => validator.validateLocationData(dto)).toThrow(BadRequestException);
    });

    it('should throw for invalid longitude', () => {
      const dto: ReceiveLocationDto = { lat: 40.7128, lng: -200 };
      expect(() => validator.validateLocationData(dto)).toThrow(BadRequestException);
    });
  });

  describe('validateNotificationData', () => {
    it('should validate correct notification data', () => {
      const dto: CreateNotificationDto = {
        message: 'Test message',
        recommended_place: 'Test place',
        channel: 'email',
        location_data: {
          city: 'Test City',
          coordinates: { lat: 40.7128, lng: -74.0060 }
        }
      };
      expect(() => validator.validateNotificationData(dto)).not.toThrow();
    });

    it('should throw for missing coordinates', () => {
      const dto: CreateNotificationDto = {
        message: 'Test message',
        recommended_place: 'Test place',
        channel: 'email',
        location_data: { city: 'Test City' }
      } as any;
      expect(() => validator.validateNotificationData(dto)).toThrow(BadRequestException);
    });
  });

  describe('validateUserPhone', () => {
    it('should throw for empty phone number', () => {
      expect(() => validator.validateUserPhone('')).toThrow(BadRequestException);
    });

    it('should not throw for valid phone number', () => {
      expect(() => validator.validateUserPhone('+573001234567')).not.toThrow();
    });
  });
});