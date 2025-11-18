import { Controller, Post, Get, Body, Req, UseGuards, Query, BadRequestException, Logger } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBody } from '@nestjs/swagger';
import { NotificationService } from './services/notification.service';
import { NotificationQueueService } from './services/notification-queue.service';
import { EmailProvider } from './services/providers/email.provider';
import { SmsProvider } from './services/providers/sms.provider';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { ReceiveLocationDto } from './dto/receive-location.dto';
import { JwtAuthGuard } from 'src/auth/jwt.guard';
import { TouristPlacesService } from './services/tourist-places.service';
import { UserService } from 'src/user/user.service';
import { LocationHistoryService } from 'src/location-history/location-history.service';
import { 
  TestPlacesResponse, 
  TestPlaceDetailsResponse, 
  ServiceStatusResponse 
} from './types/notification.types';
import { Notification } from './entities/notification.entity';

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

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ 
    summary: 'Send a new notification',
    description: 'Creates and queues a new tourist notification based on user location. Requires coordinates to find nearby tourist places.',
  })
  @ApiBody({ type: CreateNotificationDto })
  @ApiResponse({ 
    status: 201, 
    description: 'Notification created and queued successfully.',
    type: Notification,
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request. Location data with coordinates is required.',
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized. Valid JWT token required.',
  })
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

  @Post('receive-location')
  @ApiOperation({ 
    summary: 'Receive user location and send tourist notification',
    description: 'Receives user geolocation coordinates, detects city, saves location history, and automatically sends personalized tourist place recommendations.',
  })
  @ApiBody({ type: ReceiveLocationDto })
  @ApiResponse({ 
    status: 201, 
    description: 'Location received and notification sent successfully.',
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request. Invalid location data.',
  })
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

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ 
    summary: 'Get all notifications of the current user',
    description: 'Retrieves all notifications (email and SMS) sent to the authenticated user, including status and metadata.',
  })
  @ApiResponse({ 
    status: 200, 
    description: 'List of user notifications retrieved successfully.',
    type: [Notification],
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized. Valid JWT token required.',
  })
  async getUserNotifications(@Req() req) {
    return this.notificationService.findAllByUser(req.user.id);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ 
    summary: 'Get notification statistics',
    description: 'Retrieves statistics about user notifications including total sent, success rate, channel distribution, and recent activity.',
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Notification statistics retrieved successfully.',
    schema: {
      example: {
        total: 45,
        sent: 40,
        failed: 3,
        pending: 2,
        byChannel: { email: 30, sms: 15 },
        successRate: 88.9
      }
    }
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized. Valid JWT token required.',
  })
  async getNotificationStats(@Req() req) {
    return this.notificationService.getNotificationStats(req.user.id);
  }

  @Get('queue/stats')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ 
    summary: 'Get queue statistics (Admin only)',
    description: 'Retrieves BullMQ queue statistics including active, waiting, completed, and failed jobs. Admin role required.',
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Queue statistics retrieved successfully.',
    schema: {
      example: {
        waiting: 5,
        active: 2,
        completed: 150,
        failed: 3,
        delayed: 0
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Unauthorized. Admin role required.',
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized. Valid JWT token required.',
  })
  async getQueueStats(@Req() req) {
    if (req.user.role !== 'admin') {
      throw new BadRequestException('No autorizado: Se requiere rol de administrador');
    }
    return this.queueService.getQueueStats();
  }

  @Get('test-places')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ 
    summary: 'Test Google Places API integration',
    description: 'Tests the Google Places API by searching for nearby tourist places at specified coordinates. Defaults to Bogotá if no coordinates provided.',
  })
  @ApiQuery({
    name: 'lat',
    description: 'Latitude coordinate',
    required: false,
    type: Number,
    example: 4.710989,
  })
  @ApiQuery({
    name: 'lng',
    description: 'Longitude coordinate',
    required: false,
    type: Number,
    example: -74.072092,
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Places API test completed.',
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized. Valid JWT token required.',
  })
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

  @Get('test-place-details')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ 
    summary: 'Test Google Place Details API',
    description: 'Tests the Google Place Details API by fetching detailed information about a specific place.',
  })
  @ApiQuery({
    name: 'place',
    description: 'Place name to search for details',
    required: false,
    type: String,
    example: 'Monserrate',
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Place Details API test completed.',
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized. Valid JWT token required.',
  })
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

  @Get('service-status')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ 
    summary: 'Check Google Places service status',
    description: 'Verifies if Google Places API is properly initialized and has a valid API key configured.',
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Service status retrieved successfully.',
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized. Valid JWT token required.',
  })
  async getServiceStatus(): Promise<ServiceStatusResponse> {
    const status = this.touristPlacesService.getStatus();
    return {
      touristPlaces: {
        initialized: status.initialized,
        hasApiKey: status.hasApiKey 
      }
    };
  }

  @Get('test-providers')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ 
    summary: 'Test SMS and Email providers',
    description: 'Sends test notifications via both SMS (Twilio) and Email (Resend) providers to verify configuration and connectivity.',
  })
  @ApiQuery({
    name: 'phone',
    description: 'Phone number for SMS test',
    required: false,
    type: String,
    example: '+573147327080',
  })
  @ApiQuery({
    name: 'email',
    description: 'Email address for email test',
    required: false,
    type: String,
    example: 'test@example.com',
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Providers test completed.',
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized. Valid JWT token required.',
  })
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

  @Get('providers-status')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ 
    summary: 'Check all providers status',
    description: 'Returns the initialization and configuration status of all external service providers (SMS, Email, Google Places).',
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Providers status retrieved successfully.',
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized. Valid JWT token required.',
  })
  async getProvidersStatus() {
    return {
      sms: this.smsProvider.getStatus(),
      email: this.emailProvider.getStatus(),
      googlePlaces: this.touristPlacesService.getStatus(),
    };
  }

  @Get('sms-debug')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ 
    summary: 'Debug SMS configuration',
    description: 'Provides detailed debugging information about SMS provider configuration including credential validation and common issues.',
  })
  @ApiResponse({ 
    status: 200, 
    description: 'SMS debug information retrieved successfully.',
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized. Valid JWT token required.',
  })
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

  @Post('test-sms')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ 
    summary: 'Test SMS provider only',
    description: 'Sends a test SMS message to verify Twilio configuration and connectivity.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['phone'],
      properties: {
        phone: {
          type: 'string',
          description: 'Phone number in international format (E.164)',
          example: '+573001234567'
        },
        message: {
          type: 'string',
          description: 'Custom test message (optional)',
          example: '¡Prueba de SMS desde BuzzCore!'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 201, 
    description: 'SMS sent successfully.',
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request. Phone number is required.',
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized. Valid JWT token required.',
  })
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

  @Post('test-email')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ 
    summary: 'Test Email provider only',
    description: 'Sends a test email message to verify Resend configuration and connectivity.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['email'],
      properties: {
        email: {
          type: 'string',
          description: 'Email address to send test',
          example: 'test@example.com',
          format: 'email'
        },
        message: {
          type: 'string',
          description: 'Custom test message (optional)',
          example: '¡Esta es una prueba de email desde BuzzCore!'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Email sent successfully.',
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request. Email is required.',
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized. Valid JWT token required.',
  })
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