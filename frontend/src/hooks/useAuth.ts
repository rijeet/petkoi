'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';

interface User {
  id: string;
  email: string;
  name?: string;
  profilePicture?: string;
  role: string;
  latitude?: number;
  longitude?: number;
  geohash?: string;
  address?: string;
  phone?: string;
  homeAddress?: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setUser(null);
        apiClient.setToken(null);
        setLoading(false);
        return;
      }

      // Set token on API client before making request
      apiClient.setToken(token);
      
      // Validate token by fetching user info
      try {
        const userData = await apiClient.getCurrentUser();
        console.log('useAuth - getCurrentUser response:', userData);
        if (userData) {
          setUser(userData as User);
        } else {
          // No user data returned, token might be invalid
          console.warn('useAuth - No user data returned from API');
          localStorage.removeItem('auth_token');
          apiClient.setToken(null);
          setUser(null);
        }
      } catch (error: any) {
        // Token is invalid, remove it
        console.error('Token validation failed:', error);
        console.error('Error details:', {
          message: error.message,
          status: error.status,
          stack: error.stack,
        });
        localStorage.removeItem('auth_token');
        apiClient.setToken(null);
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
      apiClient.setToken(null);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await apiClient.logout();
    } finally {
      localStorage.removeItem('auth_token');
      apiClient.setToken(null);
      setUser(null);
      router.push('/auth/signin');
    }
  };

  return {
    user,
    loading,
    isAuthenticated: !!user,
    logout,
    refresh: checkAuth,
  };
}

