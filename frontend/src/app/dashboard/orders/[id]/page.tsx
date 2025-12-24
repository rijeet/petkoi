'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

interface OrderDetail {
  id: string;
  orderNo?: string;
  status?: string;
  expiresAt?: string;
  createdAt?: string;
  updatedAt?: string;
  petQrUrl?: string | null;
  pet?: { id: string; name?: string | null; qrCodeUrl?: string | null } | null;
  items?: Array<{
    productId: string;
    name: string;
    sku: string;
    unitPriceBDT: number;
    quantity: number;
    totalBDT: number;
  }>;
}

const TAG_SKU_LOOKUP: Record<
  string,
  { label: string; color: string; image: string }
> = {
  'SKU-TAG-PINK': {
    label: 'Pink Tag',
    color: '#E91E63',
    image: 'https://ik.imagekit.io/3q7x0peae/Pet%20Public%20Img/pink_front.png',
  },
  'SKU-TAG-GREEN': {
    label: 'Green Tag',
    color: '#4CAF50',
    image: 'https://ik.imagekit.io/3q7x0peae/Pet%20Public%20Img/green_front.png',
  },
  'SKU-TAG-BLUE': {
    label: 'Blue Tag',
    color: '#2196F3',
    image: 'https://ik.imagekit.io/3q7x0peae/Pet%20Public%20Img/blue_front.png?updatedAt=1765002001510',
  },
  'SKU-TAG-PURPLE': {
    label: 'Purple Tag',
    color: '#9C27B0',
    image: 'https://ik.imagekit.io/3q7x0peae/Pet%20Public%20Img/purple_front.png',
  },
};

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { loading: authLoading, isAuthenticated } = useAuth();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/signin');
      return;
    }
    if (isAuthenticated) {
      load();
    }
  }, [authLoading, isAuthenticated, router]);

  const load = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      if (token) apiClient.setToken(token);
      const orderNo = params.id as string;
      const data = await apiClient.getOrder(orderNo);
      console.log('OrderDetail load response', { orderNo, data, petQrUrl: (data as any).petQrUrl, pet: (data as any).pet });
      setOrder({
        id: orderNo,
        orderNo: data.orderNo || orderNo,
        status: (data as any).status,
        expiresAt: (data as any).expiresAt,
        createdAt: (data as any).createdAt,
        updatedAt: (data as any).updatedAt,
        petQrUrl: (data as any).petQrUrl,
        pet: (data as any).pet,
        items: (data as any).items,
      });
    } catch (e: any) {
      console.error('OrderDetail load failed', e);
      setError(e?.message || 'Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  const showCountdown = false;

  useEffect(() => {
    if (!order?.expiresAt || !showCountdown) {
      setRemaining(null);
      return;
    }
    const target = new Date(order.expiresAt).getTime();
    const tick = () => {
      const diff = target - Date.now();
      setRemaining(diff > 0 ? diff : 0);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [order?.expiresAt, showCountdown]);

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mb-4"></div>
          <p className="text-gray-600">Loading order...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-orange-50 p-6">
        <div className="max-w-4xl mx-auto bg-white shadow-md rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Order</h1>
            <Link href="/dashboard/orders" className="text-pink-600 hover:underline text-sm">
              Back to orders
            </Link>
          </div>
          <p className="text-red-600">{error}</p>
          <button
            onClick={load}
            className="px-4 py-2 rounded bg-pink-500 text-white hover:bg-pink-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const expired = order?.status === 'EXPIRED' || (remaining !== null && remaining <= 0);
  const primaryItem = order?.items?.[0];
  const skuInfo = primaryItem?.sku ? TAG_SKU_LOOKUP[primaryItem.sku] : undefined;
  // Get QR value from petQrUrl (stored on order) or pet.qrCodeUrl (from pet relation)
  const qrValue = order?.petQrUrl || order?.pet?.qrCodeUrl || null;
  const qrImageSrc = qrValue ? buildQrImageSrc(qrValue) : null;
  if (qrValue) {
    console.log('QR Debug', { qrValue, qrImageSrc, petQrUrl: order?.petQrUrl, petQrCodeUrl: order?.pet?.qrCodeUrl });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-orange-50 p-6">
      <div className="max-w-4xl mx-auto bg-white shadow-md rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Order {order?.orderNo || order?.id}</h1>
            <p className="text-sm text-gray-500">Tracking details will appear here.</p>
            {order?.expiresAt && showCountdown && (
              <p className="text-xs text-gray-500">
                {expired
                  ? 'Expired'
                  : `Expires in ${formatRemaining(remaining)} (at ${new Date(order.expiresAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })})`}
              </p>
            )}
            {order?.status === 'PAYMENT_UNDER_REVIEW' && (
              <p className="text-xs text-gray-500">Payment submitted; timer paused during verification.</p>
            )}
          </div>
          <Link href="/dashboard/orders" className="text-pink-600 hover:underline text-sm">
            Back to orders
          </Link>
        </div>

        <TrackingSteps status={order?.status} expired={expired} />

        <div className="space-y-2 text-sm text-gray-800">
          <div className="flex justify-between">
            <span>Status</span>
            <span className="font-semibold">{order?.status || 'Pending'}</span>
          </div>
          <div className="flex justify-between text-gray-500">
            <span>Placed</span>
            <span>{order?.createdAt ? new Date(order.createdAt).toLocaleString() : '—'}</span>
          </div>
          <div className="flex justify-between text-gray-500">
            <span>Updated</span>
            <span>{order?.updatedAt ? new Date(order.updatedAt).toLocaleString() : '—'}</span>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-800">Product</h3>
            <div className="flex gap-3 items-center rounded-lg border border-gray-200 p-3 bg-gray-50">
              <div className="w-20 h-20 rounded-lg overflow-hidden bg-white border border-gray-200 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {skuInfo?.image ? (
                  <img src={skuInfo.image} alt={skuInfo.label} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs text-gray-500">No image</span>
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">{primaryItem?.name || 'Product'}</p>
                <p className="text-xs text-gray-600">
                  {skuInfo?.label || primaryItem?.sku || '—'} · Qty {primaryItem?.quantity ?? '—'}
                </p>
                <p className="text-xs text-gray-600">
                  Total: {primaryItem ? `${primaryItem.totalBDT} BDT` : '—'}
                </p>
                {skuInfo?.color && (
                  <div className="mt-2 h-2.5 w-12 rounded-full" style={{ background: skuInfo.color }} />
                )}
              </div>
            </div>
          </div>

          {(order?.petQrUrl || order?.pet?.qrCodeUrl || order?.pet) && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-800">Pet QR</h3>
              {qrImageSrc ? (
                <div className="w-28 h-28 rounded-lg border border-pink-200 bg-pink-50 p-2 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrImageSrc}
                    alt="Pet QR"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      console.error('QR image failed to load', qrValue);
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              ) : (
                <div className="w-28 h-28 rounded-lg border border-pink-200 bg-pink-50 p-2 flex items-center justify-center">
                  <span className="text-xs text-gray-500">QR not available</span>
                </div>
              )}
              {order.pet?.name && <p className="text-xs text-gray-500">Pet: {order.pet.name}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TrackingSteps({
  status,
  expired,
}: {
  status?: string;
  expired?: boolean;
}) {
  const steps = [
    { key: 'ORDER_PLACED', label: 'Order Placed', desc: 'Your order has been placed. Please complete payment and wait for verification.' },
    { key: 'PAYMENT_UNDER_REVIEW', label: 'Payment Under Review', desc: 'We are verifying your payment. This may take up to 1 working day.' },
    { key: 'PAYMENT_VERIFIED', label: 'Payment Verified', desc: 'Payment verified successfully. Your order will be prepared for shipment.' },
    { key: 'SHIPPED', label: 'Shipped (Post Office)', desc: 'Your parcel has been shipped via local post office.' },
    { key: 'DELIVERED', label: 'Delivered', desc: 'Your order has been successfully delivered to the destination.' },
    // Legacy/fallback statuses
    { key: 'ORDER_PACKED', label: 'Order Packed', desc: 'The seller has packed your item and it is ready for shipment.' },
    { key: 'IN_TRANSIT', label: 'In Transit', desc: 'The package is moving between logistics hubs or cities.' },
    { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', desc: 'The courier is delivering your parcel to your address.' },
  ];

  const normalized = (status || '').toUpperCase();
  const currentIdx = steps.findIndex((s) => s.key === normalized);
  const activeIndex = currentIdx >= 0 ? currentIdx : 0;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-800">Order Status</h3>
      <div className="space-y-2">
        {steps.map((step, idx) => {
          const isDone = expired ? false : idx <= activeIndex;
          return (
            <div
              key={`${step.key}-${idx}`}
              className={`rounded-lg border p-3 ${
                expired
                  ? 'border-gray-200 bg-gray-50 opacity-70'
                  : isDone
                  ? 'border-pink-200 bg-pink-50'
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-900">{step.label}</span>
                {!expired && isDone && idx === activeIndex && <span className="text-xs font-semibold text-pink-600">Current</span>}
              </div>
              <p className="text-xs text-gray-600 mt-1">{step.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function formatRemaining(ms: number | null) {
  if (ms === null) return '—';
  if (ms <= 0) return '0:00';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function buildQrImageSrc(value: string) {
  if (!value) return null;
  // If it's already an image URL (data URI or image file), return as-is
  if (value.startsWith('data:image') || /\.(jpg|jpeg|png|gif|webp)$/i.test(value)) {
    return value;
  }
  // If it's a URL (like http://localhost:3000/pet/.../public), generate QR code from it
  if (/^https?:\/\//i.test(value)) {
    const encoded = encodeURIComponent(value);
    return `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encoded}`;
  }
  // Otherwise, treat as plain text and generate QR code
  const encoded = encodeURIComponent(value);
  return `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encoded}`;
}

