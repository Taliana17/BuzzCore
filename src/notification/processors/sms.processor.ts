import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../entities/notification.entity';
import { SmsNotificationProcessor } from '../services/processors/sms-notification.processor';

/**
 * BullMQ SMS Processor
 * 
 * @description
 * Processes SMS notification jobs from the 'sms-queue'.
 * Handles two types of SMS notifications:
 * 1. Rich tourist notifications with travel time and location details
 * 2. Basic SMS notifications with simple text message
 * 
 * Features:
 * - Automatic retry on failure (configured in queue)
 * - Status tracking (pending → sent/failed)
 * - Error logging with retry count
 * - Phone number validation
 * - Event hooks for completed/failed jobs
 * 
 * @export
 * @class SmsProcessor
 * @extends {WorkerHost}
 */
@Injectable()
@Processor('sms-queue')
export class SmsProcessor extends WorkerHost {
  private readonly logger = new Logger(SmsProcessor.name);

  /**
   * Creates an instance of SmsProcessor
   * 
   * @param {Repository<Notification>} notificationRepo - Notification repository for status updates
   * @param {SmsProvider} smsProvider - SMS sending provider (Twilio)
   */
  constructor(
    @InjectRepository(Notification)
    private notificationRepo: Repository<Notification>,
    private smsProcessor: SmsNotificationProcessor,
  ) {
    super();
  }

  /**
   * Processes SMS notification job
   * 
   * @description
   * Main processing logic:
   * 1. Fetches notification with user relation
   * 2. Validates user has phone number
   * 3. Determines SMS type (tourist vs basic)
   * 4. Sends SMS via SmsProvider (Twilio)
   * 5. Updates notification status to 'sent'
   * 6. Logs error and updates status to 'failed' on failure
   * 
   * If job fails, BullMQ will automatically retry based on queue configuration
   * (3 attempts with exponential backoff).
   * 
   * @param {Job<{notificationId: string}>} job - BullMQ job containing notification ID
   * @returns {Promise<{success: boolean, notificationId: string, sid: string}>} Processing result with Twilio SID
   * @throws {Error} If notification not found, user has no phone, or SMS sending fails
   * 
   * @example
   * ```typescript
   * // This method is called automatically by BullMQ
   * // Job data: { notificationId: '123' }
   * // Returns: { success: true, notificationId: '123', sid: 'SM...' }
   * ```
   */
  async process(job: Job<{ notificationId: string }>): Promise<any> {
    const { notificationId } = job.data;

    try {
      const notification = await this.notificationRepo.findOne({
        where: { id: notificationId },
        relations: ['user'],
      });

      if (!notification) {
        throw new Error(`Notification ${notificationId} not found`);
      }

      await this.smsProcessor.processSmsNotification(notification);

      return { 
        success: true, 
        notificationId
      };
    } catch (error) {
      this.logger.error(`Failed SMS notification ${notificationId}:`, error.message);
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
    this.logger.error(`Job ${job.id} failed:`, error.message);
  }
}