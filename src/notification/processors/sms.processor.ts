import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../entities/notification.entity';
import { SmsProvider } from '../services/providers/sms.provider';

@Injectable()
@Processor('sms-queue')
export class SmsProcessor extends WorkerHost {
  private readonly logger = new Logger(SmsProcessor.name);

  constructor(
    @InjectRepository(Notification)
    private notificationRepo: Repository<Notification>,
    private smsProvider: SmsProvider,
  ) {
    super();
  }

  /**
   * Main processing method for SMS notification jobs
   * Handles both enhanced tourist notifications and basic SMS notifications
   */
  async process(job: Job<{ notificationId: string }>): Promise<any> {
    const { notificationId } = job.data;
    let notification: Notification | null = null;

    try {
      // Fetch notification with user relation for SMS sending
      notification = await this.notificationRepo.findOne({
        where: { id: notificationId },
        relations: ['user'],
      });

      if (!notification) {
        throw new Error(`Notification ${notificationId} not found`);
      }

      // Validate user has a phone number before attempting to send SMS
      if (!notification.user.phone) {
        throw new Error(`User ${notification.user.id} has no phone number`);
      }

      this.logger.log(`📱 Processing SMS notification for user: ${notification.user.email}`);

      let smsResult;
      
      // Determine SMS type based on available metadata
      if (notification.metadata?.travelTime && notification.metadata?.location) {
        // Enhanced tourist notification with travel time and location details
        smsResult = await this.smsProvider.sendTouristNotification(
          notification.user.phone,
          notification.user.name || 'Usuario',
          notification.metadata.location.city || 'Ciudad',
          notification.recommended_place,
          notification.metadata.travelTime
        );
      } else {
        // Basic SMS notification with simplified message
        const message = this.buildBasicSmsMessage(
          notification.message, 
          notification.recommended_place
        );
        smsResult = await this.smsProvider.send(
          notification.user.phone,
          message
        );
      }

      // Validate SMS sending result
      if (!smsResult.success) {
        throw new Error(smsResult.error || 'Failed to send SMS');
      }

      // Update notification status to sent
      await this.notificationRepo.update(notificationId, { 
        status: 'sent',
        sent_at: new Date(),
      });

      this.logger.log(`SMS notification ${notificationId} sent successfully`);
      
      return { 
        success: true, 
        notificationId,
        sid: smsResult.sid // Return SMS provider transaction ID for tracking
      };
    } catch (error) {
      this.logger.error(`Failed SMS notification ${notificationId}:`, error.message);

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

  private buildBasicSmsMessage(message: string, placeName: string): string {
    return `BuzzCore Notification\n\n${message}\n\n📍 ${placeName}\n\n¡Disfruta tu experiencia!`;
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`Job ${job.id} completed successfully`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(`Job ${job.id} failed:`, error.message);
  }
}