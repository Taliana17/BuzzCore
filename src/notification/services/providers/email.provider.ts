import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

export interface EmailResult {
  id?: string;
  success: boolean;
  error?: string;
}

@Injectable()
export class EmailProvider {
  private readonly logger = new Logger(EmailProvider.name);
  private resend: Resend;
  private isInitialized: boolean = false;

  constructor(private configService: ConfigService) {
    this.initializeResend();
  }

  private initializeResend() {
    const apiKey = this.configService.get('RESEND_API_KEY');

    if (!apiKey) {
      this.logger.warn('RESEND_API_KEY not found - Email disabled');
      return;
    }

    try {
      this.resend = new Resend(apiKey);
      this.isInitialized = true;
      this.logger.log('Resend Email provider initialized');
    } catch (error) {
      this.logger.error('Failed to initialize Resend:', error.message);
    }
  }

  async send(to: string, subject: string, html: string): Promise<EmailResult> {
    if (!this.isInitialized) {
      const error = 'Resend not configured';
      this.logger.error(error);
      return { success: false, error };
    }

    try {
      this.logger.debug(`Attempting email to: ${to}`);
      
      const result = await this.resend.emails.send({
        from: 'BuzzCore <notifications@buzzcore.com>',
        to: [to],
        subject: subject,
        html: html,
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

      this.logger.log(`Email sent to ${to}, ID: ${result.data?.id}`);
      
      return {
        id: result.data?.id,
        success: true
      };
    } catch (error) {
      this.logger.error(`Email failed to ${to}:`, error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async sendNotificationEmail(to: string, message: string, placeName: string, placeDetails?: any): Promise<EmailResult> {
    const html = this.buildNotificationTemplate(message, placeName, placeDetails);
    const subject = ` ${placeName} - BuzzCore Recommendation`;
    
    this.logger.log(`Sending notification email to: ${to}`);
    return this.send(to, subject, html);
  }

  private buildNotificationTemplate(message: string, placeName: string, placeDetails?: any): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { 
      font-family: 'Arial', sans-serif; 
      line-height: 1.6; 
      color: #333; 
      max-width: 600px; 
      margin: 0 auto; 
      padding: 20px;
    }
    .header { 
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white; 
      padding: 30px; 
      text-align: center; 
      border-radius: 10px 10px 0 0;
    }
    .content { 
      padding: 30px; 
      background: #f9f9f9; 
      border-radius: 0 0 10px 10px;
    }
    .place-card { 
      background: white; 
      padding: 20px; 
      border-radius: 8px; 
      margin: 20px 0; 
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .button { 
      display: inline-block; 
      background: #667eea; 
      color: white; 
      padding: 12px 30px; 
      text-decoration: none; 
      border-radius: 5px; 
      margin: 10px 0;
    }
    .footer { 
      text-align: center; 
      margin-top: 30px; 
      color: #666; 
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🎯 BuzzCore Recommendation</h1>
    <p>Descubre lugares increíbles cerca de ti</p>
  </div>
  
  <div class="content">
    <h2>¡Hola!</h2>
    <p>${message}</p>
    
    <div class="place-card">
      <h3 style="color: #667eea; margin-top: 0;">📍 ${placeName}</h3>
      
      ${placeDetails ? `
        <p><strong>Dirección:</strong> ${placeDetails.formatted_address || 'Próxima a tu ubicación'}</p>
        <p><strong>Rating:</strong> ${placeDetails.rating || '4.5'} / 5</p>
        <p><strong>Horario:</strong> ${placeDetails.opening_hours?.open_now ? 'Abierto ahora' : 'Cerrado'}</p>
      ` : `
        <p><strong>Ubicación:</strong> Próxima a tu área actual</p>
        <p><strong>Rating:</strong> 4.5 / 5 (recomendado)</p>
        <p><strong>Horario:</strong> Abierto ahora</p>
      `}
    </div>
    
    <p>¡Esperamos que disfrutes esta recomendación!</p>
    
    <div style="text-align: center;">
      <a href="#" class="button">Ver en Mapa</a>
    </div>
  </div>
  
  <div class="footer">
    <p>© 2025 BuzzCore. Todos los derechos reservados.</p>
    <p><small>Si no deseas recibir estas notificaciones, <a href="#">actualiza tus preferencias</a>.</small></p>
  </div>
</body>
</html>
    `;
  }

  getStatus() {
    const apiKey = this.configService.get('RESEND_API_KEY');
    return {
      initialized: this.isInitialized,
      hasApiKey: !!apiKey,
    };
  }
}