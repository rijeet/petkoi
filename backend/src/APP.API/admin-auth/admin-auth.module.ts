import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../../APP.Infrastructure/prisma/prisma.module';
import { AdminAuthController } from './admin-auth.controller';
import { AdminAuthService } from './admin-auth.service';
import { ResendService } from '../../APP.Infrastructure/email/resend.service';
import { AdminSessionService } from '../../APP.BLL/services/admin-session.service';
import { AdminJwtStrategy } from '../../APP.Infrastructure/auth/admin-jwt.strategy';

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
    }),
  ],
  controllers: [AdminAuthController],
  providers: [AdminAuthService, ResendService, AdminSessionService, AdminJwtStrategy],
  exports: [AdminAuthService],
})
export class AdminAuthModule {}

