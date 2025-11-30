'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api';

interface PetImage {
  id: string;
  url: string;
  fileId: string;
  createdAt: string;
}

interface PetImageGalleryProps {
  petId: string;
  images: PetImage[];
  isOwner?: boolean;
  onDelete?: () => void;
}

export default function PetImageGallery({
  petId,
  images,
  isOwner = false,
  onDelete,
}: PetImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDelete = async (imageId: string) => {
    if (!confirm('Are you sure you want to delete this image?')) return;

    setDeleting(imageId);
    try {
      const token = localStorage.getItem('auth_token');
      if (token) {
        apiClient.setToken(token);
      }

      await apiClient.deletePetImage(petId, imageId);
      onDelete?.();
    } catch (error: unknown) {
      let errorMessage = 'Failed to delete image';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null && 'message' in error) {
        errorMessage = String(error.message);
      }
      alert(errorMessage);
    } finally {
      setDeleting(null);
    }
  };

  if (images.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No images uploaded yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold">Pet Images</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((image) => (
          <div key={image.id} className="relative group">
            <img
              src={image.url}
              alt={`Pet image ${image.id}`}
              className="w-full h-48 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => setSelectedImage(image.url)}
            />
            {isOwner && (
              <button
                onClick={() => handleDelete(image.id)}
                disabled={deleting === image.id}
                className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 disabled:opacity-50"
              >
                {deleting === image.id ? 'Deleting...' : 'Delete'}
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-full">
            <img
              src={selectedImage}
              alt="Full size"
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 bg-white text-black px-4 py-2 rounded-lg hover:bg-gray-200"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

