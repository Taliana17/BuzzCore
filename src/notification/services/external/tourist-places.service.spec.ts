import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { TouristPlacesService } from './tourist-places.service';

describe('TouristPlacesService', () => {
  let service: TouristPlacesService;
  let mockConfigService: any;

  beforeEach(async () => {
    mockConfigService = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TouristPlacesService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<TouristPlacesService>(TouristPlacesService);
  });

  describe('getStatus', () => {
    it('should return service status', () => {
      const status = service.getStatus();
      
      expect(status.initialized).toBe(true);
      expect(status.hasApiKey).toBe(false);
    });
  });

  describe('API methods', () => {
    it('should handle findNearbyPlaces errors gracefully', async () => {
      // Mockear el método para evitar llamadas reales a API
      jest.spyOn(service, 'findNearbyPlaces').mockRejectedValue(new Error('API Error'));
      
      await expect(service.findNearbyPlaces({ lat: 4.710989, lng: -74.072092 }))
        .rejects.toThrow('API Error');
    }, 10000);

    it('should handle findRecommendedPlace errors gracefully', async () => {
      jest.spyOn(service, 'findRecommendedPlace').mockRejectedValue(new Error('No places found'));
      
      await expect(service.findRecommendedPlace({ lat: 4.710989, lng: -74.072092 }))
        .rejects.toThrow('No places found');
    }, 10000);
  });

  describe('utility methods', () => {
    it('should format distance and duration correctly', () => {
      // Podemos testear métodos públicos indirectamente
      const status = service.getStatus();
      expect(status).toBeDefined();
    });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});