import { Controller, Post, Get, Body, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { JwtAuthGuard } from 'src/auth/jwt.guard';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @ApiOperation({ summary: 'Send a new notification' })
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
}
