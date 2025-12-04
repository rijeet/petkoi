'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
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

export default function OrdersPage() {
  const router = useRouter();
  const { loading: authLoading, isAuthenticated } = useAuth();
  const [orders, setOrders] = useState<PetTagOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/signin');
      return;
    }

    if (isAuthenticated) {
      loadOrders();
    }
  }, [authLoading, isAuthenticated, router]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      if (token) {
        apiClient.setToken(token);
      }
      const data = await apiClient.getMyPetTagOrders() as PetTagOrder[];
      setOrders(data);
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mb-4"></div>
          <p className="text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-orange-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">My Orders</h1>
          <Link
            href="/dashboard/pets"
            className="px-6 py-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
          >
            ← Back to Pets
          </Link>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-600 mb-4">You don't have any orders yet.</p>
            <Link
              href="/dashboard/pets"
              className="text-pink-500 hover:text-pink-600 font-medium"
            >
              Order a pet tag →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {orders.map((order) => (
              <Link
                key={order.id}
                href={`/dashboard/orders/${order.id}`}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6"
              >
                {/* Pet Image or Preview */}
                <div className="mb-4 flex justify-center">
                  {order.previewUrl ? (
                    <ResponsiveImage
                      src={order.previewUrl}
                      alt={`${order.pet.name} tag preview`}
                      aspectRatio="square"
                      containerClassName="w-full max-w-[200px] aspect-square"
                      className="rounded-lg border-2 border-gray-200"
                      showModal={true}
                    />
                  ) : order.pet.images && order.pet.images.length > 0 ? (
                    <ResponsiveImage
                      src={order.pet.images[0].url}
                      alt={order.pet.name}
                      aspectRatio="square"
                      containerClassName="w-full max-w-[200px] aspect-square"
                      className="rounded-lg"
                      showModal={true}
                    />
                  ) : (
                    <div className="w-full max-w-[200px] aspect-square bg-gray-200 rounded-lg flex items-center justify-center">
                      <span className="text-gray-400">No image</span>
                    </div>
                  )}
                </div>

                {/* Order Info */}
                <div>
                  <h3 className="text-xl font-semibold mb-2">{order.pet.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <span className="capitalize">{order.pet.type}</span>
                    {order.pet.breed && <span>• {order.pet.breed}</span>}
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-500">Color:</span>
                    <span
                      className="inline-block w-6 h-6 rounded-full border border-gray-300"
                      style={{
                        backgroundColor:
                          order.tagColor === 'GREEN'
                            ? '#4CAF50'
                            : order.tagColor === 'PINK'
                              ? '#E91E63'
                              : order.tagColor === 'BLUE'
                                ? '#2196F3'
                                : '#212121',
                      }}
                    ></span>
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-gray-500">Status:</span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        STATUS_COLORS[order.status] || STATUS_COLORS.PENDING
                      }`}
                    >
                      {STATUS_LABELS[order.status] || order.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">
                    Ordered: {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

