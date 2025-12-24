'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function Navigation() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="bg-gradient-to-r from-purple-900 via-pink-900 to-purple-900 shadow-2xl border-b-2 border-pink-500/50 relative overflow-hidden">
      {/* Animated background glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-pink-500/10 to-purple-500/10 animate-pulse"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-8">
            <Link 
              href="/" 
              className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-pink-400 to-purple-400 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(236,72,153,0.5)] hover:drop-shadow-[0_0_20px_rgba(236,72,153,0.8)] transition-all duration-300"
            >
              Pet Koi
            </Link>
            {isAuthenticated && (
              <>
                {/* Desktop Navigation Links */}
                <div className="hidden lg:flex items-center gap-3">
                  <Link
                    href="/dashboard/pets"
                    className={`px-4 py-2 rounded-lg transition-all duration-300 font-medium ${
                      isActive('/dashboard/pets')
                        ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-[0_0_15px_rgba(236,72,153,0.6)] scale-105'
                        : 'text-cyan-300 hover:text-white hover:bg-pink-500/20 hover:shadow-[0_0_10px_rgba(236,72,153,0.4)]'
                    }`}
                  >
                    My Pets
                  </Link>
                  <Link
                    href="/dashboard/orders"
                    className={`px-4 py-2 rounded-lg transition-all duration-300 font-medium ${
                      isActive('/dashboard/orders')
                        ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-[0_0_15px_rgba(236,72,153,0.6)] scale-105'
                        : 'text-cyan-300 hover:text-white hover:bg-pink-500/20 hover:shadow-[0_0_10px_rgba(236,72,153,0.4)]'
                    }`}
                  >
                    My Orders
                  </Link>
                  <Link
                    href="/dashboard/profile"
                    className={`px-4 py-2 rounded-lg transition-all duration-300 font-medium ${
                      isActive('/dashboard/profile')
                        ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-[0_0_15px_rgba(236,72,153,0.6)] scale-105'
                        : 'text-cyan-300 hover:text-white hover:bg-pink-500/20 hover:shadow-[0_0_10px_rgba(236,72,153,0.4)]'
                    }`}
                  >
                    Profile
                  </Link>
                </div>

                {/* Mobile/Tablet Hamburger Menu Button */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="lg:hidden p-2 rounded-lg text-cyan-300 hover:text-white hover:bg-pink-500/20 transition-all duration-300"
                  aria-label="Toggle menu"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    {mobileMenuOpen ? (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    ) : (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6h16M4 12h16M4 18h16"
                      />
                    )}
                  </svg>
                </button>
              </>
            )}
          </div>

          <div className="flex items-center gap-4">
            {loading ? (
              <span className="text-cyan-300 animate-pulse">Loading...</span>
            ) : isAuthenticated && user ? (
              <>
                <Link
                  href="/dashboard/profile"
                  className="hidden sm:flex items-center gap-3 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500/20 to-pink-500/20 border border-cyan-400/30 hover:border-cyan-400/50 transition-all duration-300"
                >
                  {user.profilePicture ? (
                    <img
                      src={user.profilePicture}
                      alt={user.name || 'Profile'}
                      className="w-8 h-8 rounded-full border-2 border-cyan-400 object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full border-2 border-cyan-400 bg-gradient-to-br from-pink-400 to-purple-400 flex items-center justify-center text-white text-sm font-bold">
                      {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                    </div>
                  )}
                  <span className="text-sm font-medium text-cyan-200">
                    {user.name || user.email?.split('@')[0] || 'User'}
                  </span>
                </Link>
                <button
                  onClick={logout}
                  className="px-4 py-2 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-lg hover:from-red-600 hover:to-pink-700 transition-all duration-300 shadow-[0_0_10px_rgba(239,68,68,0.5)] hover:shadow-[0_0_15px_rgba(239,68,68,0.8)] font-medium"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <Link
                href="/auth/signin"
                className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-pink-500 text-white rounded-lg hover:from-cyan-600 hover:to-pink-600 transition-all duration-300 shadow-[0_0_15px_rgba(236,72,153,0.6)] hover:shadow-[0_0_20px_rgba(236,72,153,0.8)] font-medium"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>

        {/* Mobile/Tablet Menu Dropdown */}
        {isAuthenticated && mobileMenuOpen && (
          <div className="lg:hidden border-t border-pink-500/30 py-4 animate-in slide-in-from-top duration-300">
            <div className="flex flex-col gap-2">
              <Link
                href="/dashboard/pets"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-3 rounded-lg transition-all duration-300 font-medium ${
                  isActive('/dashboard/pets')
                    ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-[0_0_15px_rgba(236,72,153,0.6)]'
                    : 'text-cyan-300 hover:text-white hover:bg-pink-500/20 hover:shadow-[0_0_10px_rgba(236,72,153,0.4)]'
                }`}
              >
                My Pets
              </Link>
              <Link
                href="/dashboard/profile"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-3 rounded-lg transition-all duration-300 font-medium ${
                  isActive('/dashboard/profile')
                    ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-[0_0_15px_rgba(236,72,153,0.6)]'
                    : 'text-cyan-300 hover:text-white hover:bg-pink-500/20 hover:shadow-[0_0_10px_rgba(236,72,153,0.4)]'
                }`}
              >
                Profile
              </Link>
              <Link
                href="/dashboard/orders"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-3 rounded-lg transition-all duration-300 font-medium ${
                  isActive('/dashboard/orders')
                    ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-[0_0_15px_rgba(236,72,153,0.6)]'
                    : 'text-cyan-300 hover:text-white hover:bg-pink-500/20 hover:shadow-[0_0_10px_rgba(236,72,153,0.4)]'
                }`}
              >
                My Orders
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

