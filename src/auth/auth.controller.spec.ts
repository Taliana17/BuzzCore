import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

const mockAuthService = {
  register: jest.fn(),
  login: jest.fn(),
};

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // Register
  describe('register', () => {
    it('should call authService.register and return result', async () => {
      const dto: RegisterDto = {
        name: 'Alice',
        email: 'alice@example.com',
        password: '123456',
        phone: '+573001234567',
        preferred_channel: 'email',
      };

      const mockResult = { message: 'User registered successfully', user: { id: 'user-1', ...dto } };
      mockAuthService.register.mockResolvedValue(mockResult);

      const result = await controller.register(dto);

      expect(mockAuthService.register).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockResult);
    });
  });

  //Login
  describe('login', () => {
    it('should call authService.login and return JWT', async () => {
      const dto: LoginDto = { email: 'alice@example.com', password: '123456' };
      const mockResult = {
        access_token: 'jwt-token',
        user: { id: 'user-1', email: dto.email, name: 'Alice', role: 'user' },
      };

      mockAuthService.login.mockResolvedValue(mockResult);

      const result = await controller.login(dto);

      expect(mockAuthService.login).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockResult);
    });
  });
});