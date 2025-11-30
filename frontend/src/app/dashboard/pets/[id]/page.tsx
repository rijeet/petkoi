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
import PetMap from '@/components/PetMap';
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
  const isOwner = pet?.owner?.id === user?.id;
  const unreadCount = notifications.filter((n) => !n.read).length;

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
      const data = await apiClient.getPet(params.id as string);
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
      const data = await apiClient.getPetImages(params.id as string);
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
      const data = await apiClient.getNotifications(50, 0);
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
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-orange-50 p-8">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/dashboard/pets"
          className="text-pink-500 hover:text-pink-600 mb-4 inline-block"
        >
          ← Back to Pets
        </Link>

        <div className="bg-white rounded-lg shadow-md p-8">
          {/* Header with Name and Status Badges */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="text-4xl font-bold">{pet.name}</h1>
                {isOwner && unreadCount > 0 && (
                  <span className="px-3 py-1 bg-blue-500 text-white text-sm rounded-full font-medium shadow-sm">
                    {unreadCount} new
                  </span>
                )}
                {pet.isLost && (
                  <span className="px-4 py-2 bg-red-500 text-white rounded-full font-medium shadow-sm">
                    Lost
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 text-gray-600">
                <span className="capitalize">{pet.type}</span>
                {pet.breed && <span>• {pet.breed}</span>}
                {pet.color && <span>• {pet.color}</span>}
              </div>
            </div>
          </div>

          {/* Profile Image Section - 400x400 Square */}
          {images.length > 0 && (
            <div className="mb-8 flex justify-center">
              <div className="relative">
                <ResponsiveImage
                  src={images[0].url}
                  alt={pet.name}
                  aspectRatio="square"
                  containerClassName="w-full max-w-[400px] aspect-square border-4 border-pink-200 shadow-lg rounded-lg"
                  className="rounded-lg"
                  showModal={true}
                />
              </div>
            </div>
          )}

          {/* Image Gallery Section */}
          <div className="mb-8">
            <PetImageGallery
              petId={pet.id}
              images={images}
              isOwner={isOwner}
              onDelete={loadImages}
            />
            {isOwner && (
              <div className="mt-4">
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

          {/* QR Code Section */}
          <div className="mb-6">
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-700 text-lg">QR Code</h3>
                <button
                  onClick={() => setShowQR(!showQR)}
                  className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors text-sm"
                >
                  {showQR ? 'Hide' : 'Show'} QR Code
                </button>
              </div>
              {showQR && pet.qrCodeUrl && (
                <div className="flex flex-col items-center gap-4">
                  <div className="p-4 bg-white rounded-lg shadow-sm">
                    <QRCodeSVG value={pet.qrCodeUrl} size={256} data-qr-code={pet.id} />
                  </div>
                  <button
                    onClick={async () => {
                      try {
                        await downloadQRCodeAsPNG(
                          pet.qrCodeUrl,
                          `${pet.name}-qr-code.png`,
                          512
                        );
                      } catch (error) {
                        console.error('Failed to download QR code:', error);
                        alert('Failed to download QR code. Please try again.');
                      }
                    }}
                    className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    📥 Download QR Code as PNG
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Pet Details Section - Below QR Code */}
          <div className="mb-6">
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="font-semibold text-gray-700 mb-4 text-lg">Pet Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="font-medium text-gray-700">Type:</span>
                  <span className="ml-2 capitalize text-gray-600">{pet.type}</span>
                </div>
                {pet.breed && (
                  <div>
                    <span className="font-medium text-gray-700">Breed:</span>
                    <span className="ml-2 text-gray-600">{pet.breed}</span>
                  </div>
                )}
                {pet.color && (
                  <div>
                    <span className="font-medium text-gray-700">Color:</span>
                    <span className="ml-2 text-gray-600">{pet.color}</span>
                  </div>
                )}
                <div>
                  <span className="font-medium text-gray-700">Gender:</span>
                  <span className="ml-2 capitalize text-gray-600">{pet.gender}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Neutered:</span>
                  <span className="ml-2 text-gray-600">{pet.neutered ? 'Yes' : 'No'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Description Section - Separate Div */}
          {pet.description && (
            <div className="mb-6">
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-semibold text-gray-700 mb-4 text-lg">Description</h3>
                <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{pet.description}</p>
              </div>
            </div>
          )}

          <div className="flex gap-4">
            <button
              onClick={toggleLostStatus}
              className={`px-6 py-3 rounded-lg transition-colors flex items-center justify-center ${
                pet.isLost
                  ? 'bg-green-500 text-white hover:bg-green-600'
                  : 'bg-yellow-500 text-white hover:bg-yellow-600'
              }`}
            >
              {pet.isLost ? 'Mark as Found' : 'Mark as Lost'}
            </button>
            <Link
              href={`/dashboard/pets/${pet.id}/edit`}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center"
            >
              Edit
            </Link>
            <button
              onClick={handleDelete}
              className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center"
            >
              Delete
            </button>
          </div>

          {/* Notifications Section - Only show for owner */}
          {isOwner && (
            <div className="mt-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4">
                <h3 className="text-xl font-semibold">
                  Notifications {unreadCount > 0 && <span className="ml-2 px-2 py-1 bg-red-500 text-white text-xs rounded-full">{unreadCount} New</span>}
                </h3>
                <button
                  onClick={loadNotifications}
                  disabled={loadingNotifications}
                  className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 transition-colors w-full sm:w-auto"
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
                <div className="space-y-3 sm:space-y-4">
                  {notifications.map((notif) => {
                    // Debug: Log notification payload
                    console.log('Notification payload:', notif.payload);
                    console.log('Image URL:', notif.payload?.imageUrl);
                    
                    return (
                    <div
                      key={notif.id}
                      className={`p-3 sm:p-4 rounded-lg border ${
                        notif.read
                          ? 'bg-gray-50 border-gray-200'
                          : 'bg-blue-50 border-blue-200 border-l-4'
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
                                  {/* GPS Coordinates */}
                                  <div className="p-3 bg-gray-50 rounded-lg">
                                    <p className="font-medium text-gray-900 mb-2">📍 Location</p>
                                    <div className="space-y-2">
                                      <p>
                                        <span className="font-medium">Coordinates:</span>{' '}
                                        <a
                                          href={`https://www.google.com/maps?q=${notif.payload.foundLocation.lat},${notif.payload.foundLocation.lng}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-pink-500 hover:underline font-mono"
                                        >
                                          {typeof notif.payload.foundLocation.lat === 'number'
                                            ? notif.payload.foundLocation.lat.toFixed(6)
                                            : parseFloat(String(notif.payload.foundLocation.lat)).toFixed(6)}
                                          ,{' '}
                                          {typeof notif.payload.foundLocation.lng === 'number'
                                            ? notif.payload.foundLocation.lng.toFixed(6)
                                            : parseFloat(String(notif.payload.foundLocation.lng)).toFixed(6)}
                                        </a>
                                        {' '}
                                        <span className="text-gray-500 text-xs">(Click to open map)</span>
                                      </p>
                                      {notif.payload.foundLocation.geohash && (
                                        <p>
                                          <span className="font-medium">Geohash:</span>{' '}
                                          <span className="font-mono text-gray-600">{notif.payload.foundLocation.geohash}</span>
                                          <span className="text-gray-500 text-xs ml-2">(~150m accuracy)</span>
                                        </p>
                                      )}
                                      {notif.payload.address && (
                                        <p>
                                          <span className="font-medium">Address:</span>{' '}
                                          <span className="text-gray-800">{notif.payload.address}</span>
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
            <div className="mt-8">
              <h3 className="text-xl font-semibold mb-4">Location History</h3>
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
  );
}

