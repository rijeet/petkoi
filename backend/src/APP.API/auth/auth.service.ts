import { Injectable } from '@nestjs/common';
import { UserService } from '../../APP.BLL/services/user.service';
import { AuthJwtService } from '../../APP.Infrastructure/auth/jwt.service';
import { GoogleProfile } from '../../APP.Infrastructure/auth/google.strategy';

// Type for the user object returned by GoogleStrategy (flattened)
interface GoogleStrategyUser {
  id: string;
  googleId: string;
  email?: string;
  name?: string;
  picture?: string;
  accessToken: string;
}

// Union type for both GoogleProfile (nested) and GoogleStrategyUser (flattened)
type GoogleUserInput = GoogleProfile & { accessToken: string } | GoogleStrategyUser;

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: AuthJwtService,
  ) {}

  async handleGoogleLogin(googleUser: GoogleUserInput) {
    // Find or create user
    // The googleUser might have 'id' (from GoogleProfile) or 'googleId' (from strategy)
    const googleId = 'googleId' in googleUser ? googleUser.googleId : googleUser.id;
    if (!googleId) {
      throw new Error('Google ID is missing from user profile');
    }

    // Get name - check if it's already a string (from strategy) or needs to be constructed
    let nameString: string | undefined;
    if ('name' in googleUser && typeof googleUser.name === 'string') {
      // Strategy already flattened it to a string
      nameString = googleUser.name;
    } else if ('name' in googleUser && googleUser.name && typeof googleUser.name === 'object') {
      // Original nested structure from GoogleProfile
      const nameObj = googleUser.name as { givenName?: string; familyName?: string };
      nameString = `${nameObj.givenName || ''} ${nameObj.familyName || ''}`.trim() || undefined;
    }
    
    // Get email - check if it's already flattened (from strategy) or needs to be extracted
    let email = '';
    if ('email' in googleUser && typeof googleUser.email === 'string') {
      // Strategy already flattened it
      email = googleUser.email.trim();
    } else if ('emails' in googleUser && googleUser.emails?.[0]?.value) {
      // Original nested structure from GoogleProfile
      email = googleUser.emails[0].value.trim();
    }
    
    if (!email) {
      console.warn('Google profile did not include email:', googleUser);
    }
    
    // Extract profile picture - check if it's already flattened (from strategy) or needs to be extracted
    let profilePicture: string | undefined;
    if ('picture' in googleUser && typeof googleUser.picture === 'string') {
      // Strategy already flattened it
      profilePicture = googleUser.picture;
    } else if ('photos' in googleUser && googleUser.photos?.[0]?.value) {
      // Original nested structure from GoogleProfile
      profilePicture = googleUser.photos[0].value;
    }

    const user = await this.userService.findOrCreateByGoogle({
      googleId,
      email: email || `user_${googleId}@temp.local`, // Fallback email if none provided
      name: nameString,
      profilePicture,
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
        profilePicture: user.profilePicture,
        role: user.role,
      },
    };
  }
}

