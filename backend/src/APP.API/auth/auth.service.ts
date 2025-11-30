import { Injectable } from '@nestjs/common';
import { UserService } from '../../APP.BLL/services/user.service';
import { AuthJwtService } from '../../APP.Infrastructure/auth/jwt.service';
import { GoogleProfile } from '../../APP.Infrastructure/auth/google.strategy';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: AuthJwtService,
  ) {}

  async handleGoogleLogin(googleUser: GoogleProfile & { accessToken: string; googleId?: string }) {
    // Find or create user
    // The googleUser might have 'id' (from GoogleProfile) or 'googleId' (from strategy)
    const googleId = (googleUser as any).googleId || googleUser.id;
    if (!googleId) {
      throw new Error('Google ID is missing from user profile');
    }

    const nameString = googleUser.name
      ? `${googleUser.name.givenName || ''} ${googleUser.name.familyName || ''}`.trim()
      : undefined;
    
    // Get email from Google profile, ensure it's not empty
    const email = googleUser.emails?.[0]?.value?.trim() || '';
    if (!email) {
      console.warn('Google profile did not include email:', googleUser);
    }
    
    const user = await this.userService.findOrCreateByGoogle({
      googleId,
      email: email || `user_${googleId}@temp.local`, // Fallback email if none provided
      name: nameString,
    });

    // Generate JWT token
    const token = await this.jwtService.generateToken({
      sub: user.id,
      email: user.email || undefined, // Only include if not empty
      role: user.role,
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }
}

