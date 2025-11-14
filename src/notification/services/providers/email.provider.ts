import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { EmailResult, TravelTime } from '../../types/notification.types'; 

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

    if (!apiKey || apiKey.includes('mock') || !apiKey.startsWith('re_')) {
      this.logger.error('RESEND_API_KEY NO VÁLIDA para producción');
      this.logger.error('Obtén una API key real en https://resend.com');
      return;
    }

    try {
      this.resend = new Resend(apiKey);
      this.isInitialized = true;
      this.logger.log('Resend Email Provider INICIALIZADO PARA PRODUCCIÓN');
    } catch (error) {
      this.logger.error('FALLÓ INICIALIZACIÓN DE RESEND:', error.message);
    }
  }

  async send(to: string, subject: string, html: string): Promise<EmailResult> {
    if (!this.isInitialized) {
      const error = 'Resend no configurado - Verifica RESEND_API_KEY';
      this.logger.error(error);
      return { success: false, error };
    }

    try {
      this.logger.log(`ENVIANDO EMAIL REAL a: ${to}`);
      
      const result = await this.resend.emails.send({
        from: 'BuzzCore Turístico <onboarding@resend.dev>',
        to: [to],
        subject: subject,
        html: html,
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

      this.logger.log(`EMAIL REAL ENVIADO a ${to}, ID: ${result.data?.id}`);
      
      return {
        id: result.data?.id,
        success: true
      };
    } catch (error) {
      this.logger.error(`FALLÓ ENVÍO DE EMAIL REAL a ${to}:`, error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async sendTouristNotification(
    to: string, 
    userName: string,
    city: string,
    placeName: string,
    placeDetails: any,
    travelTime: TravelTime 
  ): Promise<EmailResult> {
    
    const html = this.buildTouristNotificationTemplate(
      userName, 
      city, 
      placeName, 
      placeDetails, 
      travelTime
    );
    
    const subject = `${placeName} - Recomendación en ${city}`;
    
    this.logger.log(` ENVIANDO NOTIFICACIÓN TURÍSTICA REAL a: ${to}`);
    return this.send(to, subject, html);
  }

  private buildTouristNotificationTemplate(
    userName: string,
    city: string,
    placeName: string,
    placeDetails: any,
    travelTime: TravelTime
  ): string {
    const travelInfo = travelTime.success ? 
      `<p><strong>Tiempo de viaje:</strong> ${travelTime.duration} (${travelTime.distance})</p>` : 
      '<p><strong></strong> Cercano a tu ubicación</p>';

    const placeInfo = placeDetails ? `
      <p><strong>Dirección:</strong> ${placeDetails.formatted_address || 'Próxima a tu ubicación'}</p>
      <p><strong>Rating:</strong> ${placeDetails.rating || 'N/A'} / 5 (${placeDetails.user_ratings_total || 0} reseñas)</p>
      <p><strong>Horario:</strong> ${placeDetails.opening_hours?.open_now ? '✅ Abierto ahora' : '❌ Cerrado'}</p>
      ${placeDetails.website ? `<p><strong>🌐 Sitio web:</strong> <a href="${placeDetails.website}">${placeDetails.website}</a></p>` : ''}
      ${placeDetails.international_phone_number ? `<p><strong>📞 Teléfono:</strong> ${placeDetails.international_phone_number}</p>` : ''}
    ` : `
      <p><strong>Ubicación:</strong> Próxima a tu área actual</p>
      <p><strong>Rating:</strong> Lugar recomendado</p>
    `;

    const openingHours = placeDetails?.opening_hours?.weekday_text ? `
      <div style="margin: 15px 0; padding: 10px; background: #f8f9fa; border-radius: 5px;">
        <strong>Horarios:</strong>
        ${placeDetails.opening_hours.weekday_text.map((day: string) => `<div>${day}</div>`).join('')}
      </div>
    ` : '';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { padding: 30px; background: #f9f9f9; border-radius: 0 0 10px 10px; }
    .place-card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>BuzzCore Turístico</h1>
    <p>Descubre lugares increíbles en ${city}</p>
  </div>
  
  <div class="content">
    <h2>¡Hola ${userName}!</h2>
    <p>Te damos la bienvenida a <strong>${city}</strong>. Hemos encontrado un lugar turístico perfecto para que visites:</p>
    
    <div class="place-card">
      <h3 style="color: #667eea; margin-top: 0;">${placeName}</h3>
      ${placeInfo}
      ${travelInfo}
      ${openingHours}
    </div>
    
    <p>¡Esperamos que disfrutes esta recomendación y tu estadía en ${city}!</p>
    
    <div style="text-align: center;">
      <a href="https://maps.google.com/?q=${placeDetails?.formatted_address || placeName}" class="button">Ver en Google Maps</a>
    </div>
  </div>
  
  <div class="footer">
    <p>© 2025 BuzzCore Turístico. Todos los derechos reservados.</p>
    <p><small>Si no deseas recibir estas notificaciones, <a href="#">actualiza tus preferencias</a>.</small></p>
  </div>
</body>
</html>`;
  }

  getStatus() {
    const apiKey = this.configService.get('RESEND_API_KEY');
    return {
      initialized: this.isInitialized,
      hasValidApiKey: !!(apiKey && apiKey.startsWith('re_')),
      service: 'Resend'
    };
  }
}