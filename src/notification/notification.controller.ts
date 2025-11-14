import { Controller, Post, Get, Body, Req, UseGuards, Query, BadRequestException, Logger } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { NotificationService } from './services/notification.service';
import { NotificationQueueService } from './services/notification-queue.service';
import { EmailProvider } from './services/providers/email.provider';
import { SmsProvider } from './services/providers/sms.provider';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { ReceiveLocationDto } from './dto/receive-location.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { TouristPlacesService } from './services/tourist-places.service';
import { UserService } from '../user/user.service';
import { LocationHistoryService } from '../location-history/location-history.service';
import { 
  TestPlacesResponse, 
  TestPlaceDetailsResponse, 
  ServiceStatusResponse 
} from './types/notification.types';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationController {
  private readonly logger = new Logger(NotificationController.name);

  constructor(
    private readonly notificationService: NotificationService,
    private readonly queueService: NotificationQueueService,
    private readonly touristPlacesService: TouristPlacesService,
    private readonly emailProvider: EmailProvider, 
    private readonly smsProvider: SmsProvider,
    private readonly userService: UserService,
    private readonly locationHistoryService: LocationHistoryService,
  ) {}

  @ApiOperation({ summary: 'Send a new notification' })
  @ApiResponse({ status: 201, description: 'Notification created and queued' })
  @UseGuards(JwtAuthGuard)
  @Post()
  async sendNotification(@Body() dto: CreateNotificationDto, @Req() req) {
    if (!dto.location_data || !dto.location_data.coordinates) {
      throw new BadRequestException('Location data with coordinates is required for tourist notifications');
    } 

    return this.notificationService.createTouristNotification(
      req.user, 
      dto.location_data.city, 
      dto.location_data.coordinates
    );
  }

  @ApiOperation({ summary: 'Receive user location and send tourist notification' })
  @ApiResponse({ status: 201, description: 'Location received and notification sent' })
  @Post('receive-location')
  async receiveLocationAndNotify(@Body() dto: ReceiveLocationDto) {
    this.logger.log(`📍 Ubicación recibida - Lat: ${dto.lat}, Lng: ${dto.lng}, Ciudad: ${dto.city}`);
    
    try {
      const result = await this.notificationService.processLocationAndNotify(
        dto,
        this.userService,
        this.locationHistoryService
      );
      return result;
    } catch (error) {
      this.logger.error(`❌ Error procesando ubicación: ${error.message}`);
      throw new BadRequestException(error.message);
    }
  }

  @ApiOperation({ summary: 'Get all notifications of the current user' })
  @UseGuards(JwtAuthGuard)
  @Get()
  async getUserNotifications(@Req() req) {
    return this.notificationService.findAllByUser(req.user.id);
  }

  @ApiOperation({ summary: 'Get notification statistics' })
  @UseGuards(JwtAuthGuard)
  @Get('stats')
  async getNotificationStats(@Req() req) {
    return this.notificationService.getNotificationStats(req.user.id);
  }

  @ApiOperation({ summary: 'Get queue statistics (Admin)' })
  @UseGuards(JwtAuthGuard)
  @Get('queue/stats')
  async getQueueStats(@Req() req) {
    if (req.user.role !== 'admin') {
      throw new BadRequestException('No autorizado: Se requiere rol de administrador');
    }
    return this.queueService.getQueueStats();
  }

  @ApiOperation({ summary: 'Test places API integration' })
  @UseGuards(JwtAuthGuard)
  @Get('test-places')
  async testPlaces(
    @Query('lat') lat: number, 
    @Query('lng') lng: number, 
    @Req() req
  ): Promise<TestPlacesResponse> {
    const testLocation = { 
      lat: lat || 4.710989, 
      lng: lng || -74.072092 
    };
    
    try {
      const places = await this.touristPlacesService.getNearbyTouristPlaces(testLocation, 1000);
      return {
        success: true,
        message: 'Places API is working!',
        location: testLocation,
        places: places
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error with Places API',
        error: error.message,
        location: testLocation
      };
    }
  }

  @ApiOperation({ summary: 'Test Google Place Details' })
  @UseGuards(JwtAuthGuard)
  @Get('test-place-details')
  async testPlaceDetails(
    @Query('place') placeName: string, 
    @Req() req
  ): Promise<TestPlaceDetailsResponse> {
    const testLocation = { lat: 4.710989, lng: -74.072092 };
    
    try {
      const places = await this.touristPlacesService.getNearbyTouristPlaces(testLocation, 1000);
      
      if (places.length > 0 && places[0].place_id) {
        const placeDetails = await this.touristPlacesService.getPlaceDetails(places[0].place_id);
        
        return {
          success: true,
          message: 'Google Place Details API is working!',
          placeName: places[0].name,
          details: placeDetails
        };
      } else {
        return {
          success: false,
          message: 'No places found to test details',
          error: 'No place_id available'
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'Error with Google Place Details API',
        error: error.message
      };
    }
  }

  @ApiOperation({ summary: 'Check Google Places service status' })
  @UseGuards(JwtAuthGuard)
  @Get('service-status')
  async getServiceStatus(): Promise<ServiceStatusResponse> {
    const status = this.touristPlacesService.getStatus();
    return {
      touristPlaces: {
        initialized: status.initialized,
        hasApiKey: status.hasApiKey 
      }
    };
  }

  @ApiOperation({ summary: 'Test SMS and Email providers' })
  @UseGuards(JwtAuthGuard)
  @Get('test-providers')
  async testProviders(
    @Query('phone') phone: string,
    @Query('email') email: string,
    @Req() req
  ) {
    const testPhone = phone || '+573147327080'; 
    const testEmail = email || 'test@example.com';
    
    try {
      const smsResult = await this.smsProvider.sendTouristNotification(
        testPhone,
        'Usuario Prueba',
        'Bogotá',
        'Jardín Botánico de Bogotá',
        { duration: '15 min', distance: '1.2 km', success: true }
      );

      const emailResult = await this.emailProvider.sendTouristNotification(
        testEmail,
        'Usuario Prueba',
        'Bogotá',
        'Jardín Botánico de Bogotá',
        {
          formatted_address: 'Av. Esperanza #34-56, Bogotá',
          rating: 4.7,
          opening_hours: { open_now: true, weekday_text: ['Lunes a Domingo: 9:00-17:00'] },
          website: 'https://jardinbotanicobogota.gov.co'
        },
        { duration: '15 min', distance: '1.2 km', success: true }
      );

      return {
        success: true,
        message: 'Providers test completed',
        test_data: {
          phone: testPhone,
          email: testEmail
        },
        sms: smsResult,
        email: emailResult,
        providersStatus: {
          sms: this.smsProvider.getStatus(),
          email: this.emailProvider.getStatus(),
          googlePlaces: this.touristPlacesService.getStatus(),
        }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error testing providers',
        error: error.message
      };
    }
  }

  @ApiOperation({ summary: 'Check all providers status' })
  @UseGuards(JwtAuthGuard)
  @Get('providers-status')
  async getProvidersStatus() {
    return {
      sms: this.smsProvider.getStatus(),
      email: this.emailProvider.getStatus(),
      googlePlaces: this.touristPlacesService.getStatus(),
    };
  }

  @ApiOperation({ summary: 'Debug SMS configuration' })
  @UseGuards(JwtAuthGuard)
  @Get('sms-debug')
  async debugSms() {
    const debugInfo = this.smsProvider.getStatus();
    const credentialTest = await this.smsProvider.testCredentials();
    
    return {
      timestamp: new Date().toISOString(),
      providerStatus: debugInfo,
      credentialTest,
      commonIssues: [
        '1. Check TWILIO_ACCOUNT_SID starts with "AC"',
        '2. Check TWILIO_AUTH_TOKEN is correct', 
        '3. Verify credentials in Twilio Console',
        '4. Ensure account is active and has balance'
      ]
    };
  }

  @ApiOperation({ summary: 'Test only SMS provider' })
  @UseGuards(JwtAuthGuard)
  @Post('test-sms')
  async testSms(
    @Body() body: { phone: string; message?: string },
    @Req() req
  ) {
    const { phone, message } = body;
    
    if (!phone) {
      throw new BadRequestException('Phone number is required');
    }

    try {
      const result = await this.smsProvider.send(
        phone,
        message || '¡Prueba de SMS desde BuzzCore!'
      );

      return {
        success: result.success,
        message: result.success ? 'SMS sent successfully' : 'Failed to send SMS',
        result: result
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  @ApiOperation({ summary: 'Test only Email provider' })
  @UseGuards(JwtAuthGuard)
  @Post('test-email')
  async testEmail(
    @Body() body: { email: string; message?: string },
    @Req() req
  ) {
    const { email, message } = body;
    
    if (!email) {
      throw new BadRequestException('Email is required');
    }

    try {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #667eea; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { padding: 20px; background: #f9f9f9; border-radius: 0 0 10px 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>BuzzCore Test</h1>
          </div>
          <div class="content">
            <h2>¡Hola!</h2>
            <p>${message || '¡Esta es una prueba de email desde BuzzCore!'}</p>
            <p>Si recibes este email, el sistema de notificaciones está funcionando correctamente.</p>
          </div>
        </body>
        </html>
      `;
      
      const result = await this.emailProvider.send(
        email,
        'Prueba de BuzzCore 📧',
        html
      );

      return {
        success: result.success,
        message: result.success ? 'Email sent successfully' : 'Failed to send email',
        result: result
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}