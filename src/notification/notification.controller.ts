import { Controller, Post, Get, Body, Req, UseGuards, Query, BadRequestException, Logger } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { NotificationService } from './services/core/notification.service';
import { NotificationQueueService } from './services/core/notification-queue.service';
import { NotificationStatisticsService } from './services/core/notification-statistics.service';
import { EmailProvider } from './services/providers/email.provider';
import { SmsProvider } from './services/providers/sms.provider';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { ReceiveLocationDto } from './dto/receive-location.dto';
import { CityDetectionService } from './services/external/city-detection.service';
import { TouristPlacesService } from './services/external/tourist-places.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { UserService } from '../user/user.service';
import { LocationHistoryService } from '../location-history/location-history.service';
import { 
  NotificationCreateData, 
  TravelTime, 
  EmailResult,
  TestPlacesResponse,
  NotificationJobData 
} from './types';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationController {
  private readonly logger = new Logger(NotificationController.name);

  constructor(
    private readonly notificationService: NotificationService,
    private readonly statisticsService: NotificationStatisticsService,
    private readonly queueService: NotificationQueueService,
    private readonly touristPlacesService: TouristPlacesService,
    private readonly emailProvider: EmailProvider, 
    private readonly smsProvider: SmsProvider,
    private readonly userService: UserService,
    private readonly locationHistoryService: LocationHistoryService,
    private readonly cityDetectionService: CityDetectionService,
  ) {}

  @ApiOperation({ summary: 'Send a new notification' })
  @ApiResponse({ status: 201, description: 'Notification created and queued' })
  @UseGuards(JwtAuthGuard)
  @Post()
  async sendNotification(@Body() dto: CreateNotificationDto, @Req() req) {
    if (!dto.location_data || !dto.location_data.coordinates) {
      throw new BadRequestException('Location data with coordinates is required for tourist notifications');
    } 

    return this.notificationService.processLocationAndNotify(
      { ...dto.location_data.coordinates, city: dto.location_data.city, userId: req.user.id },
      this.userService,
      this.locationHistoryService
    );
  }

  @ApiOperation({ summary: 'Test city detection from coordinates' })
  @UseGuards(JwtAuthGuard)
  @Get('test-city-detection')
  async testCityDetection(
    @Query('lat') lat: number,
    @Query('lng') lng: number,
    @Req() req
  ) {
    const testLocation = { 
      lat: lat || 4.710989, 
      lng: lng || -74.072092 
    };
    
    try {
      const cityDetection = await this.cityDetectionService.detectCity(testLocation);
      
      return {
        success: true,
        message: 'City detection working!',
        location: testLocation,
        detected_city: cityDetection,
        providers_status: {
          city_detection: this.cityDetectionService.getStatus(),
          tourist_places: this.touristPlacesService.getStatus()
        }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error with city detection',
        error: error.message,
        location: testLocation
      };
    }
  }

  @ApiOperation({ summary: 'Receive user location and send tourist notification' })
  @ApiResponse({ status: 201, description: 'Location received and notification sent' })
  @UseGuards(JwtAuthGuard) 
  @Post('receive-location')
  async receiveLocationAndNotify(@Body() dto: ReceiveLocationDto, @Req() req) {
    this.logger.log(`📍 Ubicación recibida - Lat: ${dto.lat}, Lng: ${dto.lng}, Ciudad: ${dto.city}`);
    
    try {
      const userId = req.user.id;

      const result = await this.notificationService.processLocationAndNotify(
        { ...dto, userId },
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
    return this.statisticsService.getNotificationStats(req.user.id);
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
  ) {
    const testLocation = { 
      lat: lat || 4.710989, 
      lng: lng || -74.072092 
    };
    
    try {
      const places = await this.touristPlacesService.findNearbyPlaces(testLocation, 1000);
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

  @ApiOperation({ summary: 'Test all providers' })
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
          touristPlaces: this.touristPlacesService.getStatus(),
          cityDetection: this.cityDetectionService.getStatus()
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
      touristPlaces: this.touristPlacesService.getStatus(),
      cityDetection: this.cityDetectionService.getStatus()
    };
  }
}