import { Test, TestingModule } from '@nestjs/testing';
import { NotificationLogController } from './notification-log.controller';

describe('NotificationLogController', () => {
  let controller: NotificationLogController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationLogController],
    }).compile();

    controller = module.get<NotificationLogController>(NotificationLogController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
