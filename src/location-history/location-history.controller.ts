import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { LocationHistoryService } from './location-history.service';
import { CreateLocationHistoryDto } from './dto/create-location-history.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { LocationHistory } from './entities/location-history.entity';

@ApiTags('Location History')
@ApiBearerAuth()
@Controller('location-history')
export class LocationHistoryController {
  constructor(private readonly locationHistoryService: LocationHistoryService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Create location history record',
    description:
      'Saves a new location record for the authenticated user. Detects city name automatically if not provided using reverse geocoding.',
  })
  @ApiBody({ type: CreateLocationHistoryDto })
  @ApiResponse({
    status: 201,
    description: 'Location history record created successfully.',
    type: LocationHistory,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Invalid coordinates provided.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized. Valid JWT token required.',
  })
  async saveLocation(@Body() dto: CreateLocationHistoryDto, @Req() req) {
    return this.locationHistoryService.receiveAndProcessLocation(dto, req.user);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Get user location history',
    description:
      'Retrieves all location history records for the authenticated user, ordered by arrival date (most recent first).',
  })
  @ApiResponse({
    status: 200,
    description: 'Location history records retrieved successfully.',
    type: [LocationHistory],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized. Valid JWT token required.',
  })
  async findAllByUser(@Req() req) {
    return this.locationHistoryService.findAllByUser(req.user.id);
  }
}
