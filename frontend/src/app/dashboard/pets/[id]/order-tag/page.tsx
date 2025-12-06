'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

// Tag color configuration with front/back image URLs
const TAG_COLORS = [
  { 
    value: 'PINK', 
    label: 'Pink', 
    hex: '#E91E63',
    frontImage: 'https://ik.imagekit.io/3q7x0peae/Pet%20Public%20Img/pink_front.png',
    backImage: 'https://ik.imagekit.io/3q7x0peae/Pet%20Public%20Img/pink_back.png'
  },
  { 
    value: 'GREEN', 
    label: 'Green', 
    hex: '#4CAF50',
    frontImage: 'https://ik.imagekit.io/3q7x0peae/Pet%20Public%20Img/green_front.png',
    backImage: 'https://ik.imagekit.io/3q7x0peae/Pet%20Public%20Img/green_back.png'
  },
  { 
    value: 'BLUE', 
    label: 'Blue', 
    hex: '#2196F3',
    frontImage: 'https://ik.imagekit.io/3q7x0peae/Pet%20Public%20Img/blue_front.png?updatedAt=1765002001510',
    backImage: 'https://ik.imagekit.io/3q7x0peae/Pet%20Public%20Img/blue_back.png'
  },
  { 
    value: 'PURPLE', 
    label: 'Purple', 
    hex: '#9C27B0',
    frontImage: 'https://ik.imagekit.io/3q7x0peae/Pet%20Public%20Img/purple_front.png',
    backImage: 'https://ik.imagekit.io/3q7x0peae/Pet%20Public%20Img/purple_back.png'
  },
] as const;

interface Pet {
  id: string;
  name: string;
  qrCodeUrl?: string;
  type: string;
  breed?: string;
}

export default function OrderTagPage() {
  const params = useParams();
  const router = useRouter();
  const { loading: authLoading, isAuthenticated } = useAuth();
  const [pet, setPet] = useState<Pet | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedColor, setSelectedColor] = useState<string>('GREEN');
  const [ordering, setOrdering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showBackSide, setShowBackSide] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/signin');
      return;
    }

    if (isAuthenticated) {
      loadPet();
    }
  }, [authLoading, isAuthenticated, router]);

  const loadPet = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      if (token) {
        apiClient.setToken(token);
      }
          const data = await apiClient.getPet(params.id as string) as Pet;
          setPet(data);
      
      if (!data.qrCodeUrl) {
        setError('This pet does not have a QR code. Please ensure your pet has a QR code before ordering a tag.');
      }
    } catch (error) {
      console.error('Failed to load pet:', error);
      setError('Failed to load pet information. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOrder = async () => {
    if (!pet || !pet.qrCodeUrl) {
      setError('Pet must have a QR code to order a tag.');
      return;
    }

    try {
      setOrdering(true);
      setError(null);
      const token = localStorage.getItem('auth_token');
      if (token) {
        apiClient.setToken(token);
      }
          const order = await apiClient.createPetTagOrder(pet.id, selectedColor, '32mm') as { id: string };
          // Redirect to order details page
          router.push(`/dashboard/orders/${order.id}`);
    } catch (error: unknown) {
      console.error('Failed to create order:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(`Failed to create order: ${errorMessage}. Please try again.`);
    } finally {
      setOrdering(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Pet not found</p>
          <Link href="/dashboard/pets" className="text-pink-500 hover:text-pink-600">
            ← Back to Pets
          </Link>
        </div>
      </div>
    );
  }

  const selectedColorData = TAG_COLORS.find((c) => c.value === selectedColor) || TAG_COLORS[0];
  const currentPreviewImage = showBackSide ? selectedColorData.backImage : selectedColorData.frontImage;
  const backTextColors: Record<string, string> = {
    GREEN: '#88c912', // lighter lime for green tag
    BLUE: '#5294af', // brighter navy for blue tag
    PINK: '#db0874', // vivid raspberry for pink tag
    PURPLE: '#712185', // rich purple for purple tag
  };
  const backTextColor = backTextColors[selectedColor] || '#3b2f0a';

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-orange-50 p-8">
      <div className="max-w-4xl mx-auto">
        <Link
          href={`/dashboard/pets/${pet.id}`}
          className="text-pink-500 hover:text-pink-600 mb-4 inline-block"
        >
          ← Back to Pet Details
        </Link>

        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold mb-2">Order Pet Tag for {pet.name}</h1>
          <p className="text-gray-600 mb-8">
            Customize your pet's tag with a QR code that links to their profile
          </p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Color Selection */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Choose Tag Color</h2>
              <div className="grid grid-cols-2 gap-4">
                {TAG_COLORS.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => setSelectedColor(color.value)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedColor === color.value
                        ? 'border-pink-500 shadow-lg scale-105'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div
                      className="w-full h-16 rounded mb-2"
                      style={{ backgroundColor: color.hex }}
                    ></div>
                    <p className="text-sm font-medium text-center">{color.label}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Live Preview */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Tag Preview</h2>
                <div className="inline-flex items-center rounded-full bg-gray-100 p-1 shadow-inner">
                  <button
                    type="button"
                    onClick={() => setShowBackSide(false)}
                    className={`px-3 py-1 text-xs font-semibold rounded-full transition-all ${
                      !showBackSide
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    Front
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowBackSide(true)}
                    className={`px-3 py-1 text-xs font-semibold rounded-full transition-all ${
                      showBackSide
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    Back
                  </button>
                </div>
              </div>
              <div className="bg-gradient-to-br from-white via-gray-50 to-pink-50 rounded-2xl p-6 flex items-center justify-center shadow-lg border border-gray-100">
                <div className="relative">
                  <div className="w-72 h-72 sm:w-80 sm:h-80 rounded-2xl bg-white shadow-xl ring-4 ring-white/70 overflow-hidden flex items-center justify-center">
                    <img
                      key={`${selectedColor}-${showBackSide ? 'back' : 'front'}`}
                      src={currentPreviewImage}
                      alt={`${selectedColorData.label} tag ${showBackSide ? 'back' : 'front'}`}
                      className="w-full h-full object-contain transition-all duration-300"
                      style={{ fontFamily: 'JakartaDisplay, sans-serif' }}
                    />
                  </div>
                </div>
                {showBackSide && (
                  <div className="absolute inset-0 flex items-end justify-center pb-50 pointer-events-none translate-y-[-440px] translate-x-[210px]">
                    <span
                      className="text-4xl sm:text-4xl font-extrabold drop-shadow-md"
                      style={{ fontFamily: 'JakartaDisplay, sans-serif', color: backTextColor }}
                    >
                      {pet.name}
                    </span>
                  </div>
                     

                )}
              </div>
              <p className="text-xs text-gray-500 text-center mt-3">
                {showBackSide
                  ? '* Back side preview (pet name uses JakartaDisplay font).'
                  : '* Front side with QR code. Tap Back to view the reverse.'}
              </p>
            </div>
          </div>

          {/* Order Button */}
          <div className="mt-8 flex justify-center">
            <button
              onClick={handleOrder}
              disabled={ordering || !pet.qrCodeUrl}
              className="px-8 py-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg font-semibold"
            >
              {ordering ? 'Processing...' : 'Order Tag'}
            </button>
          </div>

          {/* Info */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg text-sm text-gray-700">
            <p className="font-semibold mb-2">Tag Specifications:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Size: 32mm (standard pet tag size)</li>
              <li>Material: Durable acrylic</li>
              <li>QR Code: Links directly to your pet's profile</li>
              <li>Customizable: Choose from 4 color options</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

