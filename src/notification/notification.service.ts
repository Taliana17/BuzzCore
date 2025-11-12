import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { User } from 'src/user/entities/user.entity';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
  ) {}

  async create(dto: CreateNotificationDto, user: User) {
    const notif = this.notificationRepo.create({ ...dto, user });
    return this.notificationRepo.save(notif);
  }

  async findAllByUser(userId: string) {
    return this.notificationRepo.find({
      where: { user: { id: userId } },
      relations: ['user'],
    });
  }
}
