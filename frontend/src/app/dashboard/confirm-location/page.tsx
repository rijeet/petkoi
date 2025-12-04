'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api';
import type { LocationData } from '@/components/LocationPicker';

// Dynamically import LocationPicker to avoid SSR issues
const LocationPicker = dynamic(() => import('@/components/LocationPicker'), {
  ssr: false,
  loading: () => (
    <div className="w-full p-8 bg-white rounded-lg shadow">
      <div className="flex flex-col items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mb-4"></div>
        <p className="text-gray-600">Loading location picker...</p>
      </div>
    </div>
  ),
});

export default function ConfirmLocationPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [location, setLocation] = useState<LocationData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialLocation, setInitialLocation] = useState<{ lat: number; lng: number } | undefined>();
  // const [debugInfo, setDebugInfo] = useState<any>(null);

  useEffect(() => {
    // Debug: Log auth state
    console.log('Confirm Location - Auth State:', {
      authLoading,
      hasUser: !!user,
      hasToken: !!localStorage.getItem('auth_token'),
      userId: user?.id,
    });

    // Only redirect if auth check is complete and user is not authenticated
    if (!authLoading && !user) {
      const token = localStorage.getItem('auth_token');
      console.log('Confirm Location - No user found, redirecting to signin', {
        hasToken: !!token,
        token: token ? token.substring(0, 20) + '...' : null,
      });
      router.push('/auth/signin');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    // Try to get location from localStorage (set during sign-in)
    const pendingLocation = localStorage.getItem('pending_auth_location');
    
    // Also check if user has location in their profile
    const userLocation = user?.latitude != null && user?.longitude != null 
      ? { lat: user.latitude, lng: user.longitude }
      : undefined;

    // const debug = {
    //   hasPendingLocation: !!pendingLocation,
    //   pendingLocation: pendingLocation ? JSON.parse(pendingLocation) : null,
    //   userLocation: user ? { lat: user.latitude, lng: user.longitude, address: user.address } : null,
    //   userHasLocation: !!userLocation,
    // };
    
    // setDebugInfo(debug);
    // console.log('Confirm Location Page - Debug Info:', debug);

    if (pendingLocation) {
      try {
        const loc = JSON.parse(pendingLocation);
        if (loc.latitude && loc.longitude) {
          setInitialLocation({ lat: loc.latitude, lng: loc.longitude });
        }
      } catch (err) {
        console.error('Failed to parse pending location:', err);
      }
    } else if (userLocation) {
      // Use user's existing location if available
      setInitialLocation(userLocation);
    }
  }, [user]);

  const handleLocationChange = (newLocation: LocationData) => {
    setLocation(newLocation);
    setError(null);
  };

  const handleSave = async () => {
    if (!location || !user) {
      setError('Please select a location');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      console.log('Saving location:', {
        userId: user.id,
        location: {
          latitude: location.lat,
          longitude: location.lng,
          address: location.address,
        },
      });

      // Update user location
      const updatedUser = await apiClient.updateUser(user.id, {
        latitude: location.lat,
        longitude: location.lng,
        address: location.address,
      });

      console.log('Location saved successfully:', updatedUser);

      // Clear pending location from localStorage
      localStorage.removeItem('pending_auth_location');

      // Redirect to dashboard immediately
      // Use window.location as fallback if router doesn't work
      try {
        router.replace('/dashboard/pets');
        // Fallback: force redirect after a short delay if router doesn't work
        setTimeout(() => {
          if (window.location.pathname === '/dashboard/confirm-location') {
            window.location.href = '/dashboard/pets';
          }
        }, 500);
      } catch (redirectError) {
        console.error('Router redirect failed, using window.location:', redirectError);
        window.location.href = '/dashboard/pets';
      }
    } catch (err: any) {
      console.error('Failed to save location:', err);
      console.error('Error details:', {
        message: err.message,
        status: err.status,
        stack: err.stack,
      });
      setError(err.message || `Failed to save location. Status: ${err.status || 'unknown'}. Please try again.`);
      setIsSaving(false);
    }
  };

  const handleSkip = () => {
    try {
      // Clear pending location
      localStorage.removeItem('pending_auth_location');
      
      // Redirect to dashboard
      // Use window.location as fallback if router doesn't work
      try {
        router.replace('/dashboard/pets');
        // Fallback: force redirect after a short delay if router doesn't work
        setTimeout(() => {
          if (window.location.pathname === '/dashboard/confirm-location') {
            window.location.href = '/dashboard/pets';
          }
        }, 500);
      } catch (redirectError) {
        console.error('Router redirect failed, using window.location:', redirectError);
        window.location.href = '/dashboard/pets';
      }
    } catch (error) {
      console.error('Error during skip:', error);
      // Final fallback: direct window location
      window.location.href = '/dashboard/pets';
    }
  };

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // If auth check is complete but no user, the redirect will happen via useEffect
  // Return null to prevent flash of content
  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mb-4"></div>
          <p className="text-gray-600">Redirecting to sign in...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-orange-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Confirm Your Location</h1>
          <p className="text-gray-600 mb-6">
            Please confirm or adjust your location. This helps us provide better services for your
            pets.
          </p>
          
          {user && (!user.latitude || !user.longitude) && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>No location set:</strong> Your location is currently not set. Please select a location below.
              </p>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800 font-semibold mb-2">Error:</p>
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Debug Info - Commented out */}
          {/* {process.env.NODE_ENV === 'development' && debugInfo && (
            <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-xs font-semibold text-gray-700 mb-2">Debug Info:</p>
              <pre className="text-xs text-gray-600 overflow-auto">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
              <p className="text-xs text-gray-500 mt-2">
                Current Location: {location ? `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}` : 'Not set'}
              </p>
              <p className="text-xs text-gray-500">
                User ID: {user?.id || 'Not loaded'}
              </p>
            </div>
          )} */}

          <LocationPicker
            initialLocation={initialLocation}
            onLocationChange={handleLocationChange}
            autoDetect={true}
            showSearch={true}
            className="mb-6"
          />

          <div className="flex gap-4 justify-end">
            <button
              onClick={handleSkip}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Skip for Now
            </button>
            <button
              onClick={handleSave}
              disabled={!location || isSaving}
              className="px-6 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : 'Save Location'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

