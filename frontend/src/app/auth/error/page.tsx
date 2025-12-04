'use client';

import Link from 'next/link';

export default function AuthErrorPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-pink-50 to-orange-50 px-4 py-8">
      <div className="w-full max-w-md p-6 sm:p-8 bg-white rounded-lg shadow-lg text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-red-600 mb-3 sm:mb-4">Authentication Error</h1>
        <p className="text-sm sm:text-base text-gray-700 mb-6 sm:mb-8 leading-relaxed">
          There was an error signing in. Please try again.
        </p>
        <Link
          href="/auth/signin"
          className="inline-block px-4 sm:px-6 py-2 sm:py-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors text-sm sm:text-base font-medium shadow-md hover:shadow-lg"
        >
          Try Again
        </Link>
      </div>
    </div>
  );
}

