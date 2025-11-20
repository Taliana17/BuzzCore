import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

// Mock automático de bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

const mockUserService = {
  findByEmail: jest.fn(),
  create: jest.fn(),
};

const mockJwtService = {
  sign: jest.fn(),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserService, useValue: mockUserService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ----------------------------------------
  // REGISTER TESTS
  // ----------------------------------------
  describe('register', () => {
    it('should register a new user successfully', async () => {
      const dto: RegisterDto = {
        name: 'Alice',
        email: 'alice@example.com',
        password: '123456',
        phone: '+573001234567',
        preferred_channel: 'email',
      };

      mockUserService.findByEmail.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword123');

      mockUserService.create.mockResolvedValue({
        id: 'user-1',
        ...dto,
        password: 'hashedPassword123',
        role: 'user',
      });

      const result = await service.register(dto);

      expect(mockUserService.findByEmail).toHaveBeenCalledWith(dto.email);

      expect(bcrypt.hash).toHaveBeenCalledWith(dto.password, 10);

      expect(mockUserService.create).toHaveBeenCalledWith({
        ...dto,
        password: 'hashedPassword123',
        role: 'user', // ← CORRECTO
      });

      expect(result).toEqual({
        message: 'User registered successfully',
        user: {
          id: 'user-1',
          ...dto,
          password: 'hashedPassword123',
          role: 'user', // ← CORRECTO
        },
      });
    });

    it('should throw BadRequestException if email already exists', async () => {
      const dto: RegisterDto = {
        name: 'Alice',
        email: 'alice@example.com',
        password: '123456',
        phone: '+573001234567',
        preferred_channel: 'email',
      };

      mockUserService.findByEmail.mockResolvedValue({
        id: 'existing-user',
        email: dto.email,
      });

      await expect(service.register(dto)).rejects.toThrow(BadRequestException);

      expect(mockUserService.findByEmail).toHaveBeenCalledWith(dto.email);
      expect(bcrypt.hash).not.toHaveBeenCalled();
      expect(mockUserService.create).not.toHaveBeenCalled();
    });
  });

  // ----------------------------------------
  // LOGIN TESTS
  // ----------------------------------------
  describe('login', () => {
    it('should login successfully and return JWT token', async () => {
      const dto: LoginDto = {
        email: 'alice@example.com',
        password: '123456',
      };

      const mockUser = {
        id: 'user-1',
        email: dto.email,
        password: 'hashedPassword123',
        role: 'user',
        name: 'Alice',
      };

      mockUserService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.sign.mockReturnValue('mocked-jwt-token');

      const result = await service.login(dto);

      expect(mockUserService.findByEmail).toHaveBeenCalledWith(dto.email);

      expect(bcrypt.compare).toHaveBeenCalledWith(
        dto.password,
        mockUser.password,
      );

      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
      });

      expect(result).toEqual({
        access_token: 'mocked-jwt-token',
        user: {
          id: mockUser.id,
          name: mockUser.name,
          email: mockUser.email,
          role: mockUser.role,
        },
      });
    });

    it('should throw UnauthorizedException if user is not found', async () => {
      const dto: LoginDto = {
        email: 'nonexistent@example.com',
        password: '123456',
      };

      mockUserService.findByEmail.mockResolvedValue(null);

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);

      expect(mockUserService.findByEmail).toHaveBeenCalledWith(dto.email);
      expect(bcrypt.compare).not.toHaveBeenCalled();
      expect(mockJwtService.sign).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if password does not match', async () => {
      const dto: LoginDto = {
        email: 'alice@example.com',
        password: 'wrongPassword',
      };

      const mockUser = {
        id: 'user-1',
        email: dto.email,
        password: 'hashedPassword123',
        role: 'user',
      };

      mockUserService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);

      expect(mockUserService.findByEmail).toHaveBeenCalledWith(dto.email);
      expect(bcrypt.compare).toHaveBeenCalledWith(
        dto.password,
        mockUser.password,
      );
      expect(mockJwtService.sign).not.toHaveBeenCalled();
    });
  });
});
