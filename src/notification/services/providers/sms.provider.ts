import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Twilio from 'twilio';
import { SmsProvider as ISmsProvider, SmsResult, ProviderStatus } from '../../interfaces/providers.interface';
import { TravelTime } from '../../types/core.types';

/**
 * SMS Provider Service using Twilio API for sending SMS messages
 * Implements ISmsProvider interface for standardized SMS functionality
 * @class SmsProvider
 * @implements {ISmsProvider}
 */
@Injectable()
export class SmsProvider implements ISmsProvider {
  private readonly logger = new Logger(SmsProvider.name);
  private twilioClient: any;
  private isInitialized: boolean = false;

  /**
   * Creates an instance of SmsProvider
   * @param {ConfigService} configService - NestJS configuration service for environment variables
   */
  constructor(private configService: ConfigService) {
    this.initializeTwilio();
  }

  /**
   * Initializes Twilio client with credentials from environment variables
   * Validates required configuration and sets up the Twilio SDK
   * @private
   */
  private initializeTwilio() {
    const accountSid = this.configService.get('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get('TWILIO_AUTH_TOKEN');
    const twilioPhone = this.configService.get('TWILIO_PHONE_NUMBER');

    // Validate Twilio Account SID format (should start with 'AC')
    if (!accountSid || !accountSid.startsWith('AC')) {
      this.logger.error('INVALID TWILIO_ACCOUNT_SID');
      return;
    }

    // Validate Auth Token length and presence
    if (!authToken || authToken.length < 20) {
      this.logger.error('INVALID TWILIO_AUTH_TOKEN');
      return;
    }

    // Validate Twilio phone number format (should start with '+')
    if (!twilioPhone || !twilioPhone.startsWith('+')) {
      this.logger.error('INVALID TWILIO_PHONE_NUMBER');
      return;
    }

    try {
      // Initialize Twilio SDK with credentials
      this.twilioClient = Twilio(accountSid, authToken);
      this.isInitialized = true;
      this.logger.log('Twilio SMS Provider INITIALIZED FOR PRODUCTION');
      this.logger.log(`   Twilio Number: ${twilioPhone}`);
    } catch (error) {
      this.logger.error('TWILIO INITIALIZATION FAILED:', error.message);
    }
  }

  /**
   * Sends an SMS message to the specified phone number
   * @param {string} to - Recipient phone number
   * @param {string} message - SMS message content
   * @returns {Promise<SmsResult>} Result object indicating success/failure and additional data
   * @throws Will return error result if Twilio is not initialized or SMS sending fails
   */
  async send(to: string, message: string): Promise<SmsResult> {
    // Check if Twilio client is properly initialized
    if (!this.isInitialized) {
      const error = 'Twilio not configured - Please verify credentials';
      this.logger.error(error);
      return { success: false, error };
    }

    const twilioPhone = this.configService.get('TWILIO_PHONE_NUMBER');

    try {
      // Format phone number to international standard
      const formattedTo = this.formatPhoneNumber(to);
      
      this.logger.log(`SENDING PRODUCTION SMS to: ${formattedTo}`);
      
      // Send SMS using Twilio API
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
   * Sends a tourist notification SMS with formatted travel information
   * @param {string} to - Recipient phone number
   * @param {string} userName - Tourist's name for personalization
   * @param {string} city - Destination city name
   * @param {string} placeName - Recommended place to visit
   * @param {TravelTime} travelTime - Travel time and distance information
   * @returns {Promise<SmsResult>} Result of SMS sending operation
   */
  async sendTouristNotification(
    to: string, 
    userName: string,
    city: string,
    placeName: string,
    travelTime: TravelTime 
  ): Promise<SmsResult> {
    
    // Build formatted tourist notification message
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
   * Constructs a formatted tourist notification message with travel information
   * @private
   * @param {string} userName - Tourist's name
   * @param {string} city - Destination city
   * @param {string} placeName - Recommended place name
   * @param {TravelTime} travelTime - Travel time and distance data
   * @returns {string} Formatted SMS message
   */
  private buildTouristNotificationMessage(
    userName: string,
    city: string,
    placeName: string,
    travelTime: TravelTime
  ): string {
    const baseMessage = `✨ Hello ${userName}! ✨🏙️ Welcome to beautiful ${city}! ⭐ We recommend visiting:🎯 ${placeName}`;

    // Add travel time information if available
    const travelInfo = travelTime.success ? 
    `🚗 Travel time: ${travelTime.duration} (${travelTime.distance})\n\n` : 
    '📍 Near your location - perfect for walking!\n\n';

    const footer = `🌟 Enjoy your visit to ${city}! 🌟- BuzzCore  🚀`;
    const fullMessage = baseMessage + travelInfo + footer;
    
    // Ensure message doesn't exceed SMS character limits
    if (fullMessage.length > 160) {
      return baseMessage.substring(0, 150) + '...\n\n- BuzzCore';
    }
    
    return fullMessage;
  }

  /**
   * Validates if a phone number is in a supported format
   * @param {string} phone - Phone number to validate
   * @returns {boolean} True if phone number is valid, false otherwise
   */
  validatePhoneNumber(phone: string): boolean {
    try {
      this.formatPhoneNumber(phone);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Formats phone number to international standard (+57 for Colombia)
   * Supports multiple input formats and converts to E.164 format
   * @private
   * @param {string} phone - Phone number to format
   * @returns {string} Formatted international phone number
   * @throws {Error} If phone number format is unsupported
   */
  private formatPhoneNumber(phone: string): string {
    if (!phone) throw new Error('Phone number required');

    // Remove all non-digit characters except '+'
    const cleaned = phone.replace(/[^\d+]/g, '');

    // Already in international format
    if (cleaned.startsWith('+')) {
      return cleaned;
    }
    
    // Colombian number with country code prefix
    if (cleaned.startsWith('57') && cleaned.length >= 12) {
      return `+${cleaned}`;
    }
    
    // Colombian number with leading zero
    if (cleaned.startsWith('0')) {
      return `+57${cleaned.substring(1)}`;
    }
    
    // Standard 10-digit Colombian number
    if (/^\d{10}$/.test(cleaned)) {
      return `+57${cleaned}`;
    }

    throw new Error(`Unsupported phone number format: ${phone}`);
  }

  /**
   * Converts Twilio error codes to user-friendly error messages
   * @private
   * @param {any} error - Twilio error object
   * @returns {string} Human-readable error message
   */
  private getErrorMessage(error: any): string {
    if (!error) return 'Unknown error';
    
    // Map Twilio error codes to descriptive messages
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
   * @returns {Promise<{ valid: boolean; error?: string }>} Validation result with optional error message
   */
  async testCredentials(): Promise<{ valid: boolean; error?: string }> {
    try {
      const accountSid = this.configService.get('TWILIO_ACCOUNT_SID');
      const testClient = Twilio(accountSid, this.configService.get('TWILIO_AUTH_TOKEN'));
      
      // Test API call to verify credentials
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
   * Returns the current status and configuration of the SMS provider
   * @returns {ProviderStatus} Provider status information including initialization state and credentials
   */
  getStatus(): ProviderStatus {
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