'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';

interface AdminOrder {
  orderNo: string;
  status: string;
  totalBDT: number;
  subtotalBDT: number;
  shippingFeeBDT: number;
  petId?: string | null;
  petQrUrl?: string | null;
  contactName?: string | null;
  contactPhone?: string | null;
  shippingAddress?: string | null;
  shippingDistrict?: string | null;
  shippingPostalCode?: string | null;
  pet?: { id: string; name?: string | null; qrCodeUrl?: string | null } | null;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
  items?: Array<{
    productId: string;
    name: string;
    sku: string;
    quantity: number;
    unitPriceBDT: number;
    totalBDT: number;
  }>;
  manualPayments?: Array<{
    id: string;
    method: string;
    amountBDT: number;
    trxId: string;
    agentAccount?: string | null;
    contactNumber?: string | null;
    note?: string | null;
    status: string;
    createdAt: string;
  }>;
  user?: { id: string; email: string; name?: string };
}

const TAG_SKU_LOOKUP: Record<
  string,
  { label: string; color: string; image: string; qrOverlay?: string }
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

function buildQrImageSrc(value: string) {
  if (!value) return '';
  const isUrl = /^https?:\/\//i.test(value) || value.startsWith('data:image');
  if (isUrl) {
    // If it's an image/data URL, use as-is; if it's a regular URL, generate QR from the URL text
    if (value.startsWith('data:image')) return value;
    const encoded = encodeURIComponent(value);
    return `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encoded}`;
  }
  const encoded = encodeURIComponent(value);
  return `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encoded}`;
}

function getQrSrc(order: AdminOrder) {
  const raw = order.petQrUrl || order.pet?.qrCodeUrl || order.orderNo;
  return buildQrImageSrc(raw);
}

export default function AdminOrderTrackingPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');

  useEffect(() => {
    const token = localStorage.getItem('admin_access_token');
    if (!token) {
      router.push('/admin/login');
      return;
    }
    apiClient.setToken(token);
    setAuthorized(true);
    setChecking(false);
    loadOrders('');
  }, [router]);

  if (checking || !authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-800 text-white">
        <p className="text-sm text-white/80">Checking admin access…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-800 text-white px-6 py-10">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-white/70">Admin Console</p>
            <h1 className="text-2xl font-semibold">Order Tracking</h1>
            <p className="text-white/80 text-sm">Update tracking statuses and review order timelines.</p>
          </div>
          <Link
            href="/admin"
            className="px-4 py-2 rounded-full bg-white text-purple-800 font-semibold shadow hover:shadow-lg transition"
          >
            Back to Admin
          </Link>
        </div>

        <div className="rounded-2xl bg-white/10 border border-white/10 backdrop-blur p-6 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold">Orders</h2>
            <div className="flex items-center gap-3">
              <select
                value={statusFilter}
                onChange={(e) => {
                  const newFilter = e.target.value;
                  setStatusFilter(newFilter);
                  loadOrders(newFilter);
                }}
                className="px-3 py-1.5 rounded-full bg-white text-purple-900 text-sm font-semibold border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 shadow"
              >
                <option value="">All Statuses</option>
                <option value="PENDING">PENDING</option>
                <option value="UNDER_REVIEW">UNDER_REVIEW</option>
                <option value="PAID">PAID</option>
                <option value="ORDER_PLACED">ORDER_PLACED</option>
                <option value="PAYMENT_UNDER_REVIEW">PAYMENT_UNDER_REVIEW</option>
                <option value="PAYMENT_VERIFIED">PAYMENT_VERIFIED</option>
                <option value="ORDER_PACKED">ORDER_PACKED</option>
                <option value="SHIPPED">SHIPPED</option>
                <option value="IN_TRANSIT">IN_TRANSIT</option>
                <option value="OUT_FOR_DELIVERY">OUT_FOR_DELIVERY</option>
                <option value="DELIVERED">DELIVERED</option>
              </select>
              <button
                onClick={() => loadOrders(statusFilter)}
                className="px-3 py-1.5 rounded-full bg-white text-purple-800 text-sm font-semibold shadow hover:shadow-lg transition"
              >
                Refresh
              </button>
            </div>
          </div>
          {loading ? (
            <p className="text-sm text-white/80">Loading orders...</p>
          ) : error ? (
            <p className="text-sm text-red-200">{error}</p>
          ) : (
            <div className="space-y-3">
              {orders.map((o) => (
                <div
                  key={o.orderNo}
                  className="rounded-xl border border-white/10 bg-white/5 backdrop-blur p-4 flex flex-col gap-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-white/10 border border-white/10 overflow-hidden flex items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={getQrSrc(o)} alt="Pet QR" className="w-full h-full object-contain" />
                      </div>
                      <div>
                        <p className="text-sm text-white/70">Order</p>
                        <p className="text-lg font-semibold text-white">{o.orderNo}</p>
                        {o.pet?.name && <p className="text-xs text-white/60">Pet: {o.pet.name}</p>}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-white/60">User</p>
                      <p className="text-sm text-white/80">{o.user?.email || '—'}</p>
                    </div>
                  </div>
                  <OrderDetails order={o} />
                  <div className="flex items-center gap-3">
                    <label className="text-xs text-white/70 font-medium">Status:</label>
                    <select
                      value={o.status || ''}
                      onChange={(e) => handleUpdateStatus(o.orderNo, e.target.value)}
                      disabled={updating === o.orderNo}
                      className="px-3 py-1.5 rounded-lg bg-white text-purple-900 text-sm font-semibold border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 disabled:opacity-60 disabled:cursor-not-allowed shadow"
                    >
                      <option value="PENDING">PENDING</option>
                      <option value="UNDER_REVIEW">UNDER_REVIEW</option>
                      <option value="PAID">PAID</option>
                      <option value="ORDER_PLACED">ORDER_PLACED</option>
                      <option value="PAYMENT_UNDER_REVIEW">PAYMENT_UNDER_REVIEW</option>
                      <option value="PAYMENT_VERIFIED">PAYMENT_VERIFIED</option>
                      <option value="ORDER_PACKED">ORDER_PACKED</option>
                      <option value="SHIPPED">SHIPPED</option>
                      <option value="IN_TRANSIT">IN_TRANSIT</option>
                      <option value="OUT_FOR_DELIVERY">OUT_FOR_DELIVERY</option>
                      <option value="DELIVERED">DELIVERED</option>
                      <option value="FAILED">FAILED</option>
                      <option value="CANCELLED">CANCELLED</option>
                      <option value="EXPIRED">EXPIRED</option>
                    </select>
                    {updating === o.orderNo && <span className="text-xs text-white/60">Updating…</span>}
                  </div>
                </div>
              ))}
              {orders.length === 0 && <p className="text-sm text-white/70">No orders found.</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  async function loadOrders(filter?: string) {
    try {
      setLoading(true);
      setError(null);
      const params = filter ? { status: filter } : undefined;
      const data = (await apiClient.adminListOrders(params)) as AdminOrder[];
      setOrders(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateStatus(orderNo: string, status: string) {
    try {
      setUpdating(orderNo);
      await apiClient.adminUpdateStatus(orderNo, status);
      await loadOrders(statusFilter);
    } catch (err: any) {
      alert(err?.message || 'Failed to update status');
    } finally {
      setUpdating(null);
    }
  }
}

function OrderDetails({ order }: { order: AdminOrder }) {
  const item = order.items?.[0];
  const skuInfo = item?.sku ? TAG_SKU_LOOKUP[item.sku] : undefined;
  const payment = order.manualPayments?.[0];
  const qrSrc = getQrSrc(order);

  const downloadQr = () => {
    const petName = order.pet?.name || order.contactName || 'pet';
    const color = skuInfo?.label || 'tag';
    const slug = (val: string) =>
      val
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-_]/g, '');
    const link = document.createElement('a');
    link.href = qrSrc;
    link.download = `${slug(petName)}-${slug(color) || 'qr'}.png`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="grid md:grid-cols-2 gap-4 text-sm text-white/80">
      <div className="rounded-lg border border-white/5 bg-white/5 p-3 space-y-3">
        <div className="flex gap-3">
          <div className="w-16 h-16 rounded-xl bg-white/10 border border-white/10 overflow-hidden flex items-center justify-center">
            {skuInfo?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={skuInfo.image} alt={skuInfo.label} className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs text-white/60">No image</span>
            )}
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-white">{item?.name || 'Product'}</p>
            <p className="text-xs text-white/60">
              {skuInfo?.label || item?.sku || '—'} · Qty {item?.quantity ?? '—'}
            </p>
            <p className="text-xs text-white/60">Total: {item ? `${item.totalBDT} BDT` : `${order.totalBDT} BDT`}</p>
            {skuInfo?.color && <div className="mt-2 h-2.5 w-12 rounded-full" style={{ background: skuInfo.color }} />}
          </div>
        </div>
        <div className="flex flex-wrap gap-3 text-xs text-white/70">
          <span>Pet name: {order.pet?.name || order.contactName || '—'}</span>
          <span>Contact: {order.contactPhone || '—'}</span>
        </div>
        <div>
          <p className="text-xs text-white/60 mb-1">QR code</p>
          <div className="w-24 h-24 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center p-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrSrc} alt="Order QR" className="w-full h-full object-contain" />
          </div>
          <button
            onClick={downloadQr}
            className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white text-purple-800 text-xs font-semibold shadow hover:shadow-lg transition"
          >
            Download QR
          </button>
        </div>
        <div className="flex flex-wrap gap-4 text-xs text-white/70">
          <span>Total: {order.totalBDT} BDT</span>
          {order.expiresAt && <span>Expires: {new Date(order.expiresAt).toLocaleString()}</span>}
        </div>
      </div>
      <div className="rounded-lg border border-white/5 bg-white/5 p-3 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-white">Manual Payment</p>
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
              payment
                ? payment.status === 'APPROVED'
                  ? 'bg-green-200 text-green-900'
                  : payment.status === 'REJECTED'
                  ? 'bg-red-200 text-red-900'
                  : 'bg-yellow-100 text-yellow-800'
                : 'bg-white/10 text-white'
            }`}
          >
            {payment ? payment.status : 'Not provided'}
          </span>
        </div>
        {payment ? (
          <div className="space-y-1 text-xs text-white/80">
            <p>Method: {payment.method}</p>
            <p>Amount: {payment.amountBDT} BDT</p>
            <p>Transaction ID: {payment.trxId}</p>
            {payment.agentAccount && <p>Agent/Account: {payment.agentAccount}</p>}
            {payment.contactNumber && <p>Contact: {payment.contactNumber}</p>}
            {payment.note && <p>Note: {payment.note}</p>}
            <p className="text-white/60">Submitted: {new Date(payment.createdAt).toLocaleString()}</p>
          </div>
        ) : (
          <p className="text-xs text-white/60">No manual payment submitted yet.</p>
        )}
      </div>
    </div>
  );
}

