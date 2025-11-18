import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../entities/notification.entity';
import { EmailProvider } from '../services/providers/email.provider';

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
    private emailProvider: EmailProvider,
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

      let emailResult;
      
      // Send tourist notification if metadata available
      if (notification.metadata?.travelTime && notification.metadata?.location && notification.metadata?.placeDetails) {
        emailResult = await this.emailProvider.sendTouristNotification(
          notification.user.email,
          notification.user.name || 'Usuario',
          notification.metadata.location.city || 'Ciudad',
          notification.recommended_place,
          notification.metadata.placeDetails,
          notification.metadata.travelTime
        );
      } else {
        // Send basic notification
        const html = this.buildBasicEmailTemplate(
          notification.message,
          notification.recommended_place
        );
      
        emailResult = await this.emailProvider.send(
          notification.user.email,
          `${notification.recommended_place} - BuzzCore`,
          html
        );
      }

      if (!emailResult.success) {
        throw new Error(emailResult.error || 'Failed to send email');
      }

      // Update status to sent
      await this.notificationRepo.update(notificationId, { 
        status: 'sent',
        sent_at: new Date(),
      });

      this.logger.log(`Email notification ${notificationId} sent successfully`);
      
      return { success: true, notificationId };
    } catch (error) {
      this.logger.error(`Failed to process email notification ${notificationId}: ${error.message}`);

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
   * Builds basic HTML email template
   * 
   * @private
   * @description
   * Creates simple responsive email with:
   * - Gradient header
   * - Message content
   * - Place name card
   * - Styled layout
   * 
   * Used when full tourist notification metadata is not available.
   * 
   * @param {string} message - Notification message
   * @param {string} placeName - Recommended place name
   * @returns {string} Complete HTML email template
   */
  private buildBasicEmailTemplate(message: string, placeName: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { padding: 30px; background: #f9f9f9; border-radius: 0 0 10px 10px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>BuzzCore Notification</h1>
  </div>
  
  <div class="content">
    <h2>¡Hola!</h2>
    <p>${message}</p>
    
    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="color: #667eea; margin-top: 0;">📍 ${placeName}</h3>
      <p><strong>Ubicación:</strong> Próxima a tu área actual</p>
    </div>
    
    <p>¡Esperamos que disfrutes esta recomendación!</p>
  </div>
</body>
</html>`;
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
    this.logger.error(`Job ${job.id} failed: ${error.message}`);
  }
}