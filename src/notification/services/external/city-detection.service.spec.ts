import { Test, TestingModule } from '@nestjs/testing';
import { CityDetectionService } from './city-detection.service';

describe('CityDetectionService', () => {
  let service: CityDetectionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CityDetectionService],
    }).compile();

    service = module.get<CityDetectionService>(CityDetectionService);
  });

  describe('detectCity', () => {
    it('should validate coordinates correctly', () => {
      expect(service.validateCoordinates({ lat: 40.7128, lng: -74.0060 })).toBe(true);
      expect(service.validateCoordinates({ lat: 100, lng: -74.0060 })).toBe(false);
    });

    it('should return service status', () => {
      const status = service.getStatus();
      expect(status.available).toBe(true);
      expect(status.service).toBe('OpenStreetMap Nominatim');
    });
  });

  // Note: Integration tests for detectCity would be in a separate file
  // since they make actual API calls
});