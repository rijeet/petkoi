'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api';
import ResponsiveImage from './ResponsiveImage';
import GalleryLightbox from './GalleryLightbox';

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
  const [deleting, setDeleting] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

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

  // Limit to max 5 images for display
  const displayImages = images.slice(0, 5);
  const allImages = images; // Use all images for lightbox

  const handleImageClick = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  return (
    <>
      <div className="space-y-4">
        {displayImages.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-sm">No images uploaded yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
            {displayImages.map((image, index) => (
              <div
                key={image.id}
                className="relative group aspect-[4/5] cursor-pointer"
                onClick={() => handleImageClick(index)}
              >
                <div className="w-full h-full rounded-xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-105">
                  <ResponsiveImage
                    src={image.url}
                    alt={`Pet image ${image.id}`}
                    aspectRatio="4:5"
                    objectFit="cover"
                    containerClassName="w-full h-full"
                    className="rounded-xl"
                    showModal={false}
                  />
                </div>
                {isOwner && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(image.id);
                    }}
                    disabled={deleting === image.id}
                    className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-lg text-xs opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600 disabled:opacity-50 z-10 shadow-lg backdrop-blur-sm"
                    aria-label="Delete image"
                  >
                    {deleting === image.id ? '...' : '×'}
                  </button>
                )}
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300 rounded-xl flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                    />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Gallery Lightbox */}
      {allImages.length > 0 && (
        <GalleryLightbox
          images={allImages.map((img) => ({
            id: img.id,
            url: img.url,
            alt: `Pet image ${img.id}`,
          }))}
          initialIndex={lightboxIndex}
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </>
  );
}

