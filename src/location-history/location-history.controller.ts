// src/location-history/location-history.controller.ts
import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { LocationHistoryService } from './location-history.service';
import { CreateLocationHistoryDto } from './dto/create-location-history.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';

@ApiTags('Location History')
@ApiBearerAuth()
@Controller('location-history')
export class LocationHistoryController {
  constructor(private readonly locationHistoryService: LocationHistoryService) {}

  @ApiOperation({ summary: 'Create location history record' })
  @UseGuards(JwtAuthGuard)
  @Post()
  async saveLocation(@Body() dto: CreateLocationHistoryDto, @Req() req) {
    return this.locationHistoryService.receiveAndProcessLocation(dto, req.user);
  }


  @ApiOperation({ summary: 'Get user location history' })
  @UseGuards(JwtAuthGuard)
  @Get()
  async findAllByUser(@Req() req) {
    return this.locationHistoryService.findAllByUser(req.user.id);
  }
}