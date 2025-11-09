import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  // 🔹 Obtener todos los usuarios
  async findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  // 🔹 Buscar un usuario por su ID
  async findOne(id: number): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`Usuario con id ${id} no encontrado`);
    }
    return user;
  }

  // 🔹 Crear un nuevo usuario
  async create(data: CreateUserDto): Promise<User> {
    const newUser = this.userRepository.create(data);
    return this.userRepository.save(newUser);
  }

  // 🔹 Actualizar un usuario existente
  async update(id: number, data: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id); // si no existe, lanzará NotFoundException
    Object.assign(user, data); // mezcla los nuevos datos
    return this.userRepository.save(user);
  }

  // 🔹 Eliminar un usuario
  async remove(id: number): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepository.remove(user);
  }
}
