import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { NotFoundException } from '@nestjs/common';

// Mock de entidad
const mockUserEntity: User = {
  id: '1',
  name: 'Sopaci',
  email: 'sopaci@example.com',
  password: 'securePass123',
  preferred_channel: 'email',
  phone: '3001234567',
  last_detected_city: 'Cúcuta',
  role: 'user', 
  location_history: [],
  notifications: [],
};


// Mock del repositorio
const mockUserRepository = {
  create: jest.fn().mockReturnValue(mockUserEntity),
  save: jest.fn().mockResolvedValue(mockUserEntity),
  find: jest.fn().mockResolvedValue([mockUserEntity]),
  findOne: jest.fn(({ where }) => {
    if (where.id === '1') return Promise.resolve(mockUserEntity);
    if (where.email === 'carlos@example.com') return Promise.resolve(mockUserEntity);
    return Promise.resolve(null);
  }),
  remove: jest.fn().mockResolvedValue(undefined),
};

describe('Pruebas unitarias de UserService', () => {
  let service: UserService;
  let repository: Repository<User>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: getRepositoryToken(User), useValue: mockUserRepository },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    repository = module.get<Repository<User>>(getRepositoryToken(User));
    jest.clearAllMocks();
  });

  it('Debe estar definido el servicio', () => {
    expect(service).toBeDefined();
  });

  // ─── CREATE ───────────────────────────────────────────────
  it('create: debe crear y guardar un nuevo usuario', async () => {
    const dto: CreateUserDto = {
      name: 'Carlos',
      email: 'carlos@example.com',
      password: 'securePass123',
      preferred_channel: 'email',
    };

    const result = await service.create(dto);

    expect(repository.create).toHaveBeenCalledWith(dto);
    expect(repository.save).toHaveBeenCalledWith(mockUserEntity);
    expect(result).toEqual(mockUserEntity);
  });

  it('create: debe lanzar error si save falla', async () => {
  mockUserRepository.save.mockRejectedValue(new Error('Error al guardar'));
  await expect(service.create({
    name: 'Carlos',
    email: 'carlos@example.com',
    password: 'securePass123',
    preferred_channel: 'email',
  })).rejects.toThrow('Error al guardar');
});


  // ─── FIND ALL ─────────────────────────────────────────────
  it('findAll: debe retornar todos los usuarios', async () => {
    const result = await service.findAll();

    expect(repository.find).toHaveBeenCalled();
    expect(result).toEqual([mockUserEntity]);
  });

  it('findAll: debe lanzar error si el repositorio falla', async () => {
  mockUserRepository.find.mockRejectedValue(new Error('Error inesperado'));

  await expect(service.findAll()).rejects.toThrow('Error inesperado');
});


  // ─── FIND ONE ─────────────────────────────────────────────
  it('findOne: debe retornar un usuario por ID', async () => {
    const result = await service.findOne('1');

    expect(repository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
    expect(result).toEqual(mockUserEntity);
  });

  it('findOne: debe lanzar NotFoundException si el usuario no existe', async () => {
    await expect(service.findOne('999')).rejects.toThrow(NotFoundException);
    expect(repository.findOne).toHaveBeenCalledWith({ where: { id: '999' } });
  });

  // ─── FIND BY EMAIL ────────────────────────────────────────
  it('findByEmail: debe retornar un usuario por email', async () => {
    const result = await service.findByEmail('carlos@example.com');

    expect(repository.findOne).toHaveBeenCalledWith({ where: { email: 'carlos@example.com' } });
    expect(result).toEqual(mockUserEntity);
  });

  it('findByEmail: debe retornar null si el email no existe', async () => {
    const result = await service.findByEmail('no@existe.com');

    expect(result).toBeNull();
  });

  // ─── UPDATE ───────────────────────────────────────────────
  it('update: debe lanzar NotFoundException si el usuario no existe', async () => {
  await expect(service.update('999', { name: 'Nuevo' })).rejects.toThrow(NotFoundException);
  });

  it('update: debe modificar los datos del usuario', async () => {
    const updateDto: UpdateUserDto = { name: 'Carlos Actualizado' };
    const updatedUser = { ...mockUserEntity, ...updateDto };

    mockUserRepository.save.mockResolvedValue(updatedUser);

    const result = await service.update('1', updateDto);

    expect(repository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
    expect(repository.save).toHaveBeenCalledWith(updatedUser);
    expect(result.name).toBe('Carlos Actualizado');
  });

  // ─── REMOVE ───────────────────────────────────────────────
  it('remove: debe eliminar el usuario por ID', async () => {
    const result = await service.remove('1');

    expect(repository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
    expect(repository.remove).toHaveBeenCalledWith(mockUserEntity);
    expect(result).toBeUndefined();
  });

  it('remove: debe lanzar NotFoundException si el usuario no existe', async () => {
  await expect(service.remove('999')).rejects.toThrow(NotFoundException);
});

});