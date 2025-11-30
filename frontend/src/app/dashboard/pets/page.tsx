'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import ResponsiveImage from '@/components/ResponsiveImage';

interface Pet {
  id: string;
  name: string;
  type: string;
  breed?: string;
  isLost: boolean;
  qrCodeUrl?: string;
  images?: Array<{ url: string }>;
}

export default function PetsPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/signin');
      return;
    }

    if (isAuthenticated) {
      // Get token from localStorage (set by auth callback)
      const token = localStorage.getItem('auth_token');
      if (token) {
        apiClient.setToken(token);
      }
      loadPets();
    }
  }, [authLoading, isAuthenticated, router]);

  const loadPets = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      if (token) {
        apiClient.setToken(token);
      }
      const data = await apiClient.getPets();
      setPets(data);
    } catch (error) {
      console.error('Failed to load pets:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mb-4"></div>
          <p className="text-gray-600">Loading pets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-orange-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">My Pets</h1>
          <Link
            href="/dashboard/pets/new"
            className="px-6 py-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
          >
            + Add Pet
          </Link>
        </div>

        {pets.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-600 mb-4">You don't have any pets yet.</p>
            <Link
              href="/dashboard/pets/new"
              className="text-pink-500 hover:text-pink-600 font-medium"
            >
              Add your first pet →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pets.map((pet) => (
              <Link
                key={pet.id}
                href={`/dashboard/pets/${pet.id}`}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6"
              >
                <div className="mb-4 flex items-center justify-center">
                  {pet.images && pet.images.length > 0 ? (
                    <ResponsiveImage
                      src={pet.images[0].url}
                      alt={pet.name}
                      aspectRatio="square"
                      containerClassName="w-full max-w-[500px] aspect-square"
                      className="rounded-lg"
                      showModal={true}
                    />
                  ) : (
                    <div className="w-full max-w-[500px] aspect-square bg-gray-200 rounded-lg flex items-center justify-center">
                      <span className="text-gray-400">No image</span>
                    </div>
                  )}
                </div>
                <h3 className="text-xl font-semibold mb-2">{pet.name}</h3>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="capitalize">{pet.type}</span>
                  {pet.breed && <span>• {pet.breed}</span>}
                </div>
                {pet.isLost && (
                  <span className="inline-block mt-2 px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                    Lost
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

