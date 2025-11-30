'use client';

import { useState, useRef } from 'react';
import { apiClient } from '@/lib/api';

interface PetImageUploadProps {
  petId: string;
  onUploadSuccess?: () => void;
  maxImages?: number;
  currentImageCount?: number;
}

export default function PetImageUpload({
  petId,
  onUploadSuccess,
  maxImages = 5,
  currentImageCount = 0,
}: PetImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (6MB)
    if (file.size > 6 * 1024 * 1024) {
      setError('File size must be less than 6MB');
      return;
    }

    // Check image limit
    if (currentImageCount >= maxImages) {
      setError(`Maximum ${maxImages} images allowed per pet`);
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const token = localStorage.getItem('auth_token');
      if (token) {
        apiClient.setToken(token);
      }

      await apiClient.uploadPetImage(petId, file);
      onUploadSuccess?.();

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: unknown) {
      let errorMessage = 'Failed to upload image';
      
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'object' && err !== null && 'message' in err) {
        errorMessage = String(err.message);
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      
      // Extract error message from ImageKit errors
      if (errorMessage.includes('ImageKit')) {
        const match = errorMessage.match(/ImageKit upload failed: (.+)/);
        if (match) {
          errorMessage = match[1];
        }
      }
      
      setError(errorMessage);
      console.error('Image upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const remainingSlots = maxImages - currentImageCount;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-4">
        <label
          htmlFor="image-upload"
          className={`px-4 py-2 rounded-lg cursor-pointer transition-colors ${
            uploading || remainingSlots === 0
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-pink-500 text-white hover:bg-pink-600'
          }`}
        >
          {uploading ? 'Uploading...' : 'Upload Image'}
        </label>
        <input
          id="image-upload"
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          disabled={uploading || remainingSlots === 0}
          className="hidden"
        />
        {remainingSlots > 0 && (
          <span className="text-sm text-gray-600">
            {remainingSlots} slot{remainingSlots !== 1 ? 's' : ''} remaining
          </span>
        )}
        {remainingSlots === 0 && (
          <span className="text-sm text-red-600">Maximum images reached</span>
        )}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

