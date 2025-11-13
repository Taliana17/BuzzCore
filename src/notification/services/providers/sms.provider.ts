import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Twilio from 'twilio';

export interface SmsResult {
  sid?: string;
  success: boolean;
  error?: string;
}

@Injectable()
export class SmsProvider {
  private readonly logger = new Logger(SmsProvider.name);
  private twilioClient: any;
  private isInitialized: boolean = false;

  constructor(private configService: ConfigService) {
    this.initializeTwilio();
  }

  private initializeTwilio() {
    const accountSid = this.configService.get('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get('TWILIO_AUTH_TOKEN');
    const twilioPhone = this.configService.get('TWILIO_PHONE_NUMBER');

    if (!accountSid || !authToken) {
      this.logger.warn('Twilio credentials not found - SMS disabled');
      return;
    }

    try {
      this.twilioClient = Twilio(accountSid, authToken);
      this.isInitialized = true;
      this.logger.log('Twilio SMS provider initialized');
    } catch (error) {
      this.logger.error('Failed to initialize Twilio:', error.message);
    }
  }

  async send(to: string, message: string): Promise<SmsResult> {
    if (!this.isInitialized) {
      const error = 'Twilio not configured';
      this.logger.error(error);
      return { success: false, error };
    }

    const twilioPhone = this.configService.get('TWILIO_PHONE_NUMBER');

    try {
      this.logger.debug(`Attempting SMS to: ${to}`);
      
      const result = await this.twilioClient.messages.create({
        body: message,
        from: twilioPhone,
        to: this.formatPhoneNumber(to),
      });

      this.logger.log(`SMS sent to ${to}, SID: ${result.sid}`);
      
      return { 
        success: true, 
        sid: result.sid 
      };
    } catch (error) {
      this.logger.error(`SMS failed to ${to}:`, error.message);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  async sendNotificationSms(to: string, message: string, placeName: string): Promise<SmsResult> {
    if (!to) {
      return { success: false, error: 'Phone number required' };
    }

    const smsMessage = this.buildNotificationMessage(message, placeName);
    this.logger.log(`Sending notification SMS to: ${to}`);
    
    return this.send(to, smsMessage);
  }

  private buildNotificationMessage(message: string, placeName: string): string {
    const baseMessage = `BuzzCore Notification\n\n${message}\n\n📍 ${placeName}\n\n¡Disfruta tu experiencia!`;
    
    // Limitar a 160 caracteres para SMS
    return baseMessage.length <= 160 ? baseMessage : baseMessage.substring(0, 157) + '...';
  }

  private formatPhoneNumber(phone: string): string {
    if (!phone) throw new Error('Phone number required');

    const cleaned = phone.replace(/\s+/g, '').replace(/-/g, '');

    if (cleaned.startsWith('+')) return cleaned;
    if (cleaned.startsWith('0')) return `+57${cleaned.substring(1)}`;
    if (/^\d+$/.test(cleaned)) return `+57${cleaned}`;

    return cleaned;
  }

  getStatus() {
    const accountSid = this.configService.get('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get('TWILIO_AUTH_TOKEN');
    
    return {
      initialized: this.isInitialized,
      hasCredentials: !!(accountSid && authToken),
    };
  }
}