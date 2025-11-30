'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function Navigation() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-2xl font-bold text-pink-500">
              Pet Identity
            </Link>
            {isAuthenticated && (
              <div className="flex items-center gap-4">
                <Link
                  href="/dashboard/pets"
                  className={`px-3 py-2 rounded-lg transition-colors ${
                    isActive('/dashboard/pets')
                      ? 'bg-pink-100 text-pink-600 font-medium'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  My Pets
                </Link>
                <Link
                  href="/community"
                  className={`px-3 py-2 rounded-lg transition-colors ${
                    isActive('/community')
                      ? 'bg-pink-100 text-pink-600 font-medium'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Community
                </Link>
                <Link
                  href="/map"
                  className={`px-3 py-2 rounded-lg transition-colors ${
                    isActive('/map')
                      ? 'bg-pink-100 text-pink-600 font-medium'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Map
                </Link>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            {loading ? (
              <span className="text-gray-500">Loading...</span>
            ) : isAuthenticated && user ? (
              <>
                <span className="text-gray-700">
                  {user.name || user.email}
                </span>
                <button
                  onClick={logout}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <Link
                href="/auth/signin"
                className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

