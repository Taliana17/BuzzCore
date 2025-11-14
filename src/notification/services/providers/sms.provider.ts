import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Twilio from 'twilio';
import { SmsResult, TravelTime } from '../../types/notification.types';

@Injectable()
export class SmsProvider {
  private readonly logger = new Logger(SmsProvider.name);
  private twilioClient: any;
  private isInitialized: boolean = false;

  constructor(private configService: ConfigService) {
    this.initializeTwilio();
  }

  /**
   * Initializes the Twilio SMS client with credential validation
   * Validates account SID, auth token, and phone number format
   */
  private initializeTwilio() {
    const accountSid = this.configService.get('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get('TWILIO_AUTH_TOKEN');
    const twilioPhone = this.configService.get('TWILIO_PHONE_NUMBER');

    // Validate Twilio Account SID format
    if (!accountSid || !accountSid.startsWith('AC')) {
      this.logger.error('INVALID TWILIO_ACCOUNT_SID');
      return;
    }

    // Validate Auth Token length and presence
    if (!authToken || authToken.length < 20) {
      this.logger.error('INVALID TWILIO_AUTH_TOKEN');
      return;
    }

    // Validate Twilio phone number format
    if (!twilioPhone || !twilioPhone.startsWith('+')) {
      this.logger.error('INVALID TWILIO_PHONE_NUMBER');
      return;
    }

    try {
      this.twilioClient = Twilio(accountSid, authToken);
      this.isInitialized = true;
      this.logger.log('Twilio SMS Provider INITIALIZED FOR PRODUCTION');
      this.logger.log(`   Twilio Number: ${twilioPhone}`);
    } catch (error) {
      this.logger.error('TWILIO INITIALIZATION FAILED:', error.message);
    }
  }

  /**
   * Sends an SMS message using Twilio service
   * @param to - Recipient phone number
   * @param message - SMS message content
   * @returns Promise with SMS sending result
   */
  async send(to: string, message: string): Promise<SmsResult> {
    if (!this.isInitialized) {
      const error = 'Twilio not configured - Please verify credentials';
      this.logger.error(error);
      return { success: false, error };
    }

    const twilioPhone = this.configService.get('TWILIO_PHONE_NUMBER');

    try {
      const formattedTo = this.formatPhoneNumber(to);
      
      this.logger.log(`SENDING PRODUCTION SMS to: ${formattedTo}`);
      
      const result = await this.twilioClient.messages.create({
        body: message,
        from: twilioPhone,
        to: formattedTo,
      });

      this.logger.log(`PRODUCTION SMS SENT to: ${formattedTo}`);
      this.logger.log(`SID: ${result.sid}, Status: ${result.status}`);
      
      return { 
        success: true, 
        sid: result.sid 
      };
    } catch (error) {
      this.logger.error(`PRODUCTION SMS FAILED for ${to}:`, error.message);
      return { 
        success: false, 
        error: this.getErrorMessage(error) 
      };
    }
  }

  /**
   * Sends a specialized tourist notification SMS with travel information
   * @param to - Recipient phone number
   * @param userName - Name of the recipient
   * @param city - City where the recommendation is located
   * @param placeName - Name of the recommended place
   * @param travelTime - Travel time and distance information
   * @returns Promise with SMS sending result
   */
  async sendTouristNotification(
    to: string, 
    userName: string,
    city: string,
    placeName: string,
    travelTime: TravelTime 
  ): Promise<SmsResult> {
    
    const smsMessage = this.buildTouristNotificationMessage(
      userName,
      city,
      placeName, 
      travelTime
    );
    
    this.logger.log(`SENDING PRODUCTION TOURIST SMS NOTIFICATION to: ${to}`);
    return this.send(to, smsMessage);
  }

  /**
   * Builds an SMS message for tourist notifications with travel details
   * @param userName - Name of the recipient
   * @param city - City where the recommendation is located
   * @param placeName - Name of the recommended place
   * @param travelTime - Travel time and distance information
   * @returns Formatted SMS message string
   */
  private buildTouristNotificationMessage(
    userName: string,
    city: string,
    placeName: string,
    travelTime: TravelTime
  ): string {
    const baseMessage = `Hello ${userName}! \n\nWelcome to ${city}. We recommend visiting:\n\n${placeName}\n\n`;
    
    const travelInfo = travelTime.success ? 
      `🚶 ${travelTime.duration} (${travelTime.distance})\n\n` : 
      '📍 Near your location\n\n';
    
    const footer = `Enjoy your visit to ${city}!\n\n- BuzzCore Tourism`;
    
    const fullMessage = baseMessage + travelInfo + footer;
    
    // Ensure message length doesn't exceed SMS limits
    if (fullMessage.length > 160) {
      return baseMessage.substring(0, 150) + '...\n\n- BuzzCore';
    }
    
    return fullMessage;
  }

  /**
   * Formats phone numbers to E.164 international format for Twilio
   * @param phone - Raw phone number input
   * @returns Formatted phone number in E.164 format
   */
  private formatPhoneNumber(phone: string): string {
    if (!phone) throw new Error('Phone number required');

    const cleaned = phone.replace(/[^\d+]/g, '');

    // Handle already formatted numbers
    if (cleaned.startsWith('+')) {
      return cleaned;
    }
    
    // Handle Colombian numbers with country code
    if (cleaned.startsWith('57') && cleaned.length >= 12) {
      return `+${cleaned}`;
    }
    
    // Handle numbers starting with 0
    if (cleaned.startsWith('0')) {
      return `+57${cleaned.substring(1)}`;
    }
    
    // Handle 10-digit local numbers
    if (/^\d{10}$/.test(cleaned)) {
      return `+57${cleaned}`;
    }

    throw new Error(`Unsupported phone number format: ${phone}`);
  }

  /**
   * Translates Twilio error codes to user-friendly error messages
   * @param error - Twilio error object
   * @returns Human-readable error message
   */
  private getErrorMessage(error: any): string {
    if (!error) return 'Unknown error';
    
    switch (error.code) {
      case 20003: return 'Authentication failed - Please verify Account SID and Auth Token';
      case 21211: return 'Invalid phone number format';
      case 21408: return 'No SMS sending permissions';
      case 21610: return 'Unverified phone number (sandbox mode)';
      case 30007: return 'Delivery failed - Please verify phone number';
      default: return error.message || `Twilio Error: ${error.code}`;
    }
  }

  /**
   * Tests Twilio credentials by making an API call to verify authentication
   * @returns Object indicating credential validity and any error messages
   */
  async testCredentials(): Promise<{ valid: boolean; error?: string }> {
    try {
      const accountSid = this.configService.get('TWILIO_ACCOUNT_SID');
      const testClient = Twilio(accountSid, this.configService.get('TWILIO_AUTH_TOKEN'));
      const account = await testClient.api.accounts(accountSid).fetch();
      
      this.logger.log('TWILIO CREDENTIALS VALID');
      return { valid: true };
    } catch (error) {
      this.logger.error('INVALID TWILIO CREDENTIALS');
      return { 
        valid: false, 
        error: `Authentication failed: ${error.message}` 
      };
    }
  }

  /**
   * Returns the current status of the SMS provider
   * @returns Object containing initialization status and credential validity
   */
  getStatus() {
    const accountSid = this.configService.get('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get('TWILIO_AUTH_TOKEN');
    const twilioPhone = this.configService.get('TWILIO_PHONE_NUMBER');
    
    return {
      initialized: this.isInitialized,
      hasValidCredentials: !!(accountSid && authToken),
      hasValidPhone: !!(twilioPhone && twilioPhone.startsWith('+')),
      phoneNumber: twilioPhone,
      service: 'Twilio'
    };
  }
}