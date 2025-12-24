'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import type { CreateOrderRequest, CreateOrderResponse } from '@/lib/api-types';
import { useAuth } from '@/hooks/useAuth';

interface UserProfile {
  id: string;
  name?: string;
  phone?: string;
  homeAddress?: string;
  address?: string;
  shippingDistrict?: string;
  shippingPostalCode?: string;
}

// Tag color configuration with front/back image URLs
const TAG_COLORS = [
  {
    value: 'PINK',
    label: 'Pink',
    hex: '#E91E63',
    frontImage: 'https://ik.imagekit.io/3q7x0peae/Pet%20Public%20Img/pink_front.png',
    backImage: 'https://ik.imagekit.io/3q7x0peae/Pet%20Public%20Img/pink_back.png',
  },
  {
    value: 'GREEN',
    label: 'Green',
    hex: '#4CAF50',
    frontImage: 'https://ik.imagekit.io/3q7x0peae/Pet%20Public%20Img/green_front.png',
    backImage: 'https://ik.imagekit.io/3q7x0peae/Pet%20Public%20Img/green_back.png',
  },
  {
    value: 'BLUE',
    label: 'Blue',
    hex: '#2196F3',
    frontImage: 'https://ik.imagekit.io/3q7x0peae/Pet%20Public%20Img/blue_front.png?updatedAt=1765002001510',
    backImage: 'https://ik.imagekit.io/3q7x0peae/Pet%20Public%20Img/blue_back.png',
  },
  {
    value: 'PURPLE',
    label: 'Purple',
    hex: '#9C27B0',
    frontImage: 'https://ik.imagekit.io/3q7x0peae/Pet%20Public%20Img/purple_front.png',
    backImage: 'https://ik.imagekit.io/3q7x0peae/Pet%20Public%20Img/purple_back.png',
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
  const [selectedColor, setSelectedColor] = useState<string>('PINK');
  const [ordering, setOrdering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showBackSide, setShowBackSide] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [shippingAddress, setShippingAddress] = useState('');
  const [shippingDistrict, setShippingDistrict] = useState('');
  const [shippingPostalCode, setShippingPostalCode] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactName, setContactName] = useState('');
  const [showReview, setShowReview] = useState(false);
  const [quote, setQuote] = useState<{
    subtotal?: number;
    shipping?: number;
    total?: number;
    weightGrams?: number;
  }>({});
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'BKASH' | 'NAGAD' | 'ROCKET' | 'BANK'>('BKASH');
  const [paymentTrxId, setPaymentTrxId] = useState('');
  const [paymentAgent, setPaymentAgent] = useState('');
  const [paymentContact, setPaymentContact] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [orderTotal, setOrderTotal] = useState<number | undefined>(undefined);
  const [orderNo, setOrderNo] = useState<string | undefined>(undefined);
  const [orderExpiresAt, setOrderExpiresAt] = useState<string | undefined>(undefined);
  const [remainingMs, setRemainingMs] = useState<number | null>(null);

  const openPaymentModal = () => {
    setPaymentContact(contactPhone || '');
    setShowPaymentModal(true);
  };

  useEffect(() => {
    if (!orderExpiresAt) {
      setRemainingMs(null);
      return;
    }
    const target = new Date(orderExpiresAt).getTime();
    const tick = () => {
      const diff = target - Date.now();
      setRemainingMs(diff > 0 ? diff : 0);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [orderExpiresAt]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/signin');
      return;
    }

    if (isAuthenticated) {
      loadPet();
      loadUser();
    }
  }, [authLoading, isAuthenticated, router]);

  const loadUser = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (token) apiClient.setToken(token);
      const u = (await apiClient.getCurrentUser()) as UserProfile;
      // Prefill delivery fields if not already set
      const prefillAddress = u.homeAddress || u.address || '';
      const parsed = parseAddress(prefillAddress);
      setShippingAddress((prev) => prev || prefillAddress);
      setShippingDistrict((prev) => prev || u.shippingDistrict || parsed.district || '');
      setShippingPostalCode((prev) => prev || u.shippingPostalCode || parsed.postal || '');
      setContactPhone((prev) => prev || u.phone || '');
      setContactName((prev) => prev || u.name || '');
    } catch (err) {
      console.error('Failed to load user for delivery defaults', err);
    }
  };

  const parseAddress = (addr?: string): { postal?: string; district?: string } => {
    if (!addr) return {};
    const postalMatch = addr.match(/(\d{4})/);
    // naive district parse: take last comma-separated token with letters
    const parts = addr.split(',').map((p) => p.trim()).filter(Boolean);
    const districtGuess = parts.length ? parts[parts.length - 1] : undefined;
    return { postal: postalMatch ? postalMatch[1] : undefined, district: districtGuess };
  };

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

    if (!shippingAddress || !shippingDistrict || !shippingPostalCode) {
      setError('Please enter delivery address, district, and postal code.');
      return;
    }

    setShowReview(true);
  };

  const submitOrder = async () => {
    try {
      setOrdering(true);
      setError(null);
      const token = localStorage.getItem('auth_token');
      if (token) apiClient.setToken(token);

      // For now, map tag colors to a product SKU/ID; replace with real IDs from your seed
      const skuMap: Record<string, string> = {
        PINK: 'SKU-TAG-PINK',
        GREEN: 'SKU-TAG-GREEN',
        BLUE: 'SKU-TAG-BLUE',
        PURPLE: 'SKU-TAG-PURPLE',
      };
      const productId = skuMap[selectedColor] || skuMap.GREEN;

      // Create order with one item; shipping address can come from user profile/homeAddress if available
      const payload: CreateOrderRequest = {
        items: [{ productId, quantity: Math.max(1, quantity) }],
        shippingAddress: shippingAddress.trim(),
        shippingDistrict: shippingDistrict.trim() || undefined,
        shippingPostalCode: shippingPostalCode.trim() || undefined,
        contactPhone: contactPhone.trim() || undefined,
        contactName: contactName.trim() || pet?.name || undefined,
        petId: pet?.id,
        petQrUrl: pet?.qrCodeUrl,
      };

      // Defensive: ensure orderNo is not sent
      (payload as any).orderNo = undefined;

      // Do not send orderNo; backend generates it
      console.log('createOrder payload (clean)', payload);

      const orderResp: CreateOrderResponse = await apiClient.createOrder(payload);

      console.log('createOrder response', orderResp);

      setQuote({
        subtotal: orderResp.order?.subtotalBDT ?? subtotal,
        shipping: orderResp.order?.shippingFeeBDT ?? orderResp.shipping?.totalShippingBDT,
        total: orderResp.order?.totalBDT,
        weightGrams: orderResp.order?.weightGrams,
      });

      const newOrderNo = orderResp?.orderNo || orderResp?.order?.orderNo;
      if (!newOrderNo) throw new Error('Order number missing');
      setOrderNo(newOrderNo);
      setOrderTotal(orderResp.order?.totalBDT ?? orderResp.totalBDT ?? subtotal);
      setOrderExpiresAt((orderResp.order as any)?.expiresAt);
      openPaymentModal();
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
  const priceMap: Record<string, number> = {
    PINK: 500,
    GREEN: 500,
    BLUE: 500,
    PURPLE: 500,
  };
  const unitPrice = priceMap[selectedColor] ?? 500;
  const subtotal = unitPrice * Math.max(1, quantity);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-orange-50 p-5">
      <div className="max-w-4xl mx-auto">
        <Link
          href={pet ? `/dashboard/pets/${pet.id}` : '/dashboard/pets'}
          className="text-pink-500 hover:text-pink-600 mb-2 inline-block text-sm"
        >
          ← Back to Pet Details
        </Link>

        <div className="bg-white rounded-lg shadow-md p-5">
          <h1 className="text-[22px] font-semibold mb-1">Order Pet Tag for {pet?.name ?? 'your pet'}</h1>
          <p className="text-gray-600 mb-5 text-sm">
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
              <div className="grid grid-cols-4 gap-1.5">
                {TAG_COLORS.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => setSelectedColor(color.value)}
                    className={`p-1 rounded-lg border-2 transition-all ${
                      selectedColor === color.value
                        ? 'border-pink-500 shadow'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    title={`${color.label} (${color.hex.toUpperCase()})`}
                    aria-label={`${color.label} (${color.hex.toUpperCase()})`}
                  >
                    <div
                      className="w-full h-6 rounded"
                      style={{ backgroundColor: color.hex }}
                    ></div>
                  </button>
                ))}
              </div>
              <div className="mt-6">
                <h3 className="text-sm font-semibold mb-2">Quantity</h3>
                <div className="inline-flex items-center rounded-lg border border-gray-200 bg-white shadow-sm">
                  <button
                    type="button"
                    className="px-3 py-2 text-lg font-semibold text-gray-700 hover:bg-gray-50"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  >
                    −
                  </button>
                  <span className="px-4 py-2 text-base font-semibold text-gray-900 min-w-[3rem] text-center">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    className="px-3 py-2 text-lg font-semibold text-gray-700 hover:bg-gray-50"
                    onClick={() => setQuantity((q) => q + 1)}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="mt-6 p-5 bg-blue-50 rounded-lg border border-blue-100 text-base text-gray-800">
                <h3 className="text-lg font-semibold mb-3">Tag Specifications</h3>
                <ul className="list-disc list-inside space-y-2">
                  <li>Size: 32mm (standard pet tag size)</li>
                  <li>Material: Durable acrylic</li>
                  <li>QR Code: Links directly to your pet&apos;s profile</li>
                  <li>Customizable: Choose from 4 color options</li>
                </ul>
              </div>

              <div className="mt-3 space-y-2">
                <div className="space-y-1.5 flex-1">
                  <label className="text-sm font-semibold text-gray-700">Delivery address</label>
                  <textarea
                    className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                    rows={2}
                    placeholder="House, street, area"
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    onBlur={(e) => {
                      const parsed = parseAddress(e.target.value);
                      if (!shippingPostalCode && parsed.postal) setShippingPostalCode(parsed.postal);
                      if (!shippingDistrict && parsed.district) setShippingDistrict(parsed.district);
                    }}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-medium text-gray-700">District</label>
                    <input
                      className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                      placeholder="e.g., Dhaka"
                      value={shippingDistrict}
                      onChange={(e) => setShippingDistrict(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700">Postal code</label>
                    <input
                      className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                      placeholder="e.g., 1212"
                      value={shippingPostalCode}
                      onChange={(e) => setShippingPostalCode(e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-medium text-gray-700">Contact phone (for delivery)</label>
                    <input
                      className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                      placeholder="Optional"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700">Contact name</label>
                    <input
                      className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                      placeholder="Name for delivery"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Live Preview + Delivery Form */}
            <div className="space-y-6">
              <div className="grid md:grid-cols-[1fr,320px] gap-4">
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
                <div className="bg-gradient-to-br from-white via-gray-50 to-pink-50 rounded-2xl p-6 flex items-center justify-center shadow-lg border border-gray-100 relative">
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
                    <div className="absolute inset-0 flex items-end justify-center pb-50 pointer-events-none translate-y-[-150px] translate-x-[0px]">
                      <span
                        className="text-4xl sm:text-4xl font-extrabold drop-shadow-md tracking-widest"
                        style={{ fontFamily: 'JakartaDisplay, sans-serif', color: backTextColor }}
                      >
                        {pet.name}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              </div>
              <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h4 className="text-sm font-semibold text-gray-800 mb-3">Order Summary</h4>
                <div className="flex justify-between text-sm text-gray-700">
                  <span>Item</span>
                  <span>{selectedColorData.label} Tag × {Math.max(1, quantity)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-700 mt-1">
                  <span>Subtotal</span>
                  <span>{subtotal} BDT</span>
                </div>
                <div className="flex justify-between text-sm text-gray-700 mt-1">
                  <span>Shipping</span>
                  <span className="text-gray-500">
                    {quote.shipping !== undefined ? `${quote.shipping} BDT` : 'Calculated after address'}
                  </span>
                </div>
                {quote.weightGrams !== undefined && (
                  <div className="flex justify-between text-sm text-gray-700 mt-1">
                    <span>Billable weight</span>
                    <span>{quote.weightGrams} g</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-semibold text-gray-900 mt-2">
                  <span>Estimated total</span>
                  <span>
                    {quote.total !== undefined
                      ? `${quote.total} BDT`
                      : `${subtotal} BDT + shipping`}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Price + Order Button */}
          <div className="mt-8 flex flex-col items-center gap-3">
            <div className="text-center space-y-1">
              <div className="text-lg font-semibold text-gray-800">
                Subtotal: <span className="text-pink-600">{subtotal} BDT</span>
              </div>
              <div className="text-sm text-gray-600">
                Shipping calculated after address is confirmed.
              </div>
            </div>
            <button
              onClick={handleOrder}
              disabled={ordering || !pet.qrCodeUrl}
              className="px-8 py-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg font-semibold"
            >
              {ordering ? 'Processing...' : `Review & Pay (${subtotal} BDT + shipping)`}
            </button>
          </div>

          {showReview && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
              <div className="bg-white rounded-lg shadow-xl max-w-xl w-full p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold">Review your order</h3>
                  <button
                    className="text-gray-500 hover:text-gray-700"
                    onClick={() => setShowReview(false)}
                    disabled={ordering}
                  >
                    ✕
                  </button>
                </div>
                <div className="space-y-2 text-sm text-gray-700">
                  <div className="flex justify-between">
                    <span>Item</span>
                    <span>{selectedColorData.label} Tag × {Math.max(1, quantity)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{subtotal} BDT</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span className="text-gray-500">
                      {quote.shipping !== undefined ? `${quote.shipping} BDT` : 'Calculated at checkout'}
                    </span>
                  </div>
                  {quote.weightGrams !== undefined && (
                    <div className="flex justify-between">
                      <span>Billable weight</span>
                      <span>{quote.weightGrams} g</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold text-gray-900">
                    <span>Total (est.)</span>
                    <span>
                      {quote.total !== undefined
                        ? `${quote.total} BDT`
                        : `${subtotal} BDT + shipping`}
                    </span>
                  </div>
                </div>
                <div className="space-y-2 text-sm text-gray-700">
                  <div className="font-semibold text-gray-900">Delivery address</div>
                  <div className="whitespace-pre-line">
                    {shippingAddress || 'Not provided'}
                  </div>
                  <div>District: {shippingDistrict || '—'}</div>
                  <div>Postal code: {shippingPostalCode || '—'}</div>
                  {contactPhone && <div>Phone: {contactPhone}</div>}
                  {contactName && <div>Name: {contactName}</div>}
                  <div className="text-xs text-gray-500">You can edit the fields on the page before confirming.</div>
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    className="px-4 py-2 rounded-md border border-gray-200 text-gray-700 hover:bg-gray-50"
                    onClick={() => setShowReview(false)}
                    disabled={ordering}
                  >
                    Edit
                  </button>
                  <button
                    className="px-4 py-2 rounded-md bg-pink-500 text-white font-semibold hover:bg-pink-600 disabled:opacity-60"
                    onClick={submitOrder}
                    disabled={ordering}
                  >
                    {ordering ? 'Placing order...' : 'Confirm & Pay'}
                  </button>
                </div>
              </div>
            </div>
          )}
          {showPaymentModal && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold">Payment via mobile / bank</h3>
                  <button
                    className="text-gray-500 hover:text-gray-700"
                    onClick={() => setShowPaymentModal(false)}
                    disabled={ordering}
                  >
                    ✕
                  </button>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="rounded-lg border border-gray-200 p-3 bg-gray-50">
                    <img
                      src="https://ik.imagekit.io/3q7x0peae/Pet%20Public%20Img/donation.png?updatedAt=1765031751558"
                      alt="Payment QR and accounts"
                      className="w-full h-auto rounded"
                    />
                    <p className="text-xs font-semibold text-red-600 mt-2">
                      Scan or pay to the listed accounts, then provide your transaction ID.
                    </p>
                  </div>
                  <div className="space-y-3 text-sm text-gray-700">
                    <div className="flex items-center justify-between">
                      <span>Order</span>
                      <span className="font-semibold">{orderNo}</span>
                    </div>
                    {orderExpiresAt && (
                      <div className="flex items-center justify-between text-xs">
                        <span>Expires in</span>
                        <span className={remainingMs === 0 ? 'text-red-600 font-semibold' : 'text-gray-700'}>
                          {formatRemaining(remainingMs)}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span>Total</span>
                      <span className="font-semibold">{orderTotal ?? quote.total ?? subtotal} BDT</span>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Payment method</label>
                      <select
                        className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-400"
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value as any)}
                      >
                        <option value="BKASH">bKash</option>
                        <option value="NAGAD">Nagad</option>
                        <option value="ROCKET">Rocket</option>
                        <option value="BANK">Bank</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Transaction ID (TrxID) <span className="text-red-600">*</span>
                      </label>
                      <input
                        className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-400"
                        value={paymentTrxId}
                        onChange={(e) => setPaymentTrxId(e.target.value)}
                        placeholder="e.g., BK1234XXXX"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Agent/Account <span className="text-red-600">*</span>
                        </label>
                        <input
                          className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-400"
                          value={paymentAgent}
                          onChange={(e) => setPaymentAgent(e.target.value)}
                          placeholder="Account or agent number"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Contact number <span className="text-red-600">*</span>
                        </label>
                        <input
                          className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 bg-gray-50 text-gray-700"
                          value={paymentContact}
                          placeholder="Your phone"
                          required
                          readOnly
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Note (optional)</label>
                      <textarea
                        className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-400"
                        rows={2}
                        value={paymentNote}
                        onChange={(e) => setPaymentNote(e.target.value)}
                        placeholder="Anything we should know"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    className="px-4 py-2 rounded-md border border-gray-200 text-gray-700 hover:bg-gray-50"
                    onClick={() => setShowPaymentModal(false)}
                    disabled={ordering}
                  >
                    Cancel
                  </button>
                  <button
                    className="px-4 py-2 rounded-md bg-pink-500 text-white font-semibold hover:bg-pink-600 disabled:opacity-60"
                    onClick={async () => {
                      const isExpired = remainingMs !== null && remainingMs <= 0;
                      if (isExpired) {
                        setError('Order expired. Please create a new order.');
                        return;
                      }
                      if (!orderNo) {
                        setError('Order number missing');
                        return;
                      }
                          if (!paymentTrxId.trim()) {
                            setError('Transaction ID is required');
                            return;
                          }
                          if (!paymentContact.trim()) {
                            setError('Contact number is required');
                            return;
                          }
                          if (!paymentAgent.trim()) {
                            setError('Agent/Account is required');
                            return;
                          }
                      try {
                        setOrdering(true);
                        await apiClient.submitManualPayment({
                          orderNo,
                          method: paymentMethod,
                          amountBDT: orderTotal ?? quote.total ?? subtotal,
                          trxId: paymentTrxId.trim(),
                              agentAccount: paymentAgent.trim() || undefined,
                          contactNumber: paymentContact.trim() || undefined,
                          note: paymentNote.trim() || undefined,
                        });
                        setShowPaymentModal(false);
                        setShowReview(false);
                        setError(null);
                        setQuantity(1);
                        setPaymentTrxId('');
                        setPaymentAgent('');
                        setPaymentNote('');
                        setOrderNo(undefined);
                        setOrderTotal(undefined);
                        setOrderExpiresAt(undefined);
                        setRemainingMs(null);
                        alert('Payment submitted. We will verify your transaction shortly.');
                        router.push('/dashboard/orders');
                      } catch (err: any) {
                        setError(err?.message || 'Failed to submit payment');
                      } finally {
                        setOrdering(false);
                      }
                    }}
                    disabled={ordering}
                  >
                    {ordering ? 'Submitting...' : remainingMs !== null && remainingMs <= 0 ? 'Order expired' : 'Use this payment'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
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

