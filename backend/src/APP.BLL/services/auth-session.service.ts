import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../APP.Infrastructure/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { randomBytes, randomUUID } from 'crypto';

const DEFAULT_REFRESH_DAYS = 7;
const BCRYPT_ROUNDS = 10;

@Injectable()
export class AuthSessionService {
  private readonly refreshTtlMs: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    const refreshDays =
      Number(this.configService.get<string>('JWT_REFRESH_DAYS')) ||
      DEFAULT_REFRESH_DAYS;
    this.refreshTtlMs = refreshDays * 24 * 60 * 60 * 1000;
  }

  private computeExpiryDate(): Date {
    return new Date(Date.now() + this.refreshTtlMs);
  }

  private static generateRawToken(): string {
    return randomBytes(64).toString('hex');
  }

  private static generateSessionId(): string {
    return randomUUID();
  }

  async createSession(params: {
    userId: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<{ sessionId: string; refreshToken: string; expiresAt: Date }> {
    const sessionId = AuthSessionService.generateSessionId();
    const refreshToken = AuthSessionService.generateRawToken();
    const refreshTokenHash = await bcrypt.hash(refreshToken, BCRYPT_ROUNDS);
    const expiresAt = this.computeExpiryDate();

    await this.prisma.userSession.create({
      data: {
        id: sessionId,
        userId: params.userId,
        refreshTokenHash,
        expiresAt,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      },
    });

    return { sessionId, refreshToken, expiresAt };
  }

  async rotateSession(params: {
    sessionId: string;
    providedRefreshToken: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<{ userId: string; refreshToken: string; expiresAt: Date }> {
    const session = await this.prisma.userSession.findUnique({
      where: { id: params.sessionId },
    });

    if (
      !session ||
      session.revokedAt ||
      !session.refreshTokenHash ||
      session.expiresAt < new Date()
    ) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const isValid = await bcrypt.compare(
      params.providedRefreshToken,
      session.refreshTokenHash,
    );
    if (!isValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const nextRefreshToken = AuthSessionService.generateRawToken();
    const nextRefreshHash = await bcrypt.hash(nextRefreshToken, BCRYPT_ROUNDS);
    const expiresAt = this.computeExpiryDate();

    await this.prisma.userSession.update({
      where: { id: params.sessionId },
      data: {
        refreshTokenHash: nextRefreshHash,
        expiresAt,
        revokedAt: null,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      },
    });

    return {
      userId: session.userId,
      refreshToken: nextRefreshToken,
      expiresAt,
    };
  }

  async revokeSession(sessionId: string): Promise<void> {
    try {
      await this.prisma.userSession.update({
        where: { id: sessionId },
        data: {
          revokedAt: new Date(),
        },
      });
    } catch {
      // If session is missing, treat as already revoked
    }
  }
}

