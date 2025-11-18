import { Injectable, Logger } from '@nestjs/common';
import { Notification } from '../../entities/notification.entity';
import { NotificationService } from '../core/notification.service';
import { EmailTemplateService } from '../templates/email-template.service';
import { EmailProvider } from '../providers/email.provider';
import { EmailResult } from '../../interfaces/providers.interface';
import { isEnhancedTouristNotification, getSafeLocation, getSafeTravelTime, getSafePlaceDetails } from '../../types/notification.types';

@Injectable()
export class EmailNotificationProcessor {
  private readonly logger = new Logger(EmailNotificationProcessor.name);

  constructor(
    private notificationService: NotificationService,
    private emailTemplateService: EmailTemplateService,
    private emailProvider: EmailProvider,
  ) {}

  async processEmailNotification(notification: Notification): Promise<void> {
    try {
      let emailResult: EmailResult;
      
      if (isEnhancedTouristNotification(notification)) {
        emailResult = await this.processEnhancedTouristNotification(notification);
      } else {
        emailResult = await this.processBasicNotification(notification);
      }

      await this.handleEmailResult(notification, emailResult);
    } catch (error) {
      await this.handleEmailError(notification, error);
      throw error;
    }
  }

  private async processEnhancedTouristNotification(notification: Notification): Promise<EmailResult> {
    // Usar type guard para acceso seguro
    const location = getSafeLocation(notification);
    const travelTime = getSafeTravelTime(notification);
    const placeDetails = getSafePlaceDetails(notification);
    
    return await this.emailProvider.sendTouristNotification(
      notification.user.email,
      notification.user.name || 'Usuario',
      location.city,
      notification.recommended_place,
      placeDetails,
      travelTime
    );
  }

  private async processBasicNotification(notification: Notification): Promise<EmailResult> {
    const html = this.emailTemplateService.buildBasicEmailTemplate(
      notification.message,
      notification.recommended_place
    );
    
    return await this.emailProvider.send(
      notification.user.email,
      `${notification.recommended_place} - BuzzCore`,
      html
    );
  }

  private async handleEmailResult(notification: Notification, result: EmailResult): Promise<void> {
    if (!result.success) {
      throw new Error(result.error || 'Failed to send email');
    }
    
    await this.notificationService.updateStatus(notification.id, 'sent');
    this.logger.log(`Email notification ${notification.id} sent successfully`);
  }

  private async handleEmailError(notification: Notification, error: Error): Promise<void> {
    await this.notificationService.markAsFailed(notification.id, error.message);
    this.logger.error(`Failed to process email notification ${notification.id}: ${error.message}`);
  }
}