'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
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
}

function AuthCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      // Store token in localStorage
      localStorage.setItem('auth_token', token);
      apiClient.setToken(token);
      
      // Small delay to ensure token is set
      setTimeout(async () => {
        try {
          // Validate token by fetching user info
          const userData = await apiClient.getCurrentUser();
          const user = userData as User;
          console.log('Token validated successfully, user:', user);

          // Check if we have pending location from sign-in
          const pendingLocationStr = localStorage.getItem('pending_auth_location');
          
          // Check if user already has a location set (not null/undefined)
          const userHasLocation = user.latitude != null && user.longitude != null;
          
          console.log('Auth callback - Location check:', {
            hasPendingLocation: !!pendingLocationStr,
            userHasLocation,
            userLocation: { lat: user.latitude, lng: user.longitude },
            pendingLocation: pendingLocationStr ? JSON.parse(pendingLocationStr) : null,
          });

          // If we have pending location and user doesn't have location, redirect to confirmation page
          if (pendingLocationStr && !userHasLocation) {
            console.log('Redirecting to confirm-location page');
            // Keep location in localStorage for confirmation page
            router.push('/dashboard/confirm-location');
            return;
          }

          // If location was provided but user already has one, update it silently
          if (pendingLocationStr && userHasLocation) {
            try {
              const location = JSON.parse(pendingLocationStr);
              // Send location to backend to update user
              await apiClient.updateUser(user.id, {
                latitude: location.latitude,
                longitude: location.longitude,
                address: location.address,
              });
              console.log('User location updated successfully');
              // Clear pending location
              localStorage.removeItem('pending_auth_location');
            } catch (locationError) {
              console.warn('Failed to update user location:', locationError);
              // Continue even if location update fails
            }
          } else if (pendingLocationStr) {
            // Clear if no update needed
            localStorage.removeItem('pending_auth_location');
          }

          // Token is valid, redirect to dashboard
          router.push('/dashboard/pets');
        } catch (err: any) {
          console.error('Token validation failed:', err);
          console.error('Error details:', {
            message: err.message,
            stack: err.stack,
          });
          setError(`Failed to validate authentication: ${err.message || 'Unknown error'}. Please try again.`);
          // Redirect to sign in after a delay
          setTimeout(() => {
            router.push('/auth/signin');
          }, 5000);
        }
      }, 100);
    } else {
      setError('No authentication token received. Please try again.');
      setTimeout(() => {
        router.push('/auth/signin');
      }, 3000);
    }
  }, [searchParams, router]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-pink-50 to-orange-50 px-4">
        <div className="text-center max-w-md w-full bg-white rounded-lg shadow-lg p-6 sm:p-8">
          <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-red-600">Authentication Error</h2>
          <p className="text-sm sm:text-base text-gray-700 mb-4">{error}</p>
          <p className="text-xs sm:text-sm text-gray-500">Redirecting to sign in...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-pink-50 to-orange-50 px-4">
      <div className="text-center max-w-md w-full bg-white rounded-lg shadow-lg p-6 sm:p-8">
        <div className="inline-block animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-pink-500 mb-4"></div>
        <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-gray-900">Completing sign in...</h2>
        <p className="text-sm sm:text-base text-gray-700">Please wait while we redirect you.</p>
      </div>
    </div>
  );
}

export default function AuthCallback() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-pink-50 to-orange-50 px-4">
          <div className="text-center max-w-md w-full bg-white rounded-lg shadow-lg p-6 sm:p-8">
            <div className="inline-block animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-pink-500 mb-4"></div>
            <h2 className="text-xl sm:text-2xl font-bold mb-4 text-gray-900">Loading...</h2>
          </div>
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}

