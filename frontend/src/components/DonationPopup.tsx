'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

export default function DonationPopup() {
  const { isAuthenticated, user } = useAuth();
  const [showPopup, setShowPopup] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setShowPopup(false);
      return;
    }

    // Check if popup was shown today
    const lastShownDate = localStorage.getItem('donation_popup_last_shown');
    const today = new Date().toDateString();

    // Show popup if:
    // 1. Never shown before, OR
    // 2. Last shown on a different day (show after every login, once per day)
    if (!lastShownDate || lastShownDate !== today) {
      // Small delay to ensure smooth animation
      const timer = setTimeout(() => {
        setShowPopup(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
    // Explicitly return undefined for the else case
    return;
  }, [isAuthenticated, user]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setShowPopup(false);
      setIsClosing(false);
      // Mark as shown today
      localStorage.setItem('donation_popup_last_shown', new Date().toDateString());
    }, 300);
  };

  const handleDonate = () => {
    handleClose();
    // Navigation will happen via Link
  };

  if (!showPopup) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
        isClosing ? 'opacity-0' : 'opacity-100'
      }`}
      onClick={handleClose}
    >
      <div
        className={`relative bg-gradient-to-br from-purple-900 via-pink-900 to-purple-900 rounded-2xl shadow-2xl border-2 border-pink-500/50 max-w-md w-full p-6 sm:p-8 transform transition-all duration-300 ${
          isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-cyan-300 hover:text-white transition-colors p-1 rounded-full hover:bg-pink-500/20"
          aria-label="Close donation popup"
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

        {/* Content */}
        <div className="text-center">
          {/* Donation Image */}
          <div className="mb-4 flex justify-center">
            <img
              src="https://ik.imagekit.io/3q7x0peae/Pet%20Public%20Img/donation.png?updatedAt=1765031751558"
              alt="Donation"
              className="max-w-full h-auto rounded-xl shadow-lg"
              style={{ maxHeight: '200px' }}
            />
          </div>

          {/* Title */}
          <h2 className="text-2xl sm:text-3xl font-bold mb-3 bg-gradient-to-r from-cyan-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
            Support Pet Koi
          </h2>

          {/* Message */}
          <p className="text-cyan-100 mb-2 text-base sm:text-lg leading-relaxed">
            Help us keep this platform running and help more lost pets find their way home.
          </p>
          <p className="text-pink-300 mb-6 text-sm sm:text-base font-semibold">
            Your contribution makes a difference! 🙏
          </p>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/dashboard/donations"
              onClick={handleDonate}
              className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-pink-500 text-white rounded-lg hover:from-cyan-600 hover:to-pink-600 transition-all duration-300 shadow-[0_0_15px_rgba(236,72,153,0.6)] hover:shadow-[0_0_20px_rgba(236,72,153,0.8)] font-medium text-base sm:text-lg"
            >
              💰 Donate Now
            </Link>
            <button
              onClick={handleClose}
              className="px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all duration-300 font-medium text-base sm:text-lg"
            >
              Maybe Later
            </button>
          </div>

          {/* Small text */}
          <p className="text-xs text-cyan-300/70 mt-4">
            You can also donate anytime from the navigation menu
          </p>
        </div>
      </div>
    </div>
  );
}

