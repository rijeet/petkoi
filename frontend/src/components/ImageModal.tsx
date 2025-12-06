'use client';

import { useEffect } from 'react';

interface ImageModalProps {
  imageUrl: string;
  alt: string;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Get full resolution URL by removing ImageKit transformations
 */
function getFullResolutionUrl(url: string): string {
  if (!url || !url.includes('imagekit.io')) {
    return url;
  }
  
  try {
    const urlObj = new URL(url);
    // Remove transformation parameters to get original full resolution
    urlObj.searchParams.delete('tr');
    return urlObj.toString();
  } catch {
    return url;
  }
}

export default function ImageModal({ imageUrl, alt, isOpen, onClose }: ImageModalProps) {
  const fullResUrl = getFullResolutionUrl(imageUrl);
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

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 p-4"
      onClick={onClose}
    >
      <div className="relative max-w-7xl max-h-full w-full h-full flex items-center justify-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 text-white hover:text-gray-300 transition-colors bg-black bg-opacity-50 rounded-full p-2"
          aria-label="Close"
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
        <img
          src={fullResUrl}
          alt={alt}
          className="max-w-full max-h-full object-contain rounded-lg"
          onClick={(e) => e.stopPropagation()}
          loading="eager"
        />
      </div>
    </div>
  );
}

