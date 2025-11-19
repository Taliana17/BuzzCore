import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LocationHistory } from './entities/location-history.entity';
import { CreateLocationHistoryDto } from './dto/create-location-history.dto';
import { User } from '../user/entities/user.entity';

@Injectable()
export class LocationHistoryService {
  constructor(
    @InjectRepository(LocationHistory)
    private readonly locationRepo: Repository<LocationHistory>,
  ) {}

  async create(dto: CreateLocationHistoryDto, user: User) {
    const record = this.locationRepo.create({ ...dto, user });
    return this.locationRepo.save(record);
  }

  async findAllByUser(userId: string) {
    return this.locationRepo.find({
      where: { user: { id: userId } },
      relations: ['user'],
    });
  }
}
