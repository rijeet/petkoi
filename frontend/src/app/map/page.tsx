'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

const PetMap = dynamic(() => import('@/components/PetMap'), { ssr: false });

interface PetLocation {
  id: string;
  name: string;
  type: string;
  lat: number;
  lng: number;
  isLost: boolean;
}

export default function MapPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [pets, setPets] = useState<PetLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/signin');
      return;
    }

    if (isAuthenticated) {
      loadNearbyPets();
      getUserLocation();
    }
  }, [authLoading, isAuthenticated, router]);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.error('Error getting location:', error);
        },
      );
    }
  };

  const loadNearbyPets = async () => {
    try {
      setLoading(true);
      if (userLocation) {
        const data = await apiClient.findNearbyPets(userLocation[0], userLocation[1], 10) as Array<{
          id: string;
          name: string;
          type: string;
          lastKnownLat?: number;
          lastKnownLng?: number;
          isLost: boolean;
        }>;
        setPets(
          data.map((pet) => ({
            id: pet.id,
            name: pet.name,
            type: pet.type,
            lat: pet.lastKnownLat || 0,
            lng: pet.lastKnownLng || 0,
            isLost: pet.isLost,
          })),
        );
      }
    } catch (error) {
      console.error('Failed to load nearby pets:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading map...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-orange-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6 text-gray-900">Pet Map</h1>
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-4">
          <p className="text-sm sm:text-base text-gray-700 mb-3 sm:mb-4">
            View pets in your area. Lost pets are marked in red.
          </p>
          <button
            onClick={getUserLocation}
            className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors text-sm sm:text-base font-medium shadow-md hover:shadow-lg"
          >
            Update My Location
          </button>
        </div>
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {userLocation ? (
            <div className="h-[400px] sm:h-[500px] lg:h-[600px]">
              <PetMap
                locations={pets}
                center={userLocation}
                zoom={13}
                height="100%"
              />
            </div>
          ) : (
            <div className="h-64 sm:h-96 flex items-center justify-center text-gray-500 p-4">
              <div className="text-center">
                <p className="text-sm sm:text-base mb-4">Enable location services to see nearby pets</p>
                <button
                  onClick={getUserLocation}
                  className="px-4 sm:px-6 py-2 sm:py-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600 text-sm sm:text-base font-medium shadow-md hover:shadow-lg"
                >
                  Enable Location
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

