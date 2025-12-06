'use client';

import { useEffect, useState } from 'react';

interface GalleryImage {
  id: string;
  url: string;
  alt?: string;
}

interface GalleryLightboxProps {
  images: GalleryImage[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function GalleryLightbox({
  images,
  initialIndex = 0,
  isOpen,
  onClose,
}: GalleryLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex, isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      if (e.key === 'ArrowLeft') {
        handlePrevious();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex]);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  if (!isOpen || images.length === 0) return null;

  const currentImage = images[currentIndex];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-95 p-4"
      onClick={onClose}
    >
      <div className="relative max-w-7xl max-h-full w-full h-full flex items-center justify-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 text-white hover:text-gray-300 transition-colors bg-black bg-opacity-60 rounded-full p-3 shadow-lg hover:bg-opacity-80"
          aria-label="Close gallery"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Previous Button */}
        {images.length > 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePrevious();
            }}
            className="absolute left-4 z-20 text-white hover:text-gray-300 transition-colors bg-black bg-opacity-60 rounded-full p-3 shadow-lg hover:bg-opacity-80"
            aria-label="Previous image"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
        )}

        {/* Next Button */}
        {images.length > 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            className="absolute right-4 z-20 text-white hover:text-gray-300 transition-colors bg-black bg-opacity-60 rounded-full p-3 shadow-lg hover:bg-opacity-80"
            aria-label="Next image"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        )}

        {/* Main Image */}
        <img
          src={currentImage.url}
          alt={currentImage.alt || `Gallery image ${currentIndex + 1}`}
          className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
          onClick={(e) => e.stopPropagation()}
          loading="eager"
        />

        {/* Image Counter */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20 bg-black bg-opacity-60 text-white px-4 py-2 rounded-full text-sm font-medium">
            {currentIndex + 1} / {images.length}
          </div>
        )}

        {/* Thumbnail Strip */}
        {images.length > 1 && (
          <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-20 flex gap-2 max-w-full overflow-x-auto px-4 pb-2">
            {images.map((image, index) => (
              <button
                key={image.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(index);
                }}
                className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                  index === currentIndex
                    ? 'border-white shadow-lg scale-110'
                    : 'border-transparent opacity-60 hover:opacity-100 hover:scale-105'
                }`}
                aria-label={`Go to image ${index + 1}`}
              >
                <img
                  src={image.url}
                  alt={image.alt || `Thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

