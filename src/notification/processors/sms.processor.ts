import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../entities/notification.entity';
import { SmsNotificationProcessor } from '../services/processors/sms-notification.processor';

@Injectable()
@Processor('sms-queue')
export class SmsProcessor extends WorkerHost {
  private readonly logger = new Logger(SmsProcessor.name);

  constructor(
    @InjectRepository(Notification)
    private notificationRepo: Repository<Notification>,
    private smsProcessor: SmsNotificationProcessor,
  ) {
    super();
  }

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

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(`Job ${job.id} failed:`, error.message);
  }
}