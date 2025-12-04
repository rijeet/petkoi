'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { QRCodeSVG } from 'qrcode.react';

const TAG_COLORS = [
  { value: 'GREEN', label: 'Green', hex: '#4CAF50' },
  { value: 'PINK', label: 'Pink', hex: '#E91E63' },
  { value: 'BLUE', label: 'Blue', hex: '#2196F3' },
  { value: 'BLACK', label: 'Black', hex: '#212121' },
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
                <button
                  onClick={() => setShowBackSide(!showBackSide)}
                  className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  {showBackSide ? 'Show Front' : 'Show Back'}
                </button>
              </div>
              <div className="bg-gray-50 rounded-lg p-6 flex items-center justify-center">
                <div className="relative">
                  {showBackSide ? (
                    /* Back Side - Paw Print */
                    <div
                      className="w-64 h-64 rounded-full shadow-lg relative flex items-center justify-center"
                      style={{
                        border: `8px solid ${selectedColorData.hex}`,
                        backgroundColor: '#FFFFFF',
                      }}
                    >
                      {/* Inner white circle with thin black outline */}
                      <div
                        className="absolute inset-2 bg-white rounded-full flex items-center justify-center"
                        style={{
                          border: '2px solid #000000',
                        }}
                      >
                        {/* Paw Print Icon */}
                        <svg
                          width="80"
                          height="80"
                          viewBox="0 0 100 100"
                          fill="black"
                          className="opacity-90"
                        >
                          {/* Main pad */}
                          <circle cx="50" cy="65" r="18" />
                          {/* Top left toe */}
                          <circle cx="30" cy="40" r="12" />
                          {/* Top right toe */}
                          <circle cx="70" cy="40" r="12" />
                          {/* Bottom left toe */}
                          <circle cx="40" cy="75" r="10" />
                          {/* Bottom right toe */}
                          <circle cx="60" cy="75" r="10" />
                        </svg>
                      </div>
                    </div>
                  ) : (
                    /* Front Side - QR Code */
                    <div
                      className="w-64 h-64 rounded-full shadow-lg relative flex items-center justify-center"
                      style={{
                        border: `8px solid ${selectedColorData.hex}`,
                        backgroundColor: '#FFFFFF',
                      }}
                    >
                      {/* Inner white circle */}
                      <div className="absolute inset-2 bg-white rounded-full flex flex-col items-center justify-center">
                        {/* Top arc text - positioned at top */}
                        <p className="text-[10px] font-bold text-black mt-2 mb-1 text-center">
                          SCAN TO FIND MY FAMILY
                        </p>

                        {/* QR Code */}
                        {pet.qrCodeUrl && (
                          <div className="flex-1 flex items-center justify-center my-2">
                            <div className="bg-white p-1 rounded">
                              <QRCodeSVG value={pet.qrCodeUrl} size={120} />
                            </div>
                          </div>
                        )}

                        {/* Bottom arc text */}
                        <p className="text-[9px] font-bold text-black mb-2 text-center">
                          PETKOI.COM
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-500 text-center mt-2">
                {showBackSide
                  ? '* Back side with paw print icon'
                  : '* Front side with QR code. Click "Show Back" to see the back side.'}
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

