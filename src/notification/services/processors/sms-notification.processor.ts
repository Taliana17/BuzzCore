import { Injectable, Logger } from '@nestjs/common';
import { Notification } from '../../entities/notification.entity';
import { NotificationService } from '../core/notification.service';
import { SmsTemplateService } from '../templates/sms-template.service';
import { SmsProvider } from '../providers/sms.provider';
import { SmsResult } from '../../interfaces/providers.interface';
import { isEnhancedSmsNotification, getSafeLocation, getSafeTravelTime } from '../../types/notification.types';

@Injectable()
export class SmsNotificationProcessor {
  private readonly logger = new Logger(SmsNotificationProcessor.name);

  constructor(
    private notificationService: NotificationService,
    private smsTemplateService: SmsTemplateService,
    private smsProvider: SmsProvider,
  ) {}

  async processSmsNotification(notification: Notification): Promise<void> {
    this.validateUserPhone(notification.user);

    try {
      let smsResult: SmsResult;
      
      if (isEnhancedSmsNotification(notification)) {
        smsResult = await this.processEnhancedTouristNotification(notification);
      } else {
        smsResult = await this.processBasicNotification(notification);
      }

      await this.handleSmsResult(notification, smsResult);
    } catch (error) {
      await this.handleSmsError(notification, error);
      throw error;
    }
  }

  private validateUserPhone(user: any): void {
    if (!user.phone) {
      throw new Error(`User ${user.id} has no phone number`);
    }
  }

  private async processEnhancedTouristNotification(notification: Notification): Promise<SmsResult> {
    // Usar type guard para acceso seguro
    const location = getSafeLocation(notification);
    const travelTime = getSafeTravelTime(notification);
    
    return await this.smsProvider.sendTouristNotification(
      notification.user.phone,
      notification.user.name || 'Usuario',
      location.city,
      notification.recommended_place,
      travelTime
    );
  }

  private async processBasicNotification(notification: Notification): Promise<SmsResult> {
    const message = this.smsTemplateService.buildBasicSmsMessage(
      notification.message, 
      notification.recommended_place
    );
    
    return await this.smsProvider.send(notification.user.phone, message);
  }

  private async handleSmsResult(notification: Notification, result: SmsResult): Promise<void> {
    if (!result.success) {
      throw new Error(result.error || 'Failed to send SMS');
    }
    
    await this.notificationService.updateStatus(notification.id, 'sent');
    this.logger.log(`SMS notification ${notification.id} sent successfully`);
  }

  private async handleSmsError(notification: Notification, error: Error): Promise<void> {
    await this.notificationService.markAsFailed(notification.id, error.message);
    this.logger.error(`Failed to process SMS notification ${notification.id}: ${error.message}`);
  }
}