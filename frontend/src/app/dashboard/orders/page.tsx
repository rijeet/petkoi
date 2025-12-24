'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

interface OrderSummary {
  orderNo: string;
  status?: string;
  expiresAt?: string;
  subtotalBDT?: number | null;
  shippingFeeBDT?: number | null;
  totalBDT?: number | null;
  createdAt?: string;
}

export default function OrdersPage() {
  const router = useRouter();
  const { loading: authLoading, isAuthenticated } = useAuth();
  const [orders, setOrders] = useState<OrderSummary[]>([]);
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
      const data = (await apiClient.getOrders()) as OrderSummary[];
      console.log('OrdersPage loadOrders response', data);
      // Only filter out expired PENDING orders; keep orders that have moved past PENDING status
      const filtered = (data || []).filter((o) => {
        // If status is not PENDING, always show it
        if (o.status && o.status !== 'PENDING') return true;
        // If no expiry time, show it
        if (!o.expiresAt) return true;
        // Only hide if it's PENDING and expired
        const expired = new Date(o.expiresAt).getTime() < Date.now();
        return !expired;
      });
      setOrders(filtered);
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
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-orange-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">My Orders</h1>
          <Link
            href="/dashboard/pets"
            className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors text-sm sm:text-base font-medium shadow-md hover:shadow-lg text-center"
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
                key={order.orderNo}
                href={`/dashboard/orders/${order.orderNo}`}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6"
              >
                <div>
                  <h3 className="text-xl font-semibold mb-2">Order {order.orderNo}</h3>
                  <div className="flex items-center justify-between mb-2 text-sm text-gray-700">
                    <span>Status</span>
                    <span className="font-semibold">
                      {order.status || 'Pending'}
                    </span>
                  </div>
                  {order.status === 'PENDING' && order.expiresAt && new Date(order.expiresAt).getTime() > Date.now() && (
                    <div className="flex items-center justify-between mb-2 text-xs text-gray-500">
                      <span>Expires</span>
                      <span>
                        {new Date(order.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between mb-2 text-sm text-gray-700">
                    <span>Total</span>
                    <span className="font-semibold">
                      {order.totalBDT !== undefined && order.totalBDT !== null ? `${order.totalBDT} BDT` : '—'}
                    </span>
                  </div>
                  <div className="mt-3 flex justify-between items-center text-xs text-gray-500">
                    <span>Placed: {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '—'}</span>
                    <span className="text-pink-600 font-semibold">Track delivery →</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

