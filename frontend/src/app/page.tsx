'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

export default function Home() {
  const { isAuthenticated } = useAuth();

  return (
    <main className="min-h-screen bg-gradient-to-br from-pink-50 to-orange-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Pet Identity Platform
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Track and manage your pet's identity, health records, and location using QR codes, GPS tracking, and community features.
          </p>
          {isAuthenticated ? (
            <Link
              href="/dashboard/pets"
              className="inline-block px-8 py-4 bg-pink-500 text-white rounded-lg text-lg font-semibold hover:bg-pink-600 transition-colors shadow-lg"
            >
              Go to Dashboard
            </Link>
          ) : (
            <Link
              href="/auth/signin"
              className="inline-block px-8 py-4 bg-pink-500 text-white rounded-lg text-lg font-semibold hover:bg-pink-600 transition-colors shadow-lg"
            >
              Get Started
            </Link>
          )}
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-4xl mb-4">🐾</div>
            <h3 className="text-xl font-semibold mb-2">Pet Profiles</h3>
            <p className="text-gray-600">
              Create detailed profiles for your pets with photos, breed information, and health records.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-4xl mb-4">📱</div>
            <h3 className="text-xl font-semibold mb-2">QR Code Identity</h3>
            <p className="text-gray-600">
              Generate unique QR codes for each pet. Anyone can scan to view public profile and contact information if lost.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-4xl mb-4">📍</div>
            <h3 className="text-xl font-semibold mb-2">GPS Tracking</h3>
            <p className="text-gray-600">
              Track your pet's location history and get notified when lost pets are found nearby.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-4xl mb-4">🚨</div>
            <h3 className="text-xl font-semibold mb-2">Lost Pet Alerts</h3>
            <p className="text-gray-600">
              Instantly broadcast alerts when your pet goes missing. Community members nearby will be notified.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-4xl mb-4">💉</div>
            <h3 className="text-xl font-semibold mb-2">Vaccine Records</h3>
            <p className="text-gray-600">
              Keep track of vaccination history with automatic reminders for upcoming vaccinations.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-4xl mb-4">👥</div>
            <h3 className="text-xl font-semibold mb-2">Community</h3>
            <p className="text-gray-600">
              Connect with other pet owners, share stories, and help reunite lost pets with their families.
            </p>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-pink-500 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                1
              </div>
              <h4 className="font-semibold mb-2">Create Profile</h4>
              <p className="text-sm text-gray-600">Sign in and create a profile for your pet</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-pink-500 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                2
              </div>
              <h4 className="font-semibold mb-2">Get QR Code</h4>
              <p className="text-sm text-gray-600">Receive a unique QR code for your pet</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-pink-500 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                3
              </div>
              <h4 className="font-semibold mb-2">Attach Tag</h4>
              <p className="text-sm text-gray-600">Print and attach the QR code to your pet's collar</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-pink-500 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                4
              </div>
              <h4 className="font-semibold mb-2">Stay Protected</h4>
              <p className="text-sm text-gray-600">If lost, anyone can scan to contact you</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        {!isAuthenticated && (
          <div className="text-center bg-pink-500 text-white rounded-lg p-12">
            <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-xl mb-8 opacity-90">
              Join thousands of pet owners protecting their furry friends
            </p>
            <Link
              href="/auth/signin"
              className="inline-block px-8 py-4 bg-white text-pink-500 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors shadow-lg"
            >
              Sign In with Google
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}


