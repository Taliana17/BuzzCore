import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Notification } from '../entities/notification.entity';

/**
 * Notification Queue Service using BullMQ
 * 
 * @description
 * Manages asynchronous notification processing using BullMQ queues.
 * Separates email and SMS notifications into dedicated queues for:
 * - Better scalability and performance
 * - Independent retry strategies
 * - Separate rate limiting
 * - Isolated failure handling
 * 
 * Queue configuration:
 * - 3 retry attempts with exponential backoff
 * - Keeps last 20 completed jobs
 * - Keeps last 50 failed jobs for debugging
 * 
 * @export
 * @class NotificationQueueService
 */
@Injectable()
export class NotificationQueueService {
  private readonly logger = new Logger(NotificationQueueService.name);

  /**
   * Creates an instance of NotificationQueueService
   * 
   * @param {Queue} emailQueue - BullMQ queue for email notifications
   * @param {Queue} smsQueue - BullMQ queue for SMS notifications
   */
  constructor(
    @InjectQueue('email-queue') private emailQueue: Queue,
    @InjectQueue('sms-queue') private smsQueue: Queue,
  ) {}

  /**
   * Adds notification to appropriate queue for async processing
   * 
   * @description
   * Enqueues notification job with the following configuration:
   * - Job name: 'send-notification'
   * - Retry attempts: 3
   * - Backoff strategy: Exponential (1s initial delay)
   * - Auto-cleanup: 20 completed, 50 failed jobs retained
   * 
   * The job will be processed by the corresponding processor (EmailProcessor or SmsProcessor).
   * 
   * @param {Notification} notification - Notification entity to be sent
   * @param {('email' | 'sms')} preferredChannel - Notification channel
   * @returns {Promise<Job>} BullMQ job object with job ID
   * 
   * @example
   * ```typescript
   * const job = await notificationQueueService.enqueueNotification(
   *   notification,
   *   'email'
   * );
   * console.log(`Job ${job.id} queued`);
   * ```
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

  /**
   * Retrieves statistics for both queues
   * 
   * @description
   * Returns job counts for email and SMS queues including:
   * - waiting: Jobs waiting to be processed
   * - active: Jobs currently being processed
   * - completed: Successfully completed jobs
   * - failed: Jobs that failed after all retry attempts
   * - delayed: Jobs scheduled for future execution
   * 
   * Useful for monitoring queue health and debugging issues.
   * 
   * @returns {Promise<{email: Object, sms: Object}>} Queue statistics for both channels
   * 
   * @example
   * ```typescript
   * const stats = await notificationQueueService.getQueueStats();
   * console.log('Email queue:', stats.email.waiting, 'waiting');
   * console.log('SMS queue:', stats.sms.completed, 'completed');
   * ```
   */
  async getQueueStats() {
    const [emailStats, smsStats] = await Promise.all([
      this.emailQueue.getJobCounts(),
      this.smsQueue.getJobCounts(),
    ]);

    return { email: emailStats, sms: smsStats };
  }
}