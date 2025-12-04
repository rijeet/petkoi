'use client';

import { useState } from 'react';
import ImageModal from './ImageModal';
import { transformImageKitUrl } from '@/lib/imagekit';

interface ResponsiveImageProps {
  src: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  showModal?: boolean;
  aspectRatio?: 'square' | 'landscape' | 'portrait' | 'auto';
}

export default function ResponsiveImage({
  src,
  alt,
  className = '',
  containerClassName = '',
  showModal = true,
  aspectRatio = 'auto',
}: ResponsiveImageProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imageError, setImageError] = useState(false);

  const aspectRatioClasses = {
    square: 'aspect-square',
    landscape: 'aspect-video',
    portrait: 'aspect-[3/4]',
    auto: '',
  };

  // Transform ImageKit URL for consistent sizing
  const getTransformedUrl = () => {
    if (aspectRatio === 'square') {
      // Check for different sizes based on container class
      let size = 400; // Default size
      if (containerClassName?.includes('max-w-[500px]')) {
        size = 500; // Pet listing images
      } else if (containerClassName?.includes('max-w-[400px]')) {
        size = 400; // Profile images
      }
      
      return transformImageKitUrl(src, {
        width: size,
        height: size,
        aspectRatio: 'square',
        crop: 'at_max', // Fit entire image within dimensions without cropping
        quality: 85,
        format: 'auto',
      });
    } else if (aspectRatio === 'landscape') {
      return transformImageKitUrl(src, {
        width: 800,
        aspectRatio: 'landscape',
        crop: 'maintain_ratio',
        quality: 85,
        format: 'auto',
      });
    } else if (aspectRatio === 'portrait') {
      return transformImageKitUrl(src, {
        height: 600,
        aspectRatio: 'portrait',
        crop: 'maintain_ratio',
        quality: 85,
        format: 'auto',
      });
    }
    return src; // Return original if auto
  };

  const transformedSrc = getTransformedUrl();

  const handleImageClick = () => {
    if (showModal && !imageError) {
      setIsModalOpen(true);
    }
  };

  return (
    <>
      <div
        className={`relative overflow-hidden rounded-lg ${containerClassName} ${aspectRatioClasses[aspectRatio]}`}
      >
        <img
          src={transformedSrc}
          alt={alt}
          className={`w-full h-full ${aspectRatio === 'square' ? 'object-contain' : 'object-cover'} cursor-pointer transition-transform hover:scale-105 ${className}`}
          onClick={handleImageClick}
          onError={() => setImageError(true)}
          loading="lazy"
        />
        {showModal && !imageError && (
          <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-all flex items-center justify-center">
            <div className="opacity-0 hover:opacity-100 transition-opacity">
              <svg
                className="w-8 h-8 text-white"
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
        )}
        {imageError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="text-center p-4">
              <p className="text-gray-500 text-sm">Failed to load image</p>
              <a
                href={src}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 text-xs underline mt-2 block"
              >
                Open in new tab
              </a>
            </div>
          </div>
        )}
      </div>
      {showModal && (
        <ImageModal
          imageUrl={src}
          alt={alt}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
}

