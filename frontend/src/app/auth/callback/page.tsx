'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';

export default function AuthCallback() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      // Store token in localStorage
      localStorage.setItem('auth_token', token);
      apiClient.setToken(token);
      
      // Small delay to ensure token is set
      setTimeout(() => {
        // Validate token by fetching user info
        apiClient.getCurrentUser()
          .then((user) => {
            console.log('Token validated successfully, user:', user);
            // Token is valid, redirect to dashboard
            router.push('/dashboard/pets');
          })
          .catch((err) => {
            console.error('Token validation failed:', err);
            console.error('Error details:', {
              message: err.message,
              stack: err.stack,
            });
            setError(`Failed to validate authentication: ${err.message || 'Unknown error'}. Please try again.`);
            // Redirect to sign in after a delay
            setTimeout(() => {
              router.push('/auth/signin');
            }, 5000);
          });
      }, 100);
    } else {
      setError('No authentication token received. Please try again.');
      setTimeout(() => {
        router.push('/auth/signin');
      }, 3000);
    }
  }, [searchParams, router]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4 text-red-600">Authentication Error</h2>
          <p className="text-gray-600">{error}</p>
          <p className="text-sm text-gray-500 mt-2">Redirecting to sign in...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mb-4"></div>
        <h2 className="text-2xl font-bold mb-4">Completing sign in...</h2>
        <p className="text-gray-600">Please wait while we redirect you.</p>
      </div>
    </div>
  );
}

