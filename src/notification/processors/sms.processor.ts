import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../entities/notification.entity';
import { SmsProvider } from '../services/providers/sms.provider';

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
    private smsProvider: SmsProvider,
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
    let notification: Notification | null = null;

    try {
      // Fetch notification with user data
      notification = await this.notificationRepo.findOne({
        where: { id: notificationId },
        relations: ['user'],
      });

      if (!notification) {
        throw new Error(`Notification ${notificationId} not found`);
      }

      if (!notification.user.phone) {
        throw new Error(`User ${notification.user.id} has no phone number`);
      }

      this.logger.log(`📱 Processing SMS notification for user: ${notification.user.email}`);

      let smsResult;
      
      // Send tourist SMS if metadata available
      if (notification.metadata?.travelTime && notification.metadata?.location) {
        smsResult = await this.smsProvider.sendTouristNotification(
          notification.user.phone,
          notification.user.name || 'Usuario',
          notification.metadata.location.city || 'Ciudad',
          notification.recommended_place,
          notification.metadata.travelTime
        );
      } else {
        // Send basic SMS
        const message = this.buildBasicSmsMessage(
          notification.message, 
          notification.recommended_place
        );
        smsResult = await this.smsProvider.send(
          notification.user.phone,
          message
        );
      }

      if (!smsResult.success) {
        throw new Error(smsResult.error || 'Failed to send SMS');
      }

      // Update status to sent
      await this.notificationRepo.update(notificationId, { 
        status: 'sent',
        sent_at: new Date(),
      });

      this.logger.log(`SMS notification ${notificationId} sent successfully`);
      
      return { 
        success: true, 
        notificationId,
        sid: smsResult.sid
      };
    } catch (error) {
      this.logger.error(`Failed SMS notification ${notificationId}:`, error.message);

      // Update status to failed with error details
      await this.notificationRepo.update(notificationId, { 
        status: 'failed',
        metadata: {
          ...(notification?.metadata || {}),
          errorMessage: error.message,
          retryCount: job.attemptsMade,
        },
      });

      throw error; // Re-throw for BullMQ retry logic
    }
  }

  /**
   * Builds basic SMS message
   * 
   * @private
   * @description
   * Creates simple text message with:
   * - BuzzCore branding
   * - Notification message
   * - Place name with emoji
   * - Friendly closing
   * 
   * Used when full tourist notification metadata is not available.
   * 
   * @param {string} message - Notification message
   * @param {string} placeName - Recommended place name
   * @returns {string} Complete SMS text message
   * 
   * @example
   * ```typescript
   * buildBasicSmsMessage(
   *   "Te recomendamos este lugar increíble",
   *   "Museo del Oro"
   * )
   * // Returns:
   * // "BuzzCore Notification
   * //
   * // Te recomendamos este lugar increíble
   * //
   * // 📍 Museo del Oro
   * //
   * // ¡Disfruta tu experiencia!"
   * ```
   */
  private buildBasicSmsMessage(message: string, placeName: string): string {
    return `BuzzCore Notification\n\n${message}\n\n📍 ${placeName}\n\n¡Disfruta tu experiencia!`;
  }

  /**
   * Event hook for completed jobs
   * 
   * @description
   * Called automatically by BullMQ when a job completes successfully.
   * Logs job completion for monitoring.
   * 
   * @param {Job} job - Completed job
   */
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