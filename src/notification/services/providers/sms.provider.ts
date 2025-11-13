import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Twilio from 'twilio';
import { SmsResult, TravelTime } from '../../types/notification.types'; // ✅ IMPORT CORRECTO

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