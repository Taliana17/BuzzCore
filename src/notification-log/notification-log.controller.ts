import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { NotificationLogService } from './notification-log.service';

@Controller('notification-logs')
export class NotificationLogController {
  constructor(private readonly logService: NotificationLogService) {}

  @Get()
  findAll() {
    return this.logService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.logService.findOne(id);
  }

  @Post()
  create(@Body() body: any) {
    return this.logService.create(body);
  }
}
