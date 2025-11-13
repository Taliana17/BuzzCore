import { Test, TestingModule } from '@nestjs/testing';
import { LocationHistoryController } from './location-history.controller';

describe('LocationHistoryController', () => {
  let controller: LocationHistoryController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LocationHistoryController],
    }).compile();

    controller = module.get<LocationHistoryController>(LocationHistoryController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
