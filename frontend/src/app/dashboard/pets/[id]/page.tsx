'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { QRCodeSVG } from 'qrcode.react';
import { downloadQRCodeAsPNG } from '@/lib/qr-download';
import PetImageUpload from '@/components/PetImageUpload';
import PetImageGallery from '@/components/PetImageGallery';
import ResponsiveImage from '@/components/ResponsiveImage';
import dynamic from 'next/dynamic';

// Dynamically import map to avoid SSR issues
const DynamicPetMap = dynamic(() => import('@/components/PetMap'), {
  ssr: false,
});

interface PetImage {
  id: string;
  url: string;
  fileId: string;
  createdAt: string;
}

interface Pet {
  id: string;
  name: string;
  type: string;
  breed?: string;
  color?: string;
  gender: string;
  neutered: boolean;
  description?: string;
  isLost: boolean;
  qrCodeUrl?: string;
  images?: PetImage[];
  vaccines?: Array<any>;
  owner?: {
    id: string;
    name?: string;
    email: string;
  };
  gpsHistory?: Array<{
    lat: number;
    lng: number;
    recordedAt: string;
  }>;
}

export default function PetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [pet, setPet] = useState<Pet | null>(null);
  const [images, setImages] = useState<PetImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showQR, setShowQR] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [imageFitMode, setImageFitMode] = useState<'cover' | 'contain'>('cover');
  const isOwner = pet?.owner?.id === user?.id;
  const unreadCount = notifications.filter((n) => !n.read).length;
  const missingContactInfo = isOwner && (!user?.phone || !user?.homeAddress);

  useEffect(() => {
    loadPet();
    loadImages();
  }, [params.id]);

  useEffect(() => {
    // Load notifications when pet is loaded and user is owner
    if (pet && user && pet.owner?.id === user.id) {
      loadNotifications();
    }
  }, [pet, user]);

  const loadPet = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      if (token) {
        apiClient.setToken(token);
      }
          const data = await apiClient.getPet(params.id as string) as Pet;
          setPet(data);
    } catch (error) {
      console.error('Failed to load pet:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadImages = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (token) {
        apiClient.setToken(token);
      }
          const data = await apiClient.getPetImages(params.id as string) as PetImage[];
          setImages(data);
    } catch (error) {
      console.error('Failed to load images:', error);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this pet?')) return;

    try {
      const token = localStorage.getItem('auth_token');
      if (token) {
        apiClient.setToken(token);
      }
      await apiClient.deletePet(params.id as string);
      router.push('/dashboard/pets');
    } catch (error) {
      console.error('Failed to delete pet:', error);
      alert('Failed to delete pet. Please try again.');
    }
  };

  const loadNotifications = async () => {
    if (!isOwner) return;
    
    try {
      setLoadingNotifications(true);
      const token = localStorage.getItem('auth_token');
      if (token) {
        apiClient.setToken(token);
      }
          const data = await apiClient.getNotifications(50, 0) as { notifications: Notification[] };
          // Filter notifications related to this pet
          const petNotifications = data.notifications.filter(
        (notif: any) => notif.payload?.petId === params.id
      );
      setNotifications(petNotifications);
    } catch (error: unknown) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const toggleLostStatus = async () => {
    if (!pet) return;
    if (missingContactInfo) {
      alert('Add your phone number and home address in Profile before marking your pet as lost.');
      router.push('/dashboard/profile');
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      if (token) {
        apiClient.setToken(token);
      }
      await apiClient.setPetLostStatus(pet.id, !pet.isLost);
      loadPet();
      if (isOwner) {
        loadNotifications();
      }
    } catch (error: unknown) {
      console.error('Failed to update lost status:', error);
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      if (token) {
        apiClient.setToken(token);
      }
      await apiClient.markNotificationAsRead(notificationId);
      loadNotifications();
    } catch (error: unknown) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    if (!confirm('Are you sure you want to delete this notification?')) {
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      if (token) {
        apiClient.setToken(token);
      }
      await apiClient.deleteNotification(notificationId);
      // Success - refresh notifications list
      loadNotifications();
    } catch (error: unknown) {
      console.error('Failed to delete notification:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      // Only show alert if it's a real error (not 204 No Content)
      if (!errorMessage.includes('204')) {
        alert(`Failed to delete notification: ${errorMessage}. Please try again.`);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Pet not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-orange-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <Link
          href="/dashboard/pets"
          className="text-sm sm:text-base text-pink-500 hover:text-pink-600 mb-6 inline-block font-medium"
        >
          ← Back to Pets
        </Link>

        {/* Two-Column Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {/* Left Column: Main Image + Gallery + Action Buttons */}
          <div className="space-y-4">
            {/* Profile Image Section */}
            {images.length > 0 && (
              <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-200 p-6 shadow-lg">
                <div className="flex flex-col items-center gap-4">
                  <div className="relative w-full max-w-[400px] group">
                    <div className="relative overflow-hidden rounded-2xl shadow-xl border-4 border-white ring-2 ring-pink-100 transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-2xl">
                      <ResponsiveImage
                        src={images[0].url}
                        alt={pet.name}
                        aspectRatio="4:5"
                        objectFit={imageFitMode}
                        containerClassName="w-full aspect-[4/5] overflow-hidden"
                        className="rounded-xl transition-transform duration-500 group-hover:scale-110"
                        showModal={true}
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => setImageFitMode(imageFitMode === 'cover' ? 'contain' : 'cover')}
                    className="px-5 py-2.5 text-sm bg-white hover:bg-gray-50 text-gray-700 rounded-full transition-all shadow-sm hover:shadow-md border border-gray-200 font-medium"
                    aria-label={`Switch to ${imageFitMode === 'cover' ? 'no crop' : 'crop'} mode`}
                  >
                    {imageFitMode === 'cover' ? '📐 Show Full Image (No Crop)' : '✂️ Crop to Fit'}
                  </button>
                </div>
              </div>
            )}

            {/* Image Gallery Section */}
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-200 p-6 shadow-lg">
              <h3 className="text-xl font-semibold text-gray-900 mb-6 tracking-tight">Pet Images</h3>
              <PetImageGallery
                petId={pet.id}
                images={images}
                isOwner={isOwner}
                onDelete={loadImages}
              />
              {isOwner && (
                <div className="mt-6">
                  <PetImageUpload
                    petId={pet.id}
                    currentImageCount={images.length}
                    onUploadSuccess={() => {
                      loadImages();
                      loadPet();
                    }}
                  />
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-200 p-6 shadow-lg space-y-4">
              <button
                onClick={toggleLostStatus}
                disabled={missingContactInfo}
                className={`w-full px-6 py-3.5 rounded-full transition-all flex items-center justify-center text-sm font-semibold shadow-md hover:shadow-lg transform hover:scale-[1.02] ${
                  pet.isLost
                    ? 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700'
                    : 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white hover:from-yellow-600 hover:to-yellow-700'
                } ${missingContactInfo ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                {pet.isLost ? '✓ Mark as Found' : '⚠️ Mark as Lost'}
              </button>
              {missingContactInfo && (
                <p className="text-xs text-red-600 font-medium">
                  Please add your phone number and home address in Profile to mark your pet as lost.
                </p>
              )}
              <div className="grid grid-cols-2 gap-3">
                {isOwner && (
                  <Link
                    href={`/dashboard/pets/${pet.id}/order-tag`}
                    className="px-4 py-2.5 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-full hover:from-pink-600 hover:to-pink-700 transition-all flex items-center justify-center text-sm font-semibold shadow-md hover:shadow-lg transform hover:scale-[1.02]"
                  >
                    🏷️ Order Tag
                  </Link>
                )}
                <Link
                  href={`/dashboard/pets/${pet.id}/edit`}
                  className="px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full hover:from-blue-600 hover:to-blue-700 transition-all flex items-center justify-center text-sm font-semibold shadow-md hover:shadow-lg transform hover:scale-[1.02]"
                >
                  ✏️ Edit
                </Link>
              </div>
              <button
                onClick={handleDelete}
                className="w-full px-6 py-3.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full hover:from-red-600 hover:to-red-700 transition-all flex items-center justify-center text-sm font-semibold shadow-md hover:shadow-lg transform hover:scale-[1.02]"
              >
                🗑️ Delete Pet
              </button>
            </div>
          </div>

          {/* Right Column: Pet Name & Metadata + Cards */}
          <div className="space-y-4">
            {/* Pet Name & Metadata Card - Clickable to Edit */}
            <Link
              href={`/dashboard/pets/${pet.id}/edit`}
              className="block bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-200 p-6 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-[1.01]"
            >
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <h1 className="text-2xl font-semibold text-gray-900 break-words leading-tight tracking-tight">{pet.name}</h1>
                {isOwner && unreadCount > 0 && (
                  <span className="px-3 py-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs rounded-full font-semibold shadow-sm">
                    {unreadCount} new
                  </span>
                )}
                {pet.isLost && (
                  <span className="px-3 py-1 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs rounded-full font-semibold shadow-sm">
                    Lost
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 leading-relaxed">
                <span className="capitalize font-medium">{pet.type}</span>
                {pet.breed && <span> • {pet.breed}</span>}
                {pet.color && <span> • {pet.color}</span>}
              </p>
            </Link>

            {/* QR Code Card */}
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-200 p-6 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-gray-900 text-xl tracking-tight">QR Code</h3>
                <button
                  onClick={() => setShowQR(!showQR)}
                  className="px-5 py-2.5 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-full hover:from-pink-600 hover:to-pink-700 transition-all text-sm font-semibold shadow-md hover:shadow-lg transform hover:scale-105"
                >
                  {showQR ? 'Hide' : 'Show'} QR Code
                </button>
              </div>
              {showQR && pet.qrCodeUrl && (
                <div className="flex flex-col items-center gap-6">
                  <div className="p-6 bg-white rounded-2xl shadow-lg border border-gray-100">
                    <QRCodeSVG value={pet.qrCodeUrl} size={256} data-qr-code={pet.id} />
                  </div>
                  <button
                    onClick={async () => {
                      if (!pet.qrCodeUrl) return;
                      try {
                        if (pet.qrCodeUrl) {
                          await downloadQRCodeAsPNG(
                            pet.qrCodeUrl,
                            `${pet.name}-qr-code.png`,
                            512
                          );
                        }
                      } catch (error) {
                        console.error('Failed to download QR code:', error);
                        alert('Failed to download QR code. Please try again.');
                      }
                    }}
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full hover:from-blue-600 hover:to-blue-700 transition-all text-sm font-semibold shadow-md hover:shadow-lg transform hover:scale-105"
                  >
                    📥 Download QR Code
                  </button>
                </div>
              )}
            </div>

            {/* Pet Details Card */}
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-200 p-6 shadow-lg">
              <h3 className="font-semibold text-gray-900 mb-6 text-xl tracking-tight">Pet Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="pb-3 border-b border-gray-100">
                  <span className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Type</span>
                  <p className="mt-1 capitalize text-gray-900 font-medium">{pet.type}</p>
                </div>
                {pet.breed && (
                  <div className="pb-3 border-b border-gray-100">
                    <span className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Breed</span>
                    <p className="mt-1 text-gray-900 font-medium">{pet.breed}</p>
                  </div>
                )}
                {pet.color && (
                  <div className="pb-3 border-b border-gray-100">
                    <span className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Color</span>
                    <p className="mt-1 text-gray-900 font-medium">{pet.color}</p>
                  </div>
                )}
                <div className="pb-3 border-b border-gray-100">
                  <span className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Gender</span>
                  <p className="mt-1 capitalize text-gray-900 font-medium">{pet.gender}</p>
                </div>
                <div className="pb-3 border-b border-gray-100">
                  <span className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Neutered</span>
                  <p className="mt-1 text-gray-900 font-medium">{pet.neutered ? 'Yes' : 'No'}</p>
                </div>
              </div>
            </div>

            {/* Description Card */}
            {pet.description && (
              <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-200 p-6 shadow-lg">
                <h3 className="font-semibold text-gray-900 mb-6 text-xl tracking-tight">Description</h3>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-base">{pet.description}</p>
              </div>
            )}

            {/* Notifications Card - Only show for owner */}
            {isOwner && (
              <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-200 p-6 shadow-lg">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-6">
                  <h3 className="text-xl font-semibold text-gray-900 tracking-tight">
                    Notifications {unreadCount > 0 && <span className="ml-2 px-3 py-1 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs rounded-full font-semibold shadow-sm">{unreadCount} New</span>}
                  </h3>
                  <button
                    onClick={loadNotifications}
                    disabled={loadingNotifications}
                    className="px-4 py-2 text-sm bg-white border border-gray-200 text-gray-700 rounded-full hover:bg-gray-50 disabled:opacity-50 transition-all font-semibold shadow-sm hover:shadow-md"
                  >
                    {loadingNotifications ? 'Refreshing...' : '🔄 Refresh'}
                  </button>
                </div>
              {loadingNotifications ? (
                <div className="flex items-center justify-center p-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
                  <span className="ml-4 text-gray-600">Loading notifications...</span>
                </div>
              ) : notifications.length > 0 ? (
                <div className="space-y-4">
                  {notifications.map((notif) => {
                    // Debug: Log notification payload
                    console.log('Notification payload:', notif.payload);
                    console.log('Image URL:', notif.payload?.imageUrl);
                    
                    return (
                    <div
                      key={notif.id}
                      className={`p-4 sm:p-5 rounded-xl border shadow-sm ${
                        notif.read
                          ? 'bg-white border-gray-200'
                          : 'bg-gradient-to-r from-blue-50 to-blue-100/50 border-blue-200 border-l-4'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-start justify-between gap-3">
                        <div className="flex-1 w-full">
                          {notif.type === 'LOST_PET_FOUND' ? (
                            <>
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-2xl">🎉</span>
                                <h4 className="font-semibold text-blue-800">
                                  {pet.name} was found!
                                </h4>
                                {!notif.read && (
                                  <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded-full">
                                    New
                                  </span>
                                )}
                              </div>
                              {notif.payload?.foundLocation && (
                                <div className="mt-2 space-y-3 text-sm text-gray-700">
                                  {/* Address & phone only */}
                                  <div className="p-3 bg-gray-50 rounded-lg">
                                    <p className="font-medium text-gray-900 mb-2">📍 Location</p>
                                    <div className="space-y-2">
                                      {notif.payload.address && (
                                        <p>
                                          <span className="font-medium">Address:</span>{' '}
                                          <span className="text-gray-800">{notif.payload.address}</span>
                                        </p>
                                      )}
                                      {notif.payload.phone && (
                                        <p>
                                          <span className="font-medium">Phone:</span>{' '}
                                          <a
                                            href={`tel:${notif.payload.phone}`}
                                            className="text-pink-500 hover:underline font-medium"
                                          >
                                            {notif.payload.phone}
                                          </a>
                                        </p>
                                      )}
                                    </div>
                                  </div>

                                  {/* Note */}
                                  {notif.payload.note && (
                                    <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                                      <p className="font-medium text-gray-900 mb-1">💬 Note from Finder</p>
                                      <p className="text-gray-800">{notif.payload.note}</p>
                                    </div>
                                  )}

                                  {/* Photo */}
                                  {(notif.payload?.imageUrl || notif.payload?.image_url) && (
                                    <div className="p-3 bg-gray-50 rounded-lg">
                                      <p className="font-medium text-gray-900 mb-3">📷 Photo</p>
                                      {(() => {
                                        const imgUrl = notif.payload.imageUrl || notif.payload.image_url;
                                        return (
                                          <div className="w-full flex justify-center">
                                            <ResponsiveImage
                                              src={imgUrl}
                                              alt="Pet found location"
                                              aspectRatio="square"
                                              containerClassName="w-full max-w-md sm:max-w-lg"
                                              className="border border-gray-300 shadow-md"
                                              showModal={true}
                                            />
                                          </div>
                                        );
                                      })()}
                                    </div>
                                  )}
                                  {/* Debug info in development */}
                                  {process.env.NODE_ENV === 'development' && (
                                    <details className="text-xs text-gray-400 mt-1 p-2 bg-gray-100 rounded">
                                      <summary className="cursor-pointer">Debug Info</summary>
                                      <pre className="mt-2 text-xs overflow-auto">
                                        {JSON.stringify(notif.payload, null, 2)}
                                      </pre>
                                    </details>
                                  )}

                                  <p className="text-xs text-gray-500 mt-3 pt-3 border-t border-gray-200">
                                    Reported on {new Date(notif.createdAt).toLocaleString()}
                                  </p>
                                </div>
                              )}
                            </>
                          ) : notif.type === 'LOST_ALERT' ? (
                            <div>
                              <h4 className="font-semibold text-yellow-800 mb-1">
                                Lost Pet Alert
                              </h4>
                              <p className="text-sm text-gray-700">
                                A pet named {notif.payload?.petName} was reported lost nearby.
                              </p>
                              <p className="text-xs text-gray-500 mt-2">
                                {new Date(notif.createdAt).toLocaleString()}
                              </p>
                            </div>
                          ) : null}
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 mt-2 sm:mt-0">
                          {!notif.read && (
                            <button
                              onClick={() => markNotificationAsRead(notif.id)}
                              className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors whitespace-nowrap"
                            >
                              Mark as read
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notif.id)}
                            className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors whitespace-nowrap"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </div>
                    </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-lg">
                  <p>No notifications yet</p>
                  {pet.isLost && (
                    <p className="text-sm mt-2">
                      You'll receive notifications when someone reports finding {pet.name}
                    </p>
                  )}
                </div>
              )}
              </div>
            )}

            {/* Map Section */}
            {pet.gpsHistory && pet.gpsHistory.length > 0 && (
              <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-200 p-6 shadow-lg">
                <h3 className="text-xl font-semibold text-gray-900 mb-6 tracking-tight">Location History</h3>
                <DynamicPetMap
                  locations={pet.gpsHistory.map((gps) => ({
                    id: `${pet.id}-${gps.recordedAt}`,
                    name: pet.name,
                    type: pet.type,
                    lat: gps.lat,
                    lng: gps.lng,
                    isLost: pet.isLost,
                  }))}
                  height="500px"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

