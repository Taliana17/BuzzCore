import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Channel } from './entities/channel.entity';

@Injectable()
export class ChannelService {
  constructor(
    @InjectRepository(Channel)
    private readonly channelRepository: Repository<Channel>,
  ) {}

  findAll() {
    return this.channelRepository.find();
  }

  findOne(id: number) {
    return this.channelRepository.findOne({ where: { id } });
  }

  create(data: any) {
    const channel = this.channelRepository.create(data);
    return this.channelRepository.save(channel);
  }
}
