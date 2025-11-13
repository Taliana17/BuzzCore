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

  async process(job: Job<{ notificationId: string; channel: string }>): Promise<any> {
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

      // Enviar email
      await this.emailProvider.sendNotificationEmail(
        notification.user.email,
        notification.message,
        notification.recommended_place,
        notification.metadata?.placeDetails,
      );

      // Actualizar estado
      await this.notificationRepo.update(notificationId, { 
        status: 'sent',
        sent_at: new Date(),
      });

      this.logger.log(`Email notification ${notificationId} sent successfully`);
      
      return { success: true, notificationId };
    } catch (error) {
      this.logger.error(`Failed to process email notification ${notificationId}: ${error.message}`);

      // Actualizar estado a fallido - CORRECCIÓN AQUÍ
      await this.notificationRepo.update(notificationId, { 
        status: 'failed',
        metadata: {
          ...(notification?.metadata || {}), // Usar el notification definido arriba
          errorMessage: error.message,
          retryCount: job.attemptsMade,
        },
      });

      throw error;
    }
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`Job ${job.id} completed successfully`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(`Job ${job.id} failed: ${error.message}`);
  }
}