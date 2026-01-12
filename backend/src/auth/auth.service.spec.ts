import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;

  const mockUsersService = {
    findOne: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user result without password if validation succeeds', async () => {
      const password = 'password';
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = { id: 1, username: 'test', password: hashedPassword };

      mockUsersService.findOne.mockResolvedValue(user);

      const result = await service.validateUser('test', password);
      expect(result).toEqual({ id: 1, username: 'test' });
      expect(mockUsersService.findOne).toHaveBeenCalledWith('test');
    });

    it('should return null if user not found', async () => {
      mockUsersService.findOne.mockResolvedValue(null);
      const result = await service.validateUser('test', 'password');
      expect(result).toBeNull();
    });

    it('should return null if password does not match', async () => {
      const password = 'password';
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = { id: 1, username: 'test', password: hashedPassword };

      mockUsersService.findOne.mockResolvedValue(user);

      const result = await service.validateUser('test', 'wrongpassword');
      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return access_token and user info', async () => {
      const user = { id: 1, username: 'test' };
      const token = 'jwt_token';
      mockJwtService.sign.mockReturnValue(token);

      const result = await service.login(user);

      expect(result).toEqual({
        access_token: token,
        user: {
          id: user.id,
          username: user.username,
        },
      });
      expect(mockJwtService.sign).toHaveBeenCalledWith({ username: user.username, sub: user.id });
    });
  });
});
