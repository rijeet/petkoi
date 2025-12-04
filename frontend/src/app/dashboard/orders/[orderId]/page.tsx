'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { QRCodeSVG } from 'qrcode.react';
import ResponsiveImage from '@/components/ResponsiveImage';

interface PetTagOrder {
  id: string;
  petId: string;
  userId: string;
  qrUrl: string;
  tagColor: string;
  tagSize: string;
  previewUrl?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  pet: {
    id: string;
    name: string;
    type: string;
    breed?: string;
    color?: string;
    images?: Array<{ url: string }>;
  };
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  PROCESSING: 'bg-blue-100 text-blue-800',
  SHIPPED: 'bg-purple-100 text-purple-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pending',
  PROCESSING: 'Processing',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

const COLOR_HEX: Record<string, string> = {
  GREEN: '#4CAF50',
  PINK: '#E91E63',
  BLUE: '#2196F3',
  BLACK: '#212121',
};

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { loading: authLoading, isAuthenticated } = useAuth();
  const [order, setOrder] = useState<PetTagOrder | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/signin');
      return;
    }

    if (isAuthenticated) {
      loadOrder();
    }
  }, [authLoading, isAuthenticated, router]);

  const loadOrder = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      if (token) {
        apiClient.setToken(token);
      }
          const data = await apiClient.getPetTagOrder(params.orderId as string) as PetTagOrder;
          setOrder(data);
    } catch (error) {
      console.error('Failed to load order:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mb-4"></div>
          <p className="text-gray-600">Loading order...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Order not found</p>
          <Link href="/dashboard/orders" className="text-pink-500 hover:text-pink-600">
            ← Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-orange-50 p-8">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/dashboard/orders"
          className="text-pink-500 hover:text-pink-600 mb-4 inline-block"
        >
          ← Back to Orders
        </Link>

        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Order Details</h1>
              <p className="text-gray-600">Order #{order.id.slice(0, 8)}</p>
            </div>
            <span
              className={`px-4 py-2 rounded-full text-sm font-medium ${
                STATUS_COLORS[order.status] || STATUS_COLORS.PENDING
              }`}
            >
              {STATUS_LABELS[order.status] || order.status}
            </span>
          </div>

          {/* Tag Preview */}
          {order.previewUrl && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Tag Preview</h2>
              <div className="flex justify-center">
                <ResponsiveImage
                  src={order.previewUrl}
                  alt={`${order.pet.name} tag preview`}
                  aspectRatio="square"
                  containerClassName="w-full max-w-md aspect-square"
                  className="rounded-lg border-4 border-gray-200 shadow-lg"
                  showModal={true}
                />
              </div>
            </div>
          )}

          {/* Pet Information */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Pet Information</h2>
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="font-medium text-gray-700">Pet Name:</span>
                  <span className="ml-2 text-gray-600">{order.pet.name}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Type:</span>
                  <span className="ml-2 capitalize text-gray-600">{order.pet.type}</span>
                </div>
                {order.pet.breed && (
                  <div>
                    <span className="font-medium text-gray-700">Breed:</span>
                    <span className="ml-2 text-gray-600">{order.pet.breed}</span>
                  </div>
                )}
                {order.pet.color && (
                  <div>
                    <span className="font-medium text-gray-700">Color:</span>
                    <span className="ml-2 text-gray-600">{order.pet.color}</span>
                  </div>
                )}
              </div>
              {order.pet.images && order.pet.images.length > 0 && (
                <div className="mt-4">
                  <span className="font-medium text-gray-700 block mb-2">Pet Photo:</span>
                  <ResponsiveImage
                    src={order.pet.images[0].url}
                    alt={order.pet.name}
                    aspectRatio="square"
                    containerClassName="w-full max-w-[200px] aspect-square"
                    className="rounded-lg"
                    showModal={true}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Order Details */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Order Details</h2>
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="font-medium text-gray-700">Tag Color:</span>
                  <div className="mt-2 flex items-center gap-2">
                    <span
                      className="inline-block w-8 h-8 rounded-full border-2 border-gray-300"
                      style={{ backgroundColor: COLOR_HEX[order.tagColor] || '#FFFFFF' }}
                    ></span>
                    <span className="text-gray-600 capitalize">{order.tagColor.toLowerCase()}</span>
                  </div>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Tag Size:</span>
                  <span className="ml-2 text-gray-600">{order.tagSize}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Order Date:</span>
                  <span className="ml-2 text-gray-600">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Last Updated:</span>
                  <span className="ml-2 text-gray-600">
                    {new Date(order.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* QR Code */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">QR Code</h2>
            <div className="bg-gray-50 rounded-lg p-6 flex flex-col items-center">
              <div className="p-4 bg-white rounded-lg shadow-sm mb-4">
                <QRCodeSVG value={order.qrUrl} size={256} />
              </div>
              <p className="text-sm text-gray-600 text-center">
                This QR code links to {order.pet.name}'s public profile
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <Link
              href={`/dashboard/pets/${order.pet.id}`}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center"
            >
              View Pet Profile
            </Link>
            <Link
              href="/dashboard/orders"
              className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center justify-center"
            >
              Back to Orders
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

