import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationLog } from './entities/notification-log.entity';

@Injectable()
export class NotificationLogService {
  constructor(
    @InjectRepository(NotificationLog)
    private readonly logRepository: Repository<NotificationLog>,
  ) {}

  findAll() {
    return this.logRepository.find({ relations: ['notification'] });
  }

  findOne(id: number) {
    return this.logRepository.findOne({ where: { id }, relations: ['notification'] });
  }

  create(data: any) {
    const log = this.logRepository.create(data);
    return this.logRepository.save(log);
  }
}
