import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ChannelService } from './channel.service';

@Controller('channels')
export class ChannelController {
  constructor(private readonly channelService: ChannelService) {}

  @Get()
  findAll() {
    return this.channelService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.channelService.findOne(id);
  }

  @Post()
  create(@Body() body: any) {
    return this.channelService.create(body);
  }
}
