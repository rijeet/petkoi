import { Controller, Get, Post, UseGuards, Req, Res, HttpCode, HttpStatus, Query, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { AuthService } from './auth.service';
import { GoogleProfile } from '../../APP.Infrastructure/auth/google.strategy';

// In-memory cache for location during OAuth flow (keyed by timestamp + random)
// In production, consider using Redis or a proper session store
const locationCache = new Map<string, { latitude: number; longitude: number; address?: string }>();
const REFRESH_COOKIE_NAME = 'refresh_token';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  private buildRefreshCookieValue(sessionId: string, refreshToken: string) {
    return `${sessionId}.${refreshToken}`;
  }

  private parseRefreshCookie(raw?: string): { sessionId: string; refreshToken: string } {
    if (!raw) {
      throw new UnauthorizedException('Missing refresh token');
    }
    const parts = raw.split('.');
    if (parts.length < 2) {
      throw new UnauthorizedException('Malformed refresh token');
    }
    const sessionId = parts.shift();
    const refreshToken = parts.join('.');
    if (!sessionId || !refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    return { sessionId, refreshToken };
  }

  private setRefreshCookie(res: Response, value: string, expiresAt: Date) {
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie(REFRESH_COOKIE_NAME, value, {
      httpOnly: true,
      secure: isProd ? true : false,
      sameSite: 'none',
      path: '/',
      expires: expiresAt,
    });
  }

  private clearRefreshCookie(res: Response) {
    const isProd = process.env.NODE_ENV === 'production';
    res.clearCookie(REFRESH_COOKIE_NAME, {
      httpOnly: true,
      secure: isProd ? true : false,
      sameSite: 'none',
      path: '/',
    });
  }

  private extractRefreshCookie(req: Request): string | undefined {
    const parsed = (req as any).cookies?.[REFRESH_COOKIE_NAME];
    if (parsed) return parsed;
    const rawHeader = req.headers.cookie;
    if (!rawHeader) return undefined;
    const match = rawHeader
      .split(';')
      .map((item) => item.trim())
      .find((item) => item.startsWith(`${REFRESH_COOKIE_NAME}=`));
    if (!match) return undefined;
    return match.split('=')[1];
  }

  @Get('google')
  @Public()
  @UseGuards(AuthGuard('google'))
  async googleAuth(@Req() req: Request, @Query('lat') lat?: string, @Query('lng') lng?: string, @Query('address') address?: string) {
    // Store location in cache if provided via query params
    // Generate a cache key based on timestamp and store it in a cookie/header
    if (lat && lng) {
      const cacheKey = `loc_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      locationCache.set(cacheKey, {
        latitude: parseFloat(lat),
        longitude: parseFloat(lng),
        address: address || undefined,
      });
      // Store cache key in a cookie that will be preserved through OAuth redirects
      // Note: This is a simple approach. In production, use proper session management
      (req as any).locationCacheKey = cacheKey;
    }
    // Guard redirects to Google
  }

  @Get('google/callback')
  @Public()
  @UseGuards(AuthGuard('google'))
  async googleAuthCallback(@Req() req: Request, @Res() res: Response) {
    // The GoogleStrategy returns a flattened user object with email, name, picture as strings
    const user = req.user as any;
    
    // Try to retrieve location from cache (if stored before OAuth)
    let location: { latitude: number; longitude: number; address?: string } | undefined;
    const cacheKey = (req as any).locationCacheKey;
    if (cacheKey) {
      location = locationCache.get(cacheKey);
      if (location) {
        // Clean up cache entry
        locationCache.delete(cacheKey);
      }
    }
    
    // Also check query params as fallback (frontend can pass location after OAuth)
    const lat = req.query.lat as string | undefined;
    const lng = req.query.lng as string | undefined;
    const address = req.query.address as string | undefined;
    if (lat && lng && !location) {
      location = {
        latitude: parseFloat(lat),
        longitude: parseFloat(lng),
        address: address || undefined,
      };
    }
    
    const result = await this.authService.handleGoogleLogin(user, location, {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] as string | undefined,
    });
    this.setRefreshCookie(
      res,
      this.buildRefreshCookieValue(result.sessionId, result.refreshToken),
      result.refreshExpiresAt,
    );
    
    // Redirect to frontend with token
    // Use FRONTEND_URL from env if set, otherwise fallback to localhost
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/auth/callback?token=${result.accessToken}`);
  }

  @Post('logout')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const raw = this.extractRefreshCookie(req);
    if (raw) {
      try {
        const parsed = this.parseRefreshCookie(raw);
        await this.authService.revokeSession(parsed.sessionId);
      } catch {
        // ignore parse/lookup failures
      }
    }
    this.clearRefreshCookie(res);
    return { message: 'Logged out successfully' };
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  async getProfile(@Req() req: Request) {
    return req.user;
  }

  @Post('refresh')
  @Public()
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const raw = this.extractRefreshCookie(req);
    if (!raw) {
      throw new UnauthorizedException('Missing refresh token');
    }

    const { sessionId, refreshToken } = this.parseRefreshCookie(raw);
    const refreshed = await this.authService.refreshTokens({
      sessionId,
      refreshToken,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] as string | undefined,
    });

    this.setRefreshCookie(
      res,
      this.buildRefreshCookieValue(refreshed.sessionId, refreshed.refreshToken),
      refreshed.refreshExpiresAt,
    );

    return {
      accessToken: refreshed.accessToken,
      expiresIn: 15 * 60, // 15 minutes in seconds
    };
  }
}

