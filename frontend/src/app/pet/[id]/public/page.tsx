'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { apiClient } from '@/lib/api';
import ResponsiveImage from '@/components/ResponsiveImage';

interface Pet {
  id: string;
  name: string;
  type: string;
  breed?: string;
  color?: string;
  gender: string;
  description?: string;
  isLost: boolean;
  images?: Array<{ url: string }>;
  vaccines?: Array<{
    name: string;
    injectionDate: string;
    nextDueDate?: string;
  }>;
  owner?: {
    id: string;
    name?: string;
    email?: string;
    phone?: string;
    homeAddress?: string;
  };
}

export default function PublicPetPage() {
  const params = useParams();
  const [pet, setPet] = useState<Pet | null>(null);
  const [loading, setLoading] = useState(true);
  const [sendingLocation, setSendingLocation] = useState(false);
  const [locationSent, setLocationSent] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [address, setAddress] = useState('');
  const [note, setNote] = useState('');
  const [phone, setPhone] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    loadPet();
  }, [params.id]);

  const loadPet = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getPublicPet(params.id as string) as Pet;
      setPet(data);
    } catch (error: unknown) {
      console.error('Failed to load pet:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load pet';
      alert(`Failed to load pet: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      // Validate file size (6MB)
      if (file.size > 6 * 1024 * 1024) {
        alert('Image size must be less than 6MB');
        return;
      }
      setImageFile(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File): Promise<string | undefined> => {
    if (!pet) return undefined;

    try {
      setUploadingImage(true);
      
      // Upload to ImageKit via backend endpoint
      const formData = new FormData();
      formData.append('image', file);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/pets/${pet.id}/images/found`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(error.message || 'Failed to upload image');
      }

      const data = await response.json();
      return data.url;
    } catch (error: unknown) {
      console.error('Failed to upload image:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload image';
      alert(`Image upload failed: ${errorMessage}. You can still send the location without the image.`);
      return undefined;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSendLocation = async () => {
    if (!pet) return;

    const cleanedAddress = address.trim();
    const cleanedNote = note.trim();
    const cleanedPhone = phone.trim();

    // Require address and Bangladesh phone number
    const bdPhoneRegex = /^(?:\+8801\d{9}|01\d{9})$/;
    if (!cleanedAddress) {
      setLocationError('Location address is required to report a found pet.');
      return;
    }
    if (!bdPhoneRegex.test(cleanedPhone)) {
      setLocationError('Provide a valid Bangladesh phone number (01XXXXXXXXX or +8801XXXXXXXXX).');
      return;
    }

    setSendingLocation(true);
    setLocationError(null);

    try {
      // Request browser geolocation
      if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported by your browser');
      }

      // Upload image first if provided
      let imageUrl: string | undefined;
      if (imageFile) {
        console.log('Uploading image file:', imageFile.name, imageFile.size);
        imageUrl = await uploadImage(imageFile);
        console.log('Image uploaded, URL:', imageUrl);
      } else {
        console.log('No image file provided');
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const reportData = {
              lat: latitude,
              lng: longitude,
              address: cleanedAddress,
              note: cleanedNote || undefined,
              phone: cleanedPhone,
              imageUrl,
            };
            console.log('Sending report with:', reportData);
            console.log('Image URL value:', imageUrl);
            console.log('Image URL type:', typeof imageUrl);
            console.log('Image URL length:', imageUrl?.length);
            
            await apiClient.reportPetFound(
              pet.id,
              latitude,
              longitude,
              cleanedAddress,
              cleanedNote || undefined,
              imageUrl,
              cleanedPhone,
            );
            
            console.log('Report sent successfully');
            setLocationSent(true);
            setLocationError(null);
            // Reset form
            setAddress('');
            setNote('');
            setPhone('');
            setImageFile(null);
            setImagePreview(null);
            // Show success message
            alert('Location sent successfully! The owner has been notified.');
          } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to send location';
            setLocationError(errorMessage);
            console.error('Failed to send location:', error);
          } finally {
            setSendingLocation(false);
          }
        },
        (error) => {
          let errorMessage = 'Failed to get your location';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied. Please enable location permissions.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out.';
              break;
          }
          setLocationError(errorMessage);
          setSendingLocation(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send location';
      setLocationError(errorMessage);
      setSendingLocation(false);
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
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 lg:p-8">
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 text-gray-900">{pet.name}</h1>
            {pet.isLost && (
              <div className="inline-block px-3 sm:px-4 py-2 bg-red-100 text-red-800 rounded-full text-xs sm:text-sm font-medium mb-4">
                ⚠️ This pet is lost. Please contact the owner if found.
              </div>
            )}
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-sm sm:text-base text-gray-700">
              <span className="capitalize">{pet.type}</span>
              {pet.breed && <span>• {pet.breed}</span>}
              {pet.color && <span>• {pet.color}</span>}
            </div>
          </div>

          {pet.images && pet.images.length > 0 && (
            <div className="mb-8 w-full flex justify-center">
              <div className="relative w-full max-w-[400px]">
                <ResponsiveImage
                  src={pet.images[0].url}
                  alt={pet.name}
                  aspectRatio="4:5"
                  objectFit="cover"
                  containerClassName="w-full aspect-[4/5] border-4 border-pink-200 shadow-lg rounded-lg overflow-hidden"
                  className="rounded-lg"
                  showModal={true}
                />
              </div>
            </div>
          )}

          {pet.description && (
            <div className="mb-6 sm:mb-8">
              <h2 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 text-gray-900">About</h2>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed break-words">{pet.description}</p>
            </div>
          )}

          {pet.vaccines && pet.vaccines.length > 0 && (
            <div className="mb-6 sm:mb-8">
              <h2 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 text-gray-900">Vaccination Records</h2>
              <div className="space-y-2">
                {pet.vaccines.map((vaccine, index) => (
                  <div key={index} className="p-3 sm:p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm sm:text-base font-medium text-gray-900 mb-1">{vaccine.name}</div>
                    <div className="text-xs sm:text-sm text-gray-700">
                      Date: {new Date(vaccine.injectionDate).toLocaleDateString()}
                      {vaccine.nextDueDate && (
                        <span className="block sm:inline sm:ml-4 mt-1 sm:mt-0">
                          Next due: {new Date(vaccine.nextDueDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {pet.isLost && (
            <div className="mt-8 space-y-4">
              {/* Owner Contact Info */}
              {pet.owner && (pet.owner.name || pet.owner.email) && (
                <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h3 className="text-xl font-semibold mb-4 text-yellow-800">Contact Owner</h3>
                  <div className="space-y-2">
                    {pet.owner.name && (
                      <p className="text-gray-700">
                        <span className="font-medium">Name:</span> {pet.owner.name}
                      </p>
                    )}
                    {pet.owner.email && (
                      <p className="text-gray-700">
                        <span className="font-medium">Email:</span>{' '}
                        <a
                          href={`mailto:${pet.owner.email}?subject=Found ${pet.name}`}
                          className="text-pink-500 hover:underline font-medium"
                        >
                          {pet.owner.email}
                        </a>
                      </p>
                    )}
                    {pet.owner.phone && (
                      <p className="text-gray-700">
                        <span className="font-medium">Phone:</span>{' '}
                        <a
                          href={`tel:${pet.owner.phone}`}
                          className="text-pink-500 hover:underline font-medium"
                        >
                          {pet.owner.phone}
                        </a>
                      </p>
                    )}
                    {pet.owner.homeAddress && (
                      <p className="text-gray-700">
                        <span className="font-medium">Home Address:</span> {pet.owner.homeAddress}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Send Location Form */}
              <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
                <h3 className="text-xl font-semibold mb-4 text-red-800">Found This Pet?</h3>
                <p className="text-gray-700 mb-4">
                  If you found this pet, please provide your location and any additional information.
                </p>
                {locationSent ? (
                  <div className="p-4 bg-green-100 border border-green-300 rounded-lg">
                    <p className="text-green-800 font-medium">
                      ✓ Location sent successfully! The owner has been notified.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Address Field (required) */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Location Address (required)
                      </label>
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="e.g., 123 Main Street, City, State"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        required
                      />
                    </div>

                    {/* Phone Field (required) */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Your Phone (BD only, required)
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="01XXXXXXXXX or +8801XXXXXXXXX"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        required
                      />
                    </div>

                    {/* Note Field */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Additional Note (optional)
                      </label>
                      <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Any additional information about where you found the pet..."
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      />
                    </div>

                    {/* Image Upload */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Take a Picture (Optional)
                      </label>
                      <div className="space-y-2">
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={handleImageSelect}
                          className="hidden"
                          id="found-pet-image"
                        />
                        <label
                          htmlFor="found-pet-image"
                          className="inline-block px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 cursor-pointer transition-colors"
                        >
                          📷 {imageFile ? 'Change Photo' : 'Take/Select Photo'}
                        </label>
                        {imagePreview && (
                          <div className="mt-2">
                            <img
                              src={imagePreview}
                              alt="Preview"
                              className="max-w-xs rounded-lg border border-gray-300"
                            />
                            <button
                              onClick={() => {
                                setImageFile(null);
                                setImagePreview(null);
                              }}
                              className="mt-2 text-sm text-red-600 hover:underline"
                            >
                              Remove photo
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Send Button */}
                    <button
                      onClick={handleSendLocation}
                      disabled={sendingLocation || uploadingImage}
                      className="w-full px-4 sm:px-6 py-2 sm:py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base font-medium shadow-md hover:shadow-lg"
                    >
                      {sendingLocation || uploadingImage ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                          {uploadingImage ? 'Processing image...' : 'Sending location...'}
                        </span>
                      ) : (
                        '📍 Send My Location'
                      )}
                    </button>
                    {locationError && (
                      <p className="text-sm text-red-600 mt-2">{locationError}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      Your location, address, note, and photo will be shared with the pet owner to help reunite them with their pet.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

