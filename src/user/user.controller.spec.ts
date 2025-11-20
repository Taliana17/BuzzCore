import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UseGuards } from '@nestjs/common';




const mockJwtAuthGuard = {
  canActivate: (context: ExecutionContext) => true, // simula que el guard permite el acceso
};

// Mock básico del servicio
const mockUserService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
};

describe('UserController', () => {
    let controller: UserController;
    let service: UserService;

    beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
        controllers: [UserController],
        providers: [
        {
            provide: UserService,
            useValue: mockUserService,
        },
        {
        provide: JwtAuthGuard,
        useValue: mockJwtAuthGuard,
        },
        ],
    }).compile();

    controller = module.get<UserController>(UserController);
    service = module.get<UserService>(UserService);
    });

    it('el controlador debe estar definido', () => {
    expect(controller).toBeDefined();
    });

    it('findAll debe estar protegido por JwtAuthGuard', () => {
    const guards = Reflect.getMetadata('__guards__', controller.findAll);
    expect(guards).toBeDefined();
    });

    it('findOne debe estar protegido por JwtAuthGuard', () => {
    const guards = Reflect.getMetadata('__guards__', controller.findOne);
    expect(guards).toBeDefined();
    });

    it('remove debe estar protegido por JwtAuthGuard', () => {
    const guards = Reflect.getMetadata('__guards__', controller.remove);
    expect(guards).toBeDefined();
    });



  // ─── POST ───────────────────────────────────────────────
    describe('create', () => {
    it('debe llamar al servicio.create con el DTO correcto', async () => {
        const createDto: CreateUserDto = {
        name: 'Carlos',
        email: 'carlos@example.com',
        password: 'strongPass123',
        preferred_channel: 'email',
        };

        const expectedResult = { id: '1', ...createDto };
        mockUserService.create.mockResolvedValue(expectedResult);

        const result = await controller.create(createDto);

        expect(service.create).toHaveBeenCalledWith(createDto);
        expect(result).toEqual(expectedResult);
    });
    });

  // ─── GET ALL ───────────────────────────────────────────────
    describe('findAll', () => {
    it('debe retornar todos los usuarios', async () => {
        const mockResult = [{ id: '1' }, { id: '2' }];
        mockUserService.findAll.mockResolvedValue(mockResult);

        const result = await controller.findAll();

        expect(service.findAll).toHaveBeenCalled();
        expect(result).toEqual(mockResult);
    });
    });

  // ─── GET ONE ───────────────────────────────────────────────
    describe('findOne', () => {
    it('debe retornar un usuario por ID', async () => {
        const id = '10';
        const mockResult = { id: '10', name: 'Laura' };
        mockUserService.findOne.mockResolvedValue(mockResult);

        const result = await controller.findOne(id);

        expect(service.findOne).toHaveBeenCalledWith(id);
        expect(result).toEqual(mockResult);
    });
    });

    describe('findOne', () => {
    it('debe propagar NotFoundException si el servicio lanza error', async () => {
    const id = '999';
    mockUserService.findOne.mockRejectedValue(new Error('User not found'));

    await expect(controller.findOne(id)).rejects.toThrow('User not found');
    expect(service.findOne).toHaveBeenCalledWith(id);
    });
    });


  // ─── DELETE ───────────────────────────────────────────────
    describe('remove', () => {
    it('debe eliminar un usuario por ID', async () => {
        const id = '7';
        const mockResult = { affected: 1 };
        mockUserService.remove.mockResolvedValue(mockResult);

        const result = await controller.remove(id);

        expect(service.remove).toHaveBeenCalledWith(id);
        expect(result).toEqual(mockResult);
    });
    });

    describe('remove', () => {
    it('debe propagar NotFoundException si el servicio lanza error', async () => {
    const id = '999';
    mockUserService.remove.mockRejectedValue(new Error('User not found'));

    await expect(controller.remove(id)).rejects.toThrow('User not found');
    expect(service.remove).toHaveBeenCalledWith(id);
    });
    });

   // _____________________DTO___________________________________
    it('create: debe pasar el DTO tal cual al servicio', async () => {
    const dto = { name: 'Carlos' } as any; // incompleto
    mockUserService.create.mockResolvedValue({ id: '1', ...dto });
    const result = await controller.create(dto);
    expect(service.create).toHaveBeenCalledWith(dto);
    expect(result).toEqual({ id: '1', ...dto });
    });

    

});