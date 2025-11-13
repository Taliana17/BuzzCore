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

  async process(job: Job<{ notificationId: string }>): Promise<any> {
    const { notificationId } = job.data;
    let notification: Notification | null = null;

    try {
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
      
      if (notification.metadata?.travelTime && notification.metadata?.location) {
        smsResult = await this.smsProvider.sendTouristNotification(
          notification.user.phone,
          notification.user.name || 'Usuario',
          notification.metadata.location.city || 'Ciudad',
          notification.recommended_place,
          notification.metadata.travelTime
        );
      } else {
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

      await this.notificationRepo.update(notificationId, { 
        status: 'failed',
        metadata: {
          ...(notification?.metadata || {}),
          errorMessage: error.message,
          retryCount: job.attemptsMade,
        },
      });

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