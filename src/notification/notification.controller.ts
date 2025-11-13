import { Controller, Post, Get, Body, Req, UseGuards, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { NotificationService } from './services/notification.service';
import { NotificationQueueService } from './services/notification-queue.service';
import { GooglePlacesService } from './services/google-places.service';
import { EmailProvider } from './services/providers/email.provider';
import { SmsProvider } from './services/providers/sms.provider';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { JwtAuthGuard } from 'src/auth/jwt.guard';
import { 
  TestPlacesResponse, 
  TestPlaceDetailsResponse, 
  ServiceStatusResponse 
} from './types/notification.types';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly queueService: NotificationQueueService,
    private readonly googlePlacesService: GooglePlacesService,
    private readonly emailProvider: EmailProvider, 
    private readonly smsProvider: SmsProvider,
  ) {}

  @ApiOperation({ summary: 'Send a new notification' })
  @ApiResponse({ status: 201, description: 'Notification created and queued' })
  @UseGuards(JwtAuthGuard)
  @Post()
  async sendNotification(@Body() dto: CreateNotificationDto, @Req() req) {
    return this.notificationService.create(dto, req.user);
  }

  @ApiOperation({ summary: 'Get all notifications of the current user' })
  @UseGuards(JwtAuthGuard)
  @Get()
  async getUserNotifications(@Req() req) {
    return this.notificationService.findAllByUser(req.user.id);
  }

  @ApiOperation({ summary: 'Get queue statistics (Admin)' })
  @UseGuards(JwtAuthGuard)
  @Get('queue/stats')
  async getQueueStats(@Req() req) {
    if (req.user.role !== 'admin') {
      throw new Error('Unauthorized');
    }
    return this.queueService.getQueueStats();
  }

  @ApiOperation({ summary: 'Test Google Places API integration' })
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
      const places = await this.googlePlacesService.getNearbyPlaces(testLocation, 1000);
      return {
        success: true,
        message: 'Google Places API is working!',
        location: testLocation,
        places: places
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error with Google Places API',
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
      const placeDetails = await this.googlePlacesService.getPlaceDetails(
        placeName || 'Centro Comercial Santafé Bogotá', 
        testLocation
      );
      
      return {
        success: true,
        message: 'Google Place Details API is working!',
        placeName: placeName || 'Centro Comercial Santafé Bogotá',
        details: placeDetails
      };
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
    const status = this.googlePlacesService.getStatus();
    return {
      googlePlaces: status
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
    const testEmail = email || 'serranocaroldayana@example.com';
    
    try {
      // Test SMS
      const smsResult = await this.smsProvider.sendNotificationSms(
        testPhone,
        '¡Hola desde BuzzCore! Esta es una prueba de SMS con datos mock.',
        'Centro Comercial Santafé (Mock)'
      );

      // Test Email
      const emailResult = await this.emailProvider.sendNotificationEmail(
        testEmail,
        '¡Hola desde BuzzCore! Esta es una prueba de email con datos mock.',
        'Centro Comercial Santafé (Mock)'
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
          googlePlaces: this.googlePlacesService.getStatus(),
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

  //Check all providers status
  @ApiOperation({ summary: 'Check all providers status' })
  @UseGuards(JwtAuthGuard)
  @Get('providers-status')
  async getProvidersStatus() {
    return {
      sms: this.smsProvider.getStatus(),
      email: this.emailProvider.getStatus(),
      googlePlaces: this.googlePlacesService.getStatus(),
    };
  }

  //Test only SMS
  @ApiOperation({ summary: 'Test only SMS provider' })
  @UseGuards(JwtAuthGuard)
  @Post('test-sms')
  async testSms(
    @Body() body: { phone: string; message?: string },
    @Req() req
  ) {
    const { phone, message } = body;
    
    if (!phone) {
      return {
        success: false,
        error: 'Phone number is required'
      };
    }

    try {
      const result = await this.smsProvider.sendNotificationSms(
        phone,
        message || '¡Prueba de SMS desde BuzzCore! 🚀',
        'Lugar de Prueba'
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

  // Test only Email
  @ApiOperation({ summary: 'Test only Email provider' })
  @UseGuards(JwtAuthGuard)
  @Post('test-email')
  async testEmail(
    @Body() body: { email: string; message?: string },
    @Req() req
  ) {
    const { email, message } = body;
    
    if (!email) {
      return {
        success: false,
        error: 'Email is required'
      };
    }

    try {
      const result = await this.emailProvider.sendNotificationEmail(
        email,
        message || '¡Prueba de Email desde BuzzCore! ',
        'Lugar de Prueba'
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