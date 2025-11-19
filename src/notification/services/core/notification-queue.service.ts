import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Notification } from '../../entities/notification.entity';

@Injectable()
export class NotificationQueueService {
  private readonly logger = new Logger(NotificationQueueService.name);

  constructor(
    @InjectQueue('email-queue') private emailQueue: Queue,
    @InjectQueue('sms-queue') private smsQueue: Queue,
  ) {}

  async enqueueNotification(notification: Notification, preferredChannel: 'email' | 'sms') {
    const queue = preferredChannel === 'email' ? this.emailQueue : this.smsQueue;
    
    const job = await queue.add(
      'send-notification',
      {
        notificationId: notification.id,
        channel: preferredChannel,
      },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        removeOnComplete: 20,
        removeOnFail: 50,
      },
    );

    this.logger.log(`Job ${job.id} added to ${preferredChannel}-queue for notification ${notification.id}`);
    return job;
  }

  async getQueueStats() {
    const [emailStats, smsStats] = await Promise.all([
      this.emailQueue.getJobCounts(),
      this.smsQueue.getJobCounts(),
    ]);

    return { email: emailStats, sms: smsStats };
  }
}