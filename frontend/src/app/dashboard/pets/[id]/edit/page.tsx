'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api';

interface Pet {
  id: string;
  name: string;
  type: string;
  breed?: string;
  color?: string;
  gender: string;
  neutered: boolean;
  description?: string;
  dateOfBirth?: string;
}

export default function EditPetPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pet, setPet] = useState<Pet | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    breed: '',
    color: '',
    dateOfBirth: '',
    neutered: false,
    gender: 'UNKNOWN' as 'MALE' | 'FEMALE' | 'UNKNOWN',
    description: '',
    type: 'DOG' as 'DOG' | 'CAT' | 'BIRD' | 'OTHER',
  });

  useEffect(() => {
    loadPet();
  }, [params.id]);

  const loadPet = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      if (token) {
        apiClient.setToken(token);
      }
          const data = await apiClient.getPet(params.id as string) as Pet;
          setPet(data);
      
      // Format date for input field (YYYY-MM-DD)
      const dateOfBirth = data.dateOfBirth 
        ? new Date(data.dateOfBirth).toISOString().split('T')[0]
        : '';
      
      setFormData({
        name: data.name || '',
        breed: data.breed || '',
        color: data.color || '',
        dateOfBirth: dateOfBirth,
        neutered: data.neutered || false,
        gender: (data.gender as 'MALE' | 'FEMALE' | 'UNKNOWN') || 'UNKNOWN',
        description: data.description || '',
        type: (data.type as 'DOG' | 'CAT' | 'BIRD' | 'OTHER') || 'DOG',
      });
    } catch (error: unknown) {
      console.error('Failed to load pet:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load pet';
      alert(`Failed to load pet: ${errorMessage}`);
      router.push('/dashboard/pets');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const token = localStorage.getItem('auth_token');
      if (token) {
        apiClient.setToken(token);
      }
      await apiClient.updatePet(params.id as string, formData);
      router.push(`/dashboard/pets/${params.id}`);
    } catch (error: unknown) {
      console.error('Failed to update pet:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update pet';
      alert(`Failed to update pet: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-orange-50 p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="flex items-center justify-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
              <span className="ml-4 text-gray-600">Loading pet details...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-orange-50 p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-8">
            <p className="text-center text-gray-600">Pet not found</p>
            <Link
              href="/dashboard/pets"
              className="mt-4 block text-center text-pink-500 hover:text-pink-600"
            >
              ← Back to Pets
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-orange-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-2xl mx-auto">
        <Link
          href={`/dashboard/pets/${pet.id}`}
          className="text-sm sm:text-base text-pink-500 hover:text-pink-600 mb-4 inline-block font-medium"
        >
          ← Back to Pet Details
        </Link>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-6 sm:mb-8 text-gray-900">Edit Pet</h1>
        
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-4 sm:p-6 lg:p-8">
          <div className="space-y-4 sm:space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pet Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type *
                </label>
                <select
                  required
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as 'DOG' | 'CAT' | 'BIRD' | 'OTHER' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                >
                  <option value="DOG">Dog</option>
                  <option value="CAT">Cat</option>
                  <option value="BIRD">Bird</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gender *
                </label>
                <select
                  required
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'MALE' | 'FEMALE' | 'UNKNOWN' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="UNKNOWN">Unknown</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Breed
                </label>
                <input
                  type="text"
                  value={formData.breed}
                  onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color
                </label>
                <input
                  type="text"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date of Birth
              </label>
              <input
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
              />
            </div>

            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.neutered}
                  onChange={(e) => setFormData({ ...formData, neutered: e.target.checked })}
                  className="w-4 h-4 text-pink-500 rounded focus:ring-pink-500"
                />
                <span className="text-sm font-medium text-gray-700">Neutered/Spayed</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 px-4 sm:px-6 py-2 sm:py-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600 disabled:opacity-50 transition-colors text-sm sm:text-base font-medium shadow-md hover:shadow-lg"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={() => router.push(`/dashboard/pets/${pet.id}`)}
                className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm sm:text-base font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

