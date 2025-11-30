import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

export interface GoogleProfile {
  id: string;
  emails: Array<{ value: string; verified?: boolean }>;
  name?: {
    givenName?: string;
    familyName?: string;
  };
  photos?: Array<{ value: string }>;
}

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private configService: ConfigService) {
    const clientID = configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = configService.get<string>('GOOGLE_CLIENT_SECRET');
    if (!clientID || !clientSecret) {
      throw new Error('GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be defined in environment variables');
    }
    
    // Build full callback URL
    const backendUrl = configService.get<string>('BACKEND_URL') || 
                      `http://localhost:${configService.get<string>('PORT', '3001')}`;
    const callbackPath = configService.get<string>('GOOGLE_CALLBACK_URL', '/auth/google/callback');
    const callbackURL = callbackPath.startsWith('http') 
      ? callbackPath 
      : `${backendUrl}${callbackPath}`;
    
    super({
      clientID,
      clientSecret,
      callbackURL,
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: GoogleProfile,
    done: VerifyCallback,
  ): Promise<any> {
    const { id, emails, name, photos } = profile;
    const user = {
      id, // Keep the original id for compatibility
      googleId: id,
      email: emails?.[0]?.value,
      name: name ? `${name.givenName || ''} ${name.familyName || ''}`.trim() : undefined,
      picture: photos?.[0]?.value,
      accessToken,
    };
    done(null, user);
  }
}

