import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Twilio from 'twilio';
import { SmsResult, TravelTime } from '../../types/notification.types';

/**
 * SMS Provider using Twilio API
 * 
 * @description
 * Handles SMS sending operations using Twilio service.
 * Provides specialized methods for tourist notifications with formatted messages.
 * Validates credentials on initialization and provides phone number formatting.
 * 
 * @export
 * @class SmsProvider
 */
@Injectable()
export class SmsProvider {
  private readonly logger = new Logger(SmsProvider.name);
  private twilioClient: any;
  private isInitialized: boolean = false;

  constructor(private configService: ConfigService) {
    this.initializeTwilio();
  }

  /**
   * Initializes Twilio client with credential validation
   * 
   * @private
   * @description
   * Validates Twilio credentials from environment:
   * - TWILIO_ACCOUNT_SID must start with 'AC'
   * - TWILIO_AUTH_TOKEN must be at least 20 characters
   * - TWILIO_PHONE_NUMBER must start with '+'
   * Sets isInitialized flag based on validation result
   */
  private initializeTwilio() {
    const accountSid = this.configService.get('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get('TWILIO_AUTH_TOKEN');
    const twilioPhone = this.configService.get('TWILIO_PHONE_NUMBER');

    if (!accountSid || !accountSid.startsWith('AC')) {
      this.logger.error('TWILIO_ACCOUNT_SID NO VÁLIDA');
      return;
    }

    if (!authToken || authToken.length < 20) {
      this.logger.error('TWILIO_AUTH_TOKEN NO VÁLIDO');
      return;
    }

    if (!twilioPhone || !twilioPhone.startsWith('+')) {
      this.logger.error('TWILIO_PHONE_NUMBER NO VÁLIDO');
      return;
    }

    try {
      this.twilioClient = Twilio(accountSid, authToken);
      this.isInitialized = true;
      this.logger.log('Twilio SMS Provider INICIALIZADO PARA PRODUCCIÓN');
      this.logger.log(`   Número Twilio: ${twilioPhone}`);
    } catch (error) {
      this.logger.error('FALLÓ INICIALIZACIÓN DE TWILIO:', error.message);
    }
  }

  /**
   * Sends an SMS using Twilio API
   * 
   * @param {string} to - Recipient phone number (will be formatted automatically)
   * @param {string} message - SMS message content (max 160 characters recommended)
   * @returns {Promise<SmsResult>} Result with success status and SID or error
   * 
   * @example
   * ```typescript
   * const result = await smsProvider.send('+573001234567', 'Hello World!');
   * if (result.success) console.log('SMS SID:', result.sid);
   * ```
   */
  async send(to: string, message: string): Promise<SmsResult> {
    if (!this.isInitialized) {
      const error = 'Twilio no configurado - Verifica credenciales';
      this.logger.error(error);
      return { success: false, error };
    }

    const twilioPhone = this.configService.get('TWILIO_PHONE_NUMBER');

    try {
      const formattedTo = this.formatPhoneNumber(to);
      
      this.logger.log(`ENVIANDO SMS REAL a: ${formattedTo}`);
      
      const result = await this.twilioClient.messages.create({
        body: message,
        from: twilioPhone,
        to: formattedTo,
      });

      this.logger.log(`SMS REAL ENVIADO a: ${formattedTo}`);
      this.logger.log(`SID: ${result.sid}, Estado: ${result.status}`);
      
      return { 
        success: true, 
        sid: result.sid 
      };
    } catch (error) {
      this.logger.error(`FALLÓ ENVÍO DE SMS REAL a ${to}:`, error.message);
      return { 
        success: false, 
        error: this.getErrorMessage(error) 
      };
    }
  }

  /**
   * Sends a tourist place recommendation SMS
   * 
   * @description
   * Sends a formatted SMS with:
   * - Personalized greeting
   * - Place name
   * - Travel time and distance
   * - Automatic truncation if exceeds 160 characters
   * 
   * @param {string} to - Recipient phone number
   * @param {string} userName - User's name for personalization
   * @param {string} city - Detected city name
   * @param {string} placeName - Tourist place name
   * @param {TravelTime} travelTime - Travel duration and distance
   * @returns {Promise<SmsResult>} SMS sending result
   * 
   * @example
   * ```typescript
   * await smsProvider.sendTouristNotification(
   *   '+573001234567',
   *   'John',
   *   'Bogotá',
   *   'Monserrate',
   *   { duration: '15 min', distance: '2.5 km', success: true }
   * );
   * ```
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
    
    this.logger.log(`ENVIANDO NOTIFICACIÓN TURÍSTICA SMS REAL a: ${to}`);
    return this.send(to, smsMessage);
  }

  /**
   * Builds SMS message for tourist notification
   * 
   * @private
   * @description
   * Creates formatted SMS message with:
   * - Greeting with user name
   * - City welcome
   * - Place recommendation
   * - Travel time info
   * - BuzzCore signature
   * Truncates to 160 characters if too long
   * 
   * @param {string} userName - User name
   * @param {string} city - City name
   * @param {string} placeName - Place name
   * @param {TravelTime} travelTime - Travel information
   * @returns {string} Formatted SMS message
   */
  private buildTouristNotificationMessage(
    userName: string,
    city: string,
    placeName: string,
    travelTime: TravelTime
  ): string {
    const baseMessage = `¡Hola ${userName}! \n\nBienvenido/a a ${city}. Te recomendamos visitar:\n\n ${placeName}\n\n`;
    
    const travelInfo = travelTime.success ? 
      `🚶 ${travelTime.duration} (${travelTime.distance})\n\n` : 
      '📍 Cercano a tu ubicación\n\n';
    
    const footer = `¡Disfruta tu visita a ${city}!\n\n- BuzzCore Turístico`;
    
    const fullMessage = baseMessage + travelInfo + footer;
    
    if (fullMessage.length > 160) {
      return baseMessage.substring(0, 150) + '...\n\n- BuzzCore';
    }
    
    return fullMessage;
  }

  /**
   * Formats phone number to international E.164 format
   * 
   * @private
   * @description
   * Handles multiple phone number formats:
   * - Already formatted: +573001234567
   * - With country code: 573001234567
   * - With leading zero: 03001234567
   * - Local 10 digits: 3001234567
   * Defaults to Colombia (+57) if no country code provided
   * 
   * @param {string} phone - Phone number in any format
   * @returns {string} Formatted phone number in E.164 format (+573001234567)
   * @throws {Error} If phone format is not supported
   */
  private formatPhoneNumber(phone: string): string {
    if (!phone) throw new Error('Número de teléfono requerido');

    const cleaned = phone.replace(/[^\d+]/g, '');

    if (cleaned.startsWith('+')) {
      return cleaned;
    }
    
    if (cleaned.startsWith('57') && cleaned.length >= 12) {
      return `+${cleaned}`;
    }
    
    if (cleaned.startsWith('0')) {
      return `+57${cleaned.substring(1)}`;
    }
    
    if (/^\d{10}$/.test(cleaned)) {
      return `+57${cleaned}`;
    }

    throw new Error(`Formato de teléfono no soportado: ${phone}`);
  }

  /**
   * Translates Twilio error codes to user-friendly messages
   * 
   * @private
   * @param {any} error - Twilio error object
   * @returns {string} Human-readable error message in Spanish
   */
  private getErrorMessage(error: any): string {
    if (!error) return 'Error desconocido';
    
    switch (error.code) {
      case 20003: return 'Autenticación fallida - Verifica Account SID y Auth Token';
      case 21211: return 'Número de teléfono inválido';
      case 21408: return 'Sin permisos para enviar SMS';
      case 21610: return 'Número no verificado (modo sandbox)';
      case 30007: return 'Entrega fallida - Verifica número';
      default: return error.message || `Error Twilio: ${error.code}`;
    }
  }

  /**
   * Tests Twilio credentials validity
   * 
   * @description
   * Makes a test API call to verify credentials.
   * Useful for debugging connection issues.
   * 
   * @returns {Promise<{valid: boolean, error?: string}>} Validation result
   * 
   * @example
   * ```typescript
   * const test = await smsProvider.testCredentials();
   * if (!test.valid) console.error(test.error);
   * ```
   */
  async testCredentials(): Promise<{ valid: boolean; error?: string }> {
    try {
      const accountSid = this.configService.get('TWILIO_ACCOUNT_SID');
      const testClient = Twilio(accountSid, this.configService.get('TWILIO_AUTH_TOKEN'));
      const account = await testClient.api.accounts(accountSid).fetch();
      
      this.logger.log('CREDENCIALES TWILIO VÁLIDAS');
      return { valid: true };
    } catch (error) {
      this.logger.error('CREDENCIALES TWILIO INVÁLIDAS');
      return { 
        valid: false, 
        error: `Autenticación fallida: ${error.message}` 
      };
    }
  }

  /**
   * Gets provider initialization status
   * 
   * @returns {Object} Status object with credentials validation and phone number
   * 
   * @example
   * ```typescript
   * const status = smsProvider.getStatus();
   * console.log(status.initialized);
   * console.log(status.phoneNumber);
   * ```
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