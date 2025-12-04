import { Controller, Get, Post, UseGuards, Req, Res, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { AuthService } from './auth.service';
import { GoogleProfile } from '../../APP.Infrastructure/auth/google.strategy';

// In-memory cache for location during OAuth flow (keyed by timestamp + random)
// In production, consider using Redis or a proper session store
const locationCache = new Map<string, { latitude: number; longitude: number; address?: string }>();

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

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
    
    const result = await this.authService.handleGoogleLogin(user, location);
    
    // Redirect to frontend with token
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/auth/callback?token=${result.token}`);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout() {
    // JWT is stateless, so logout is handled client-side
    return { message: 'Logged out successfully' };
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  async getProfile(@Req() req: Request) {
    return req.user;
  }
}

