import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AdminAuthService } from './admin-auth.service';
import { Public } from '../../common/decorators/public.decorator';

const ADMIN_REFRESH_COOKIE = 'admin_refresh_token';

@Controller('admin')
export class AdminAuthController {
  constructor(private readonly adminAuthService: AdminAuthService) {}

  private setRefreshCookie(res: Response, value: string, expiresAt: Date) {
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie(ADMIN_REFRESH_COOKIE, value, {
      httpOnly: true,
      secure: isProd ? true : false,
      sameSite: 'none',
      path: '/',
      expires: expiresAt,
    });
  }

  private clearRefreshCookie(res: Response) {
    const isProd = process.env.NODE_ENV === 'production';
    res.clearCookie(ADMIN_REFRESH_COOKIE, {
      httpOnly: true,
      secure: isProd ? true : false,
      sameSite: 'none',
      path: '/',
    });
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: { email: string; password: string }) {
    if (!body.email || !body.password) {
      throw new BadRequestException('Email and password are required');
    }
    return this.adminAuthService.initiateLogin(body.email, body.password);
  }

  @Public()
  @Post('login/verify')
  @HttpCode(HttpStatus.OK)
  async verify(
    @Body() body: { otpToken: string; code: string },
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (!body.otpToken || !body.code) {
      throw new BadRequestException('OTP token and code are required');
    }
    const result = await this.adminAuthService.verifyOtpAndIssueTokens(body.otpToken, body.code, {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] as string | undefined,
    });
    this.setRefreshCookie(res, result.refreshCookieValue, result.refreshExpiresAt);
    return {
      accessToken: result.accessToken,
      role: result.role,
      expiresIn: 15 * 60,
    };
  }

  @Public()
  @Post('login/resend')
  @HttpCode(HttpStatus.OK)
  async resend(@Body() body: { otpToken: string }) {
    if (!body.otpToken) {
      throw new BadRequestException('OTP token is required');
    }
    await this.adminAuthService.resendOtp(body.otpToken);
    return { success: true };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const rawCookie =
      (req as any).cookies?.[ADMIN_REFRESH_COOKIE] ||
      (req.headers.cookie || '')
        .split(';')
        .map((s) => s.trim())
        .find((c) => c.startsWith(`${ADMIN_REFRESH_COOKIE}=`))
        ?.split('=')[1];

    if (!rawCookie) {
      throw new BadRequestException('Missing refresh token');
    }

    const result = await this.adminAuthService.refreshTokens(rawCookie, {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] as string | undefined,
    });
    this.setRefreshCookie(res, result.refreshCookieValue, result.refreshExpiresAt);
    return {
      accessToken: result.accessToken,
      role: result.role,
      expiresIn: 15 * 60,
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const rawCookie =
      (req as any).cookies?.[ADMIN_REFRESH_COOKIE] ||
      (req.headers.cookie || '')
        .split(';')
        .map((s) => s.trim())
        .find((c) => c.startsWith(`${ADMIN_REFRESH_COOKIE}=`))
        ?.split('=')[1];

    if (rawCookie) {
      await this.adminAuthService.revokeSession(rawCookie);
    }
    this.clearRefreshCookie(res);
    return { success: true };
  }
}

