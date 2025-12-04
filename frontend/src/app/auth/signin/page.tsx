'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function SignInPage() {
  const router = useRouter();
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isRequestingLocation, setIsRequestingLocation] = useState(false);

  const requestLocation = (): Promise<{ latitude: number; longitude: number; address?: string }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          // Try to get address using reverse geocoding
          let address: string | undefined;
          try {
            const response = await fetch(
              `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=${process.env.NEXT_PUBLIC_OPENCAGE_API_KEY || ''}&limit=1`
            );
            if (response.ok) {
              const data = await response.json();
              if (data.results && data.results.length > 0) {
                address = data.results[0].formatted;
              }
            }
          } catch (err) {
            // Ignore geocoding errors, location will still be saved
            console.warn('Failed to get address:', err);
          }

          resolve({ latitude, longitude, address });
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  };

  const handleGoogleSignIn = async () => {
    setIsRequestingLocation(true);
    setLocationError(null);

    try {
      // Request location permission
      const location = await requestLocation();
      
      // Store location in localStorage to send after OAuth
      localStorage.setItem('pending_auth_location', JSON.stringify(location));
    } catch (error: any) {
      console.warn('Location access denied or failed:', error);
      setLocationError('Location access is optional. You can still sign in.');
      // Continue with sign-in even if location fails
    } finally {
      setIsRequestingLocation(false);
    }

    // Redirect to backend Google OAuth
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    window.location.href = `${API_URL}/auth/google`;
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-pink-50 to-orange-50">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-center mb-2">Pet Identity Platform</h1>
        <p className="text-center text-gray-600 mb-8">Sign in to manage your pets</p>
        
        {locationError && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
            {locationError}
          </div>
        )}

        <button
          onClick={handleGoogleSignIn}
          disabled={isRequestingLocation}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRequestingLocation ? (
            <>
              <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-gray-700"></div>
              <span className="font-medium text-gray-700">Requesting location...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span className="font-medium text-gray-700">Continue with Google</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

