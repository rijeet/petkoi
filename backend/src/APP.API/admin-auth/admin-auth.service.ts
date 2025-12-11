import { Injectable, Logger, HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../APP.Infrastructure/prisma/prisma.service';
import { ResendService } from '../../APP.Infrastructure/email/resend.service';
import { AdminSessionService } from '../../APP.BLL/services/admin-session.service';
import { DomainException } from '@APP.Shared/exceptions/domain.exception';

const OTP_EXP_MINUTES = 10;
const OTP_LENGTH = 6;
const OTP_BCRYPT_ROUNDS = 8;
const OTP_MAX_ATTEMPTS = 3;
const OTP_LOCK_MINUTES = 60;

@Injectable()
export class AdminAuthService {
  private readonly logger = new Logger(AdminAuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly resendService: ResendService,
    private readonly adminSessionService: AdminSessionService,
  ) {}

  private generateOtpCode(): string {
    const code = Math.floor(100000 + Math.random() * 900000);
    return code.toString();
  }

  private async hashOtp(code: string) {
    return bcrypt.hash(code, OTP_BCRYPT_ROUNDS);
  }

  private async verifyOtpHash(code: string, hash: string) {
    return bcrypt.compare(code, hash);
  }

  async initiateLogin(email: string, password: string) {
    const admin = await this.prisma.adminUser.findUnique({ where: { email } });
    if (!admin) {
      this.logger.warn(`Login failed: admin not found for email=${email}`);
      throw new DomainException('Invalid credentials', HttpStatus.UNAUTHORIZED);
    }

    if (admin.otpLockedUntil && admin.otpLockedUntil > new Date()) {
      this.logger.warn(`Login blocked: locked until ${admin.otpLockedUntil.toISOString()} for admin=${email}`);
      throw new DomainException('OTP locked. Try again in 1 hour.', HttpStatus.UNAUTHORIZED);
    }

    const ok = await bcrypt.compare(password, admin.passwordHash);
    if (!ok) {
      this.logger.warn(`Login failed: bad password for admin=${email}`);
      throw new DomainException('Invalid credentials', HttpStatus.UNAUTHORIZED);
    }

    // throttle resends/creations: max 3 per hour, and at least 60s gap from last OTP
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const recentCount = await this.prisma.adminOtp.count({
      where: { adminId: admin.id, createdAt: { gte: oneHourAgo } },
    });
    if (recentCount >= 3) {
      this.logger.warn(`OTP throttled (hourly limit) for admin=${email}`);
      throw new DomainException('OTP throttled (hourly limit). Try again in 1 hour.', HttpStatus.UNAUTHORIZED);
    }
    const lastOtp = await this.prisma.adminOtp.findFirst({
      where: { adminId: admin.id },
      orderBy: { createdAt: 'desc' },
    });
    if (lastOtp && now.getTime() - lastOtp.createdAt.getTime() < 60 * 1000) {
      this.logger.warn(`OTP throttled (cooldown) for admin=${email}`);
      throw new DomainException('Please wait 60 seconds before requesting another code.', HttpStatus.UNAUTHORIZED);
    }

    const code = this.generateOtpCode();
    const codeHash = await this.hashOtp(code);
    const expiresAt = new Date(Date.now() + OTP_EXP_MINUTES * 60 * 1000);

    const otp = await this.prisma.adminOtp.create({
      data: {
        adminId: admin.id,
        codeHash,
        expiresAt,
      },
    });

    const html = `
      <div style="font-family: Arial, sans-serif; padding:16px; max-width:600px; margin:auto; color:#111">
        <div style="text-align:center; margin-bottom:16px;">
          <div style="display:inline-flex; align-items:center; gap:8px; font-size:22px; font-weight:700; color:#c8002a;">
            <span>Pet Koi Admin</span>
          </div>
          <p style="margin:4px 0 0; color:#444;">Admin Login Verification</p>
        </div>
        <div style="background:#f5f7fb; border:1px solid #e5e7eb; border-radius:12px; padding:16px; text-align:center;">
          <p style="margin:0 0 8px; font-weight:600; font-size:18px;">Your Admin Verification Code</p>
          <div style="font-size:32px; letter-spacing:8px; font-weight:700; color:#c8002a; padding:12px 0;">
            ${code}
          </div>
          <p style="margin:0; color:#555; font-size:14px;">This code is valid for ${OTP_EXP_MINUTES} minutes.</p>
        </div>
        <div style="margin-top:16px; padding:12px; background:#fff7e6; border:1px solid #fcd34d; border-radius:10px; color:#7a5b00; font-size:13px;">
          <ul style="padding-left:18px; margin:0;">
            <li>Do not share this code with anyone.</li>
            <li>If you did not request this login, contact support immediately.</li>
            <li>After entering the code, you will stay signed in for 7 days.</li>
          </ul>
        </div>
        <p style="margin-top:16px; color:#777; font-size:12px; text-align:center;">
          Sent from Pet Koi Admin via Resend.
        </p>
      </div>
    `;

    await this.resendService.sendEmail({
      to: admin.email,
      subject: 'Pet Koi Admin OTP Code',
      text: `Your verification code is ${code}. It expires in ${OTP_EXP_MINUTES} minutes.`,
      html,
    });

    const otpToken = await this.jwtService.signAsync(
      { adminId: admin.id, otpId: otp.id, scope: 'admin-otp' },
      { expiresIn: `${OTP_EXP_MINUTES}m`, secret: process.env.JWT_SECRET },
    );

    return { otpToken };
  }

  async verifyOtpAndIssueTokens(
    otpToken: string,
    code: string,
    context?: { ipAddress?: string; userAgent?: string },
  ) {
    let decoded: any;
    try {
      decoded = await this.jwtService.verifyAsync(otpToken, { secret: process.env.JWT_SECRET });
    } catch {
      this.logger.warn('Resend OTP failed: invalid/expired otpToken');
      throw new DomainException('Invalid or expired OTP token', HttpStatus.UNAUTHORIZED);
    }
    if (decoded.scope !== 'admin-otp') {
      throw new DomainException('Invalid OTP token scope', HttpStatus.UNAUTHORIZED);
    }

    const otp = await this.prisma.adminOtp.findUnique({
      where: { id: decoded.otpId },
      include: { admin: true },
    });
    if (!otp || !otp.admin) {
      throw new DomainException('OTP not found', HttpStatus.UNAUTHORIZED);
    }
    if (otp.admin.otpLockedUntil && otp.admin.otpLockedUntil > new Date()) {
      throw new DomainException('OTP locked. Try again in 1 hour.', HttpStatus.UNAUTHORIZED);
    }
    if (otp.consumedAt) {
      throw new DomainException('OTP already used', HttpStatus.UNAUTHORIZED);
    }
    if (otp.expiresAt < new Date()) {
      throw new DomainException('OTP expired', HttpStatus.UNAUTHORIZED);
    }

    const valid = await this.verifyOtpHash(code, otp.codeHash);
    if (!valid) {
      const attempts = (otp.attempts || 0) + 1;
      await this.prisma.adminOtp.update({
        where: { id: otp.id },
        data: { attempts },
      });
      const lock = attempts >= OTP_MAX_ATTEMPTS;
      if (lock) {
        await this.prisma.adminUser.update({
          where: { id: otp.adminId },
          data: {
            otpFailedCount: 0,
            otpLockedUntil: new Date(Date.now() + OTP_LOCK_MINUTES * 60 * 1000),
          },
        });
      } else {
        await this.prisma.adminUser.update({
          where: { id: otp.adminId },
          data: { otpFailedCount: { increment: 1 } },
        });
      }
      throw new DomainException(
        lock ? 'OTP locked. Try again in 1 hour.' : 'Invalid OTP code',
        HttpStatus.UNAUTHORIZED,
      );
    }

    // reset counters on success
    await this.prisma.adminUser.update({
      where: { id: otp.adminId },
      data: {
        otpFailedCount: 0,
        otpLockedUntil: null,
      },
    });

    await this.prisma.adminOtp.update({
      where: { id: otp.id },
      data: { consumedAt: new Date() },
    });

    const payload = {
      sub: otp.admin.id,
      role: otp.admin.role,
      scope: 'admin',
    };
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: '15m',
    });
    const session = await this.adminSessionService.createSession({
      adminId: otp.admin.id,
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
    });

    const refreshCookieValue = `${session.sessionId}.${session.refreshToken}`;

    return {
      accessToken,
      refreshCookieValue,
      refreshExpiresAt: session.expiresAt,
      role: otp.admin.role,
    };
  }

  private parseRefreshCookie(raw: string): { sessionId: string; refreshToken: string } {
    const parts = raw.split('.');
    if (parts.length < 2) {
      throw new DomainException('Malformed refresh token', HttpStatus.UNAUTHORIZED);
    }
    const sessionId = parts.shift();
    const refreshToken = parts.join('.');
    if (!sessionId || !refreshToken) {
      throw new DomainException('Malformed refresh token', HttpStatus.UNAUTHORIZED);
    }
    return { sessionId, refreshToken };
  }

  async refreshTokens(
    rawCookie: string,
    context?: { ipAddress?: string; userAgent?: string },
  ) {
    const { sessionId, refreshToken } = this.parseRefreshCookie(rawCookie);
    const rotation = await this.adminSessionService.rotateSession({
      sessionId,
      providedRefreshToken: refreshToken,
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
    });

    const admin = await this.prisma.adminUser.findUnique({ where: { id: rotation.adminId } });
    if (!admin) {
      throw new DomainException('Admin not found', HttpStatus.UNAUTHORIZED);
    }

    const payload = {
      sub: admin.id,
      role: admin.role,
      scope: 'admin',
    };
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: '15m',
    });

    const refreshCookieValue = `${sessionId}.${rotation.refreshToken}`;

    return {
      accessToken,
      refreshCookieValue,
      refreshExpiresAt: rotation.expiresAt,
      role: admin.role,
    };
  }

  async revokeSession(rawCookie: string) {
    const { sessionId } = this.parseRefreshCookie(rawCookie);
    await this.adminSessionService.revokeSession(sessionId);
  }

  async resendOtp(otpToken: string) {
    let decoded: any;
    try {
      decoded = await this.jwtService.verifyAsync(otpToken, { secret: process.env.JWT_SECRET });
    } catch {
      throw new DomainException('Invalid or expired OTP token', HttpStatus.UNAUTHORIZED);
    }
    if (decoded.scope !== 'admin-otp') {
      throw new DomainException('Invalid OTP token scope', HttpStatus.UNAUTHORIZED);
    }

    const admin = await this.prisma.adminUser.findUnique({ where: { id: decoded.adminId } });
    if (!admin) {
      this.logger.warn('Resend OTP failed: admin not found for token');
      throw new DomainException('Admin not found', HttpStatus.UNAUTHORIZED);
    }
    if (admin.otpLockedUntil && admin.otpLockedUntil > new Date()) {
      this.logger.warn(`Resend OTP blocked: locked until ${admin.otpLockedUntil.toISOString()} for admin=${admin.email}`);
      throw new DomainException('OTP locked. Try again in 1 hour.', HttpStatus.UNAUTHORIZED);
    }

    // throttle resends: max 3 per hour, and at least 60s gap from last OTP
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const recentCount = await this.prisma.adminOtp.count({
      where: { adminId: admin.id, createdAt: { gte: oneHourAgo } },
    });
    if (recentCount >= 3) {
      this.logger.warn(`Resend OTP throttled (hourly limit) for admin=${admin.email}`);
      throw new DomainException('OTP throttled (hourly limit). Try again in 1 hour.', HttpStatus.UNAUTHORIZED);
    }
    const lastOtp = await this.prisma.adminOtp.findFirst({
      where: { adminId: admin.id },
      orderBy: { createdAt: 'desc' },
    });
    if (lastOtp && now.getTime() - lastOtp.createdAt.getTime() < 60 * 1000) {
      this.logger.warn(`Resend OTP throttled (cooldown) for admin=${admin.email}`);
      throw new DomainException('Please wait 60 seconds before requesting another code.', HttpStatus.UNAUTHORIZED);
    }

    const code = this.generateOtpCode();
    const codeHash = await this.hashOtp(code);
    const expiresAt = new Date(Date.now() + OTP_EXP_MINUTES * 60 * 1000);

    await this.prisma.adminOtp.create({
      data: {
        adminId: admin.id,
        codeHash,
        expiresAt,
      },
    });

    const html = `
      <div style="font-family: Arial, sans-serif; padding:16px; max-width:600px; margin:auto; color:#111">
        <div style="text-align:center; margin-bottom:16px;">
          <div style="display:inline-flex; align-items:center; gap:8px; font-size:22px; font-weight:700; color:#c8002a;">
            <span>Pet Koi Admin</span>
          </div>
          <p style="margin:4px 0 0; color:#444;">Admin Login Verification</p>
        </div>
        <div style="background:#f5f7fb; border:1px solid #e5e7eb; border-radius:12px; padding:16px; text-align:center;">
          <p style="margin:0 0 8px; font-weight:600; font-size:18px;">Your Admin Verification Code</p>
          <div style="font-size:32px; letter-spacing:8px; font-weight:700; color:#c8002a; padding:12px 0;">
            ${code}
          </div>
          <p style="margin:0; color:#555; font-size:14px;">This code is valid for ${OTP_EXP_MINUTES} minutes.</p>
        </div>
        <div style="margin-top:16px; padding:12px; background:#fff7e6; border:1px solid #fcd34d; border-radius:10px; color:#7a5b00; font-size:13px;">
          <ul style="padding-left:18px; margin:0;">
            <li>Do not share this code with anyone.</li>
            <li>If you did not request this login, contact support immediately.</li>
            <li>After entering the code, you will stay signed in for 7 days.</li>
          </ul>
        </div>
        <p style="margin-top:16px; color:#777; font-size:12px; text-align:center;">
          Sent from Pet Koi Admin via Resend.
        </p>
      </div>
    `;

    await this.resendService.sendEmail({
      to: admin.email,
      subject: 'Pet Koi Admin OTP Code',
      text: `Your verification code is ${code}. It expires in ${OTP_EXP_MINUTES} minutes.`,
      html,
    });
  }
}

