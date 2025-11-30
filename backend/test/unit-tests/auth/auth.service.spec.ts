import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../../../src/APP.API/auth/auth.service';
import { UserService } from '../../../src/APP.BLL/services/user.service';
import { AuthJwtService } from '../../../src/APP.Infrastructure/auth/jwt.service';
import { createMockJwtService } from '../../setup/mocks/mockJwtService';

describe('AuthService', () => {
  let service: AuthService;
  let userService: jest.Mocked<UserService>;
  let jwtService: jest.Mocked<AuthJwtService>;

  beforeEach(async () => {
    const mockUserService = {
      findOrCreateByGoogle: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: AuthJwtService,
          useValue: createMockJwtService(),
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userService = module.get(UserService);
    jwtService = module.get(AuthJwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('handleGoogleLogin', () => {
    it('should handle Google login and return token and user', async () => {
      const googleUser = {
        id: 'google-id',
        name: 'Test User',
        emails: [{ value: 'test@example.com' }],
        accessToken: 'access-token',
      };

      const mockUser = {
        id: 'user-id',
        email: 'test@example.com',
        name: 'Test User',
        role: 'OWNER' as const,
      };

      userService.findOrCreateByGoogle.mockResolvedValue(mockUser as any);
      jwtService.generateToken.mockResolvedValue('jwt-token');

      const result = await service.handleGoogleLogin(googleUser);

      expect(result).toEqual({
        token: 'jwt-token',
        user: {
          id: 'user-id',
          email: 'test@example.com',
          name: 'Test User',
          role: 'OWNER',
        },
      });
      expect(userService.findOrCreateByGoogle).toHaveBeenCalledWith({
        googleId: 'google-id',
        email: 'test@example.com',
        name: 'Test User',
      });
      expect(jwtService.generateToken).toHaveBeenCalledWith({
        sub: 'user-id',
        email: 'test@example.com',
        role: 'OWNER',
      });
    });
  });
});

