import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../../entities/notification.entity';
import { NotificationStats } from '../../types/notification.types';

@Injectable()
export class NotificationStatisticsService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepo: Repository<Notification>,
  ) {}

  async getNotificationStats(userId: string): Promise<NotificationStats> {
    const notifications = await this.notificationRepo.find({
      where: { user: { id: userId } }
    });
    
    const total = notifications.length;
    const sent = notifications.filter(n => n.status === 'sent').length;
    const failed = notifications.filter(n => n.status === 'failed').length;
    const pending = notifications.filter(n => n.status === 'pending').length;
    const emailCount = notifications.filter(n => n.channel === 'email').length;
    const smsCount = notifications.filter(n => n.channel === 'sms').length;

    return {
      total,
      sent,
      failed,
      pending,
      by_channel: {
        email: emailCount,
        sms: smsCount
      },
      success_rate: total > 0 ? (sent / total * 100).toFixed(1) + '%' : '0%'
    };
  }
}