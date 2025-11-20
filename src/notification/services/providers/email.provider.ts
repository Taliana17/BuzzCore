import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { EmailProvider as IEmailProvider, EmailResult, ProviderStatus } from '../../interfaces/providers.interface';
import { TravelTime } from '../../types/core.types';

/**
 * Email Provider using Resend API
 * 
 * @description
 * Handles email sending operations using Resend service.
 * Provides specialized methods for tourist notifications with rich HTML templates.
 * Validates API key on initialization and provides status checking.
 * 
 * @export
 * @class EmailProvider
 */
@Injectable()
export class EmailProvider implements IEmailProvider {
  private readonly logger = new Logger(EmailProvider.name);
  private resend: Resend;
  private isInitialized: boolean = false;

  constructor(private configService: ConfigService) {
    this.initializeResend();
  }

  /**
   * Initializes Resend client with API key validation
   * 
   * @private
   * @description
   * Validates RESEND_API_KEY from environment:
   * - Must start with 're_' prefix
   * - Cannot contain 'mock' string
   * Sets isInitialized flag based on validation result
   */
  private initializeResend() {
    const apiKey = this.configService.get('RESEND_API_KEY');

    if (!apiKey || apiKey.includes('mock') || !apiKey.startsWith('re_')) {
      this.logger.error('INVALID RESEND_API_KEY for production environment');
      this.logger.error('Please obtain a valid API key from https://resend.com');
      return;
    }

    try {
      this.resend = new Resend(apiKey);
      this.isInitialized = true;
      this.logger.log('Resend Email Provider INITIALIZED FOR PRODUCTION');
    } catch (error) {
      this.logger.error('RESEND INITIALIZATION FAILED:', error.message);
    }
  }

  /**
   * Sends an email using Resend API
   * 
   * @param {string} to - Recipient email address
   * @param {string} subject - Email subject line
   * @param {string} html - Email HTML content
   * @returns {Promise<EmailResult>} Result with success status and email ID or error
   * 
   * @example
   * ```typescript
   * const result = await emailProvider.send(
   *   'user@example.com',
   *   'Welcome!',
   *   '<h1>Hello World</h1>'
   * );
   * if (result.success) console.log('Email ID:', result.id);
   * ```
   */
  async send(to: string, subject: string, html: string): Promise<EmailResult> {
    if (!this.isInitialized) {
      const error = 'Resend not configured - Please verify RESEND_API_KEY';
      this.logger.error(error);
      return { success: false, error };
    }

    try {
      this.logger.log(`SENDING PRODUCTION EMAIL to: ${to}`);
      
      const result = await this.resend.emails.send({
        from: 'BuzzCore Tourism <onboarding@resend.dev>',
        to: [to],
        subject: subject,
        html: html,
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

      this.logger.log(`PRODUCTION EMAIL SENT to ${to}, ID: ${result.data?.id}`);
      
      return {
        id: result.data?.id,
        success: true
      };
    } catch (error) {
      this.logger.error(`PRODUCTION EMAIL FAILED for ${to}:`, error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Sends a tourist place recommendation email
   * 
   * @description
   * Sends a beautifully formatted email with:
   * - Place details (address, rating, hours)
   * - Travel time and distance
   * - Opening hours schedule
   * - Google Maps link
   * - Responsive HTML template with gradient design
   * 
   * @param {string} to - Recipient email address
   * @param {string} userName - User's name for personalization
   * @param {string} city - Detected city name
   * @param {string} placeName - Tourist place name
   * @param {any} placeDetails - Google Place Details API response
   * @param {TravelTime} travelTime - Travel duration and distance
   * @returns {Promise<EmailResult>} Email sending result
   * 
   * @example
   * ```typescript
   * await emailProvider.sendTouristNotification(
   *   'user@example.com',
   *   'John Doe',
   *   'Bogotá',
   *   'Monserrate',
   *   placeDetailsObject,
   *   { duration: '15 min', distance: '2.5 km', success: true }
   * );
   * ```
   */
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
    
    const subject = `${placeName} - Recommendation in ${city}`;
    
    this.logger.log(` SENDING PRODUCTION TOURIST NOTIFICATION to: ${to}`);
    return this.send(to, subject, html);
  }

  /**
   * Builds HTML template for tourist notification email
   * 
   * @private
   * @description
   * Creates responsive HTML email with:
   * - Gradient header with city name
   * - Place card with details
   * - Travel time information
   * - Weekly opening hours
   * - Google Maps button
   * - Styled footer
   * 
   * @param {string} userName - User name for greeting
   * @param {string} city - City name
   * @param {string} placeName - Place name
   * @param {any} placeDetails - Place details from Google API
   * @param {TravelTime} travelTime - Travel information
   * @returns {string} Complete HTML email template
   */
  private buildTouristNotificationTemplate(
    userName: string,
    city: string,
    placeName: string,
    placeDetails: any,
    travelTime: TravelTime
  ): string {
    const travelInfo = travelTime.success ? 
      `<p><strong>Travel time:</strong> ${travelTime.duration} (${travelTime.distance})</p>` : 
      '<p><strong></strong> Near your current location</p>';

    const placeInfo = placeDetails ? `
      <p><strong>Address:</strong> ${placeDetails.formatted_address || 'Near your location'}</p>
      <p><strong>Rating:</strong> ${placeDetails.rating || 'N/A'} / 5 (${placeDetails.user_ratings_total || 0} reviews)</p>
      <p><strong>Hours:</strong> ${placeDetails.opening_hours?.open_now ? '✅ Open now' : '❌ Closed'}</p>
      ${placeDetails.website ? `<p><strong>🌐 Website:</strong> <a href="${placeDetails.website}">${placeDetails.website}</a></p>` : ''}
      ${placeDetails.international_phone_number ? `<p><strong>📞 Phone:</strong> ${placeDetails.international_phone_number}</p>` : ''}
    ` : `
      <p><strong>Location:</strong> Near your current area</p>
      <p><strong>Rating:</strong> Recommended place</p>
    `;

    const openingHours = placeDetails?.opening_hours?.weekday_text ? `
      <div style="margin: 15px 0; padding: 10px; background: #f8f9fa; border-radius: 5px;">
        <strong>Opening Hours:</strong>
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
    <h1>BuzzCore Tourism</h1>
    <p>Discover amazing places in ${city}</p>
  </div>
  
  <div class="content">
    <h2>Hello ${userName}!</h2>
    <p>Welcome to <strong>${city}</strong>. We found a perfect tourist spot for you to visit:</p>
    
    <div class="place-card">
      <h3 style="color: #667eea; margin-top: 0;">${placeName}</h3>
      ${placeInfo}
      ${travelInfo}
      ${openingHours}
    </div>
    
    <p>We hope you enjoy this recommendation and your stay in ${city}!</p>
    
    <div style="text-align: center;">
      <a href="https://maps.google.com/?q=${placeDetails?.formatted_address || placeName}" class="button">View on Google Maps</a>
    </div>
  </div>
  
  <div class="footer">
    <p>© 2025 BuzzCore Tourism. All rights reserved.</p>
    <p><small>If you no longer wish to receive these notifications, <a href="#">update your preferences</a>.</small></p>
  </div>
</body>
</html>`;
  }

  getStatus(): ProviderStatus {
    const apiKey = this.configService.get('RESEND_API_KEY');
    return {
      initialized: this.isInitialized,
      hasValidApiKey: !!(apiKey && apiKey.startsWith('re_')),
      service: 'Resend'
    };
  }
}