import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
  ],
  callbacks: {
    async signIn({ user: _user, account }) {
      if (account?.provider === 'google' && account.access_token) {
        try {
          // Exchange Google token with backend to get JWT
          // Backend redirects with token, so we'll handle it in the callback page
          // For now, just allow sign in
          await fetch(`${API_URL}/auth/google/callback`, {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${account.access_token}`,
            },
          });
          
          return true;
        } catch (error) {
          console.error('Auth error:', error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
      }
      if (account?.access_token) {
        token.googleAccessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        // Get backend JWT token from localStorage if available
        if (typeof window !== 'undefined') {
          const backendToken = localStorage.getItem('auth_token');
          if (backendToken) {
            session.accessToken = backendToken;
          }
        }
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  secret: process.env.NEXTAUTH_SECRET,
};

