import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {}

  async findAll() {
    return this.notificationRepository.find({ relations: ['user', 'channel'] });
  }

  async findOne(id: number) {
    return this.notificationRepository.findOne({
      where: { id },
      relations: ['user', 'channel', 'logs'],
    });
  }

  async create(dto: CreateNotificationDto) {
    const notification = this.notificationRepository.create({
      ...dto,
      status: 'pendiente',
    });
    return this.notificationRepository.save(notification);
  }
}
