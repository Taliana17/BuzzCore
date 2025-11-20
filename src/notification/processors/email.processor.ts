import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../entities/notification.entity';
import { EmailNotificationProcessor } from '../services/processors/email-notification.processor';

/**
 * BullMQ Email Processor
 * 
 * @description
 * Processes email notification jobs from the 'email-queue'.
 * Handles two types of email notifications:
 * 1. Rich tourist notifications with place details and travel time
 * 2. Basic notifications with simple HTML template
 * 
 * Features:
 * - Automatic retry on failure (configured in queue)
 * - Status tracking (pending → sent/failed)
 * - Error logging with retry count
 * - Event hooks for completed/failed jobs
 * 
 * @export
 * @class EmailProcessor
 * @extends {WorkerHost}
 */
@Injectable()
@Processor('email-queue')
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);

  /**
   * Creates an instance of EmailProcessor
   * 
   * @param {Repository<Notification>} notificationRepo - Notification repository for status updates
   * @param {EmailProvider} emailProvider - Email sending provider (Resend)
   */
  constructor(
    @InjectRepository(Notification)
    private notificationRepo: Repository<Notification>,
    private emailProcessor: EmailNotificationProcessor,
  ) {
    super();
  }

  /**
   * Processes email notification job
   * 
   * @description
   * Main processing logic:
   * 1. Fetches notification with user relation
   * 2. Determines email type (tourist vs basic)
   * 3. Sends email via EmailProvider
   * 4. Updates notification status to 'sent'
   * 5. Logs error and updates status to 'failed' on failure
   * 
   * If job fails, BullMQ will automatically retry based on queue configuration
   * (3 attempts with exponential backoff).
   * 
   * @param {Job<{notificationId: string, channel: string}>} job - BullMQ job containing notification ID
   * @returns {Promise<{success: boolean, notificationId: string}>} Processing result
   * @throws {Error} If notification not found or email sending fails
   * 
   * @example
   * ```typescript
   * // This method is called automatically by BullMQ
   * // Job data: { notificationId: '123', channel: 'email' }
   * ```
   */
  async process(job: Job<{ notificationId: string; channel: string }>): Promise<any> {
    const { notificationId } = job.data;

    try {
      const notification = await this.notificationRepo.findOne({
        where: { id: notificationId },
        relations: ['user'],
      });

      if (!notification) {
        throw new Error(`Notification ${notificationId} not found`);
      }

      await this.emailProcessor.processEmailNotification(notification);

      return { success: true, notificationId };
    } catch (error) {
      this.logger.error(`Failed to process email notification ${notificationId}: ${error.message}`);
      throw error;
    }
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`Job ${job.id} completed successfully`);
  }

  /**
   * Event hook for failed jobs
   * 
   * @description
   * Called automatically by BullMQ when a job fails after all retry attempts.
   * Logs failure details for debugging.
   * 
   * @param {Job} job - Failed job
   * @param {Error} error - Error that caused the failure
   */
  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(`Job ${job.id} failed: ${error.message}`);
  }
}