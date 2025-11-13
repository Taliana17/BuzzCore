import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { LocationHistory } from './entities/location-history.entity';
import { CreateLocationHistoryDto } from './dto/create-location-history.dto';
import { User } from 'src/user/entities/user.entity';
import { NotificationService } from 'src/notification/services/notification.service';
import { UserService } from 'src/user/user.service';

@Injectable()
export class LocationHistoryService {
  private readonly logger = new Logger(LocationHistoryService.name);

  constructor(
    @InjectRepository(LocationHistory)
    private readonly locationRepo: Repository<LocationHistory>,

    private readonly notificationService: NotificationService,
    private readonly userService: UserService,
  ) {}

  /**
   * RECIBE LAT/LNG Y SE LO ENVÍA A NotificationService PARA:
   * - detectar ciudad
   * - obtener recomendación
   * - enviar notificación
   * - guardar el historial
   */
  async receiveAndProcessLocation(dto: CreateLocationHistoryDto, user: User) {
    if (!dto.lat || !dto.lng) {
      throw new BadRequestException('lat y lng son obligatorios');
    }

    this.logger.log(
      `Procesando ubicación para usuario ${user.id}: (${dto.lat}, ${dto.lng})`,
    );

    // Adaptar dto al formato de NotificationService
    const payload = {
      userId: user.id,
      lat: dto.lat,
      lng: dto.lng,
      city: dto.city ?? undefined,
// la ciudad la detecta Google
    };

    // Mandar toda la lógica al NotificationService
    const resultado = await this.notificationService.processLocationAndNotify(
      payload,
      this.userService,
      this,
    );

    return resultado;
  }

  /**
   * Usado internamente por NotificationService
   * para guardar historial
   */
  async create(data: { city: string; coordinates: any }, user: User) {
    const registro = this.locationRepo.create({
      city: data.city,
      coordinates: data.coordinates,
      user,
    });

    return await this.locationRepo.save(registro);
  }

  /**
   * Obtener historial completo del usuario
   */
  async findAllByUser(userId: string) {
    return await this.locationRepo.find({
      where: { user: { id: userId } },
      relations: ['user'],
      order: { arrival_date: 'DESC' },
    });
  }
}
