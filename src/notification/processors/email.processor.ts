import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../entities/notification.entity';
import { EmailProvider } from '../services/providers/email.provider';

@Injectable()
@Processor('email-queue')
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(
    @InjectRepository(Notification)
    private notificationRepo: Repository<Notification>,
    private emailProvider: EmailProvider,
  ) {
    super();
  }

  /**
   * Main processing method for email notification jobs
   * Handles both enhanced tourist notifications and basic notifications
   */
  async process(job: Job<{ notificationId: string; channel: string }>): Promise<any> {
    const { notificationId } = job.data;
    let notification: Notification | null = null;

    try {
      // Fetch notification with user relation for email sending
      notification = await this.notificationRepo.findOne({
        where: { id: notificationId },
        relations: ['user'],
      });

      if (!notification) {
        throw new Error(`Notification ${notificationId} not found`);
      }

      let emailResult;
      
      // Determine email type based on available metadata
      if (notification.metadata?.travelTime && notification.metadata?.location && notification.metadata?.placeDetails) {
        // Enhanced tourist notification with travel details
        emailResult = await this.emailProvider.sendTouristNotification(
          notification.user.email,
          notification.user.name || 'Usuario',
          notification.metadata.location.city || 'Ciudad',
          notification.recommended_place,
          notification.metadata.placeDetails,
          notification.metadata.travelTime
        );
      } else {
        // Basic notification with simple template
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

      // Validate email sending result
      if (!emailResult.success) {
        throw new Error(emailResult.error || 'Failed to send email');
      }

      // Update notification status to sent
      await this.notificationRepo.update(notificationId, { 
        status: 'sent',
        sent_at: new Date(),
      });

      this.logger.log(`Email notification ${notificationId} sent successfully`);
      
      return { success: true, notificationId };
    } catch (error) {
      this.logger.error(`Failed to process email notification ${notificationId}: ${error.message}`);

      // Update notification status to failed with error details
      await this.notificationRepo.update(notificationId, { 
        status: 'failed',
        metadata: {
          ...(notification?.metadata || {}),
          errorMessage: error.message,
          retryCount: job.attemptsMade,
        },
      });

      // Re-throw error to trigger BullMQ retry mechanism
      throw error;
    }
  }

  /**
   * Builds a basic HTML email template for notifications
   * @param message - The notification message content
   * @param placeName - The name of the recommended place
   * @returns HTML string for the email template
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
   * Event handler for completed jobs
   * @param job - The completed job instance
   */
  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`Job ${job.id} completed successfully`);
  }

  /**
   * Event handler for failed jobs
   * @param job - The failed job instance
   * @param error - The error that caused the failure
   */
  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(`Job ${job.id} failed: ${error.message}`);
  }
}