import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Notification } from '../entities/notification.entity';

@Injectable()
export class NotificationQueueService {
  private readonly logger = new Logger(NotificationQueueService.name);

  constructor(
    @InjectQueue('email-queue') private emailQueue: Queue,
    @InjectQueue('sms-queue') private smsQueue: Queue,
  ) {}

  /**
   * Enqueues a notification for processing by the appropriate channel
   * @param notification - The notification entity to be processed
   * @param preferredChannel - The preferred delivery channel ('email' or 'sms')
   * @returns The created job instance
   */
  async enqueueNotification(notification: Notification, preferredChannel: 'email' | 'sms') {
    const queue = preferredChannel === 'email' ? this.emailQueue : this.smsQueue;
    
    const job = await queue.add(
      'send-notification',
      {
        notificationId: notification.id,
        channel: preferredChannel,
      },
      {
        attempts: 3, // Maximum number of retry attempts
        backoff: {
          type: 'exponential', // Exponential backoff strategy for retries
          delay: 1000, // Initial delay of 1 second
        },
        removeOnComplete: 20, // Keep last 20 completed jobs for monitoring
        removeOnFail: 50, // Keep last 50 failed jobs for debugging
      },
    );

    this.logger.log(`Job ${job.id} added to ${preferredChannel}-queue for notification ${notification.id}`);
    return job;
  }

  /**
   * Retrieves statistics for both email and SMS queues
   * @returns Object containing job counts for each queue
   */
  async getQueueStats() {
    const [emailStats, smsStats] = await Promise.all([
      this.emailQueue.getJobCounts(),
      this.smsQueue.getJobCounts(),
    ]);

    return { email: emailStats, sms: smsStats };
  }
}