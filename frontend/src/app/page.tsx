'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

export default function Home() {
  const { isAuthenticated } = useAuth();

  return (
    <main className="min-h-screen bg-gradient-to-br from-pink-50 to-orange-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        {/* Hero Section */}
        <div className="text-center mb-8 sm:mb-12 lg:mb-16">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight">
            Pet Koi
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-700 mb-6 sm:mb-8 max-w-2xl mx-auto px-4 leading-relaxed">
            Track and manage your pet's identity, health records, and location using QR codes, GPS tracking, and community features.
          </p>
          {isAuthenticated ? (
            <Link
              href="/dashboard/pets"
              className="inline-block px-6 sm:px-8 py-3 sm:py-4 bg-pink-500 text-white rounded-lg text-base sm:text-lg font-semibold hover:bg-pink-600 transition-colors shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Go to Dashboard
            </Link>
          ) : (
            <Link
              href="/auth/signin"
              className="inline-block px-6 sm:px-8 py-3 sm:py-4 bg-pink-500 text-white rounded-lg text-base sm:text-lg font-semibold hover:bg-pink-600 transition-colors shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Get Started
            </Link>
          )}
        </div>

        {/* Features Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-8 sm:mb-12 lg:mb-16">
          <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-4 sm:p-6">
            <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">🐾</div>
            <h3 className="text-lg sm:text-xl font-semibold mb-2 text-gray-900">Pet Profiles</h3>
            <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
              Create detailed profiles for your pets with photos, breed information, and health records.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-4 sm:p-6">
            <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">📱</div>
            <h3 className="text-lg sm:text-xl font-semibold mb-2 text-gray-900">QR Code Identity</h3>
            <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
              Generate unique QR codes for each pet. Anyone can scan to view public profile and contact information if lost.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-4 sm:p-6">
            <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">📍</div>
            <h3 className="text-lg sm:text-xl font-semibold mb-2 text-gray-900">GPS Tracking</h3>
            <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
              Track your pet's location history and get notified when lost pets are found nearby.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-4 sm:p-6">
            <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">🚨</div>
            <h3 className="text-lg sm:text-xl font-semibold mb-2 text-gray-900">Lost Pet Alerts</h3>
            <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
              Instantly broadcast alerts when your pet goes missing. Community members nearby will be notified.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-4 sm:p-6">
            <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">💉</div>
            <h3 className="text-lg sm:text-xl font-semibold mb-2 text-gray-900">Vaccine Records</h3>
            <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
              Keep track of vaccination history with automatic reminders for upcoming vaccinations.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-4 sm:p-6">
            <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">👥</div>
            <h3 className="text-lg sm:text-xl font-semibold mb-2 text-gray-900">Community</h3>
            <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
              Connect with other pet owners, share stories, and help reunite lost pets with their families.
            </p>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 lg:p-8 mb-8 sm:mb-12 lg:mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-6 sm:mb-8 text-gray-900">How It Works</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-pink-500 text-white rounded-full flex items-center justify-center text-lg sm:text-xl font-bold mx-auto mb-3 sm:mb-4">
                1
              </div>
              <h4 className="text-sm sm:text-base font-semibold mb-1 sm:mb-2 text-gray-900">Create Profile</h4>
              <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">Sign in and create a profile for your pet</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-pink-500 text-white rounded-full flex items-center justify-center text-lg sm:text-xl font-bold mx-auto mb-3 sm:mb-4">
                2
              </div>
              <h4 className="text-sm sm:text-base font-semibold mb-1 sm:mb-2 text-gray-900">Get QR Code</h4>
              <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">Receive a unique QR code for your pet</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-pink-500 text-white rounded-full flex items-center justify-center text-lg sm:text-xl font-bold mx-auto mb-3 sm:mb-4">
                3
              </div>
              <h4 className="text-sm sm:text-base font-semibold mb-1 sm:mb-2 text-gray-900">Attach Tag</h4>
              <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">Print and attach the QR code to your pet's collar</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-pink-500 text-white rounded-full flex items-center justify-center text-lg sm:text-xl font-bold mx-auto mb-3 sm:mb-4">
                4
              </div>
              <h4 className="text-sm sm:text-base font-semibold mb-1 sm:mb-2 text-gray-900">Stay Protected</h4>
              <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">If lost, anyone can scan to contact you</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        {!isAuthenticated && (
          <div className="text-center bg-pink-500 text-white rounded-lg p-6 sm:p-8 lg:p-12">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">Ready to Get Started?</h2>
            <p className="text-base sm:text-lg lg:text-xl mb-6 sm:mb-8 opacity-90 leading-relaxed px-4">
              Join thousands of pet owners protecting their furry friends
            </p>
            <Link
              href="/auth/signin"
              className="inline-block px-6 sm:px-8 py-3 sm:py-4 bg-white text-pink-500 rounded-lg text-base sm:text-lg font-semibold hover:bg-gray-100 transition-colors shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Sign In with Google
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}


