import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserService } from '../../APP.BLL/services/user.service';
import { AuthJwtService } from '../../APP.Infrastructure/auth/jwt.service';
import { JwtStrategy } from '../../APP.Infrastructure/auth/jwt.strategy';
import { GoogleStrategy } from '../../APP.Infrastructure/auth/google.strategy';
import { PrismaModule } from '../../APP.Infrastructure/prisma/prisma.module';
import { AuthSessionService } from '../../APP.BLL/services/auth-session.service';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET');
        if (!secret) {
          throw new Error('JWT_SECRET is not defined in environment variables');
        }
        const expiresIn = configService.get<string>('JWT_EXPIRES_IN', '7d');
        return {
          secret,
          signOptions: {
            expiresIn: expiresIn as any,
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    UserService,
    AuthJwtService,
    JwtStrategy,
    GoogleStrategy,
    AuthSessionService,
  ],
  exports: [AuthService, AuthJwtService],
})
export class AuthModule {}

