import { Test, TestingModule } from '@nestjs/testing';
import { LocationHistoryService } from './location-history.service';

describe('LocationHistoryService', () => {
  let service: LocationHistoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LocationHistoryService],
    }).compile();

    service = module.get<LocationHistoryService>(LocationHistoryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
