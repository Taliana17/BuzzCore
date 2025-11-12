import { Controller, Post, Body, Get, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { LocationHistoryService } from './location-history.service';
import { CreateLocationHistoryDto } from './dto/create-location-history.dto';
import { JwtAuthGuard } from 'src/auth/jwt.guard';

@ApiTags('Location History')
@ApiBearerAuth()
@Controller('location-history')
export class LocationHistoryController {
  constructor(private readonly locationService: LocationHistoryService) {}

  @ApiOperation({ summary: 'Add a new location record' })
  @UseGuards(JwtAuthGuard)
  @Post()
  async addLocation(@Body() dto: CreateLocationHistoryDto, @Req() req) {
    return this.locationService.create(dto, req.user);
  }

  @ApiOperation({ summary: 'Get all locations of the current user' })
  @UseGuards(JwtAuthGuard)
  @Get()
  async getUserHistory(@Req() req) {
    return this.locationService.findAllByUser(req.user.id);
  }
}
