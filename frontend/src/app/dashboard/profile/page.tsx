'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api';
import Loading from '@/components/Loading';

interface UserProfile {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  profilePicture?: string;
  role: string;
  latitude?: number;
  longitude?: number;
  address?: string;
}

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    profilePicture: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/signin');
      return;
    }

    if (user) {
      loadProfile();
    }
  }, [user, authLoading, router]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      if (token) {
        apiClient.setToken(token);
      }
      const userData = await apiClient.getCurrentUser();
      setProfile(userData);
      setFormData({
        name: userData.name || '',
        phone: userData.phone || '',
        profilePicture: userData.profilePicture || '',
      });
    } catch (error: unknown) {
      console.error('Failed to load profile:', error);
      setError('Failed to load profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profile) return;

    try {
      setSaving(true);
      setError(null);
      const token = localStorage.getItem('auth_token');
      if (token) {
        apiClient.setToken(token);
      }
      await apiClient.updateUser(profile.id, formData);
      await loadProfile(); // Reload to get updated data
      setEditing(false);
    } catch (error: unknown) {
      console.error('Failed to update profile:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update profile';
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        phone: profile.phone || '',
        profilePicture: profile.profilePicture || '',
      });
    }
    setEditing(false);
    setError(null);
  };

  const handleDeleteAccount = async () => {
    if (!profile) return;

    if (deleteConfirmText.toLowerCase() !== 'delete') {
      setError('Please type "delete" to confirm account deletion');
      return;
    }

    if (!confirm('Are you absolutely sure? This action cannot be undone. All your pets, notifications, and data will be permanently deleted.')) {
      return;
    }

    try {
      setDeleting(true);
      setError(null);
      const token = localStorage.getItem('auth_token');
      if (token) {
        apiClient.setToken(token);
      }
      await apiClient.deleteUser(profile.id);
      // Clear local storage and redirect
      localStorage.removeItem('auth_token');
      apiClient.setToken(null);
      router.push('/auth/signin');
    } catch (error: unknown) {
      console.error('Failed to delete account:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete account';
      setError(errorMessage);
      setDeleting(false);
    }
  };

  if (authLoading || loading) {
    return <Loading />;
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-orange-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-600">Failed to load profile</p>
            {error && <p className="text-red-600 mt-2">{error}</p>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-orange-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-4xl font-bold">My Profile</h1>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center"
              >
                Edit Profile
              </button>
            )}
          </div>

          {/* Profile Picture Section */}
          <div className="mb-6 flex flex-col items-center">
            <div className="relative mb-4">
              {profile.profilePicture ? (
                <img
                  src={profile.profilePicture}
                  alt={profile.name || 'Profile'}
                  className="w-32 h-32 rounded-full border-4 border-pink-200 shadow-lg object-cover"
                />
              ) : (
                <div className="w-32 h-32 rounded-full border-4 border-pink-200 shadow-lg bg-gradient-to-br from-pink-400 to-purple-400 flex items-center justify-center text-white text-4xl font-bold">
                  {profile.name?.[0]?.toUpperCase() || profile.email[0]?.toUpperCase() || 'U'}
                </div>
              )}
            </div>
            {editing && (
              <div className="w-full max-w-md">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Profile Picture URL
                </label>
                <input
                  type="url"
                  value={formData.profilePicture}
                  onChange={(e) => setFormData({ ...formData, profilePicture: e.target.value })}
                  placeholder="Enter image URL"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-pink-500 focus:border-pink-500"
                />
                <p className="text-xs text-gray-500 mt-1">Enter a URL to your profile picture</p>
              </div>
            )}
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          <div className="space-y-6">
            {/* Email - Read Only */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={profile.email}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name
              </label>
              {editing ? (
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter your name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-pink-500 focus:border-pink-500"
                />
              ) : (
                <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50">
                  {profile.name || <span className="text-gray-400">Not set</span>}
                </div>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              {editing ? (
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Enter your phone number"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-pink-500 focus:border-pink-500"
                />
              ) : (
                <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50">
                  {profile.phone || <span className="text-gray-400">Not set</span>}
                </div>
              )}
            </div>

            {/* Role - Read Only */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role
              </label>
              <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50">
                <span className="capitalize">{profile.role.toLowerCase()}</span>
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50">
                {profile.address ? (
                  <div>
                    <p className="text-gray-800">{profile.address}</p>
                    {profile.latitude && profile.longitude && (
                      <p className="text-xs text-gray-500 mt-1">
                        Coordinates: {profile.latitude.toFixed(6)}, {profile.longitude.toFixed(6)}
                      </p>
                    )}
                  </div>
                ) : (
                  <span className="text-gray-400">Not set</span>
                )}
              </div>
              <div className="mt-2">
                <Link
                  href="/dashboard/confirm-location"
                  className="text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  {profile.address ? 'Update Location' : 'Set Location'}
                </Link>
              </div>
            </div>

            {/* Action Buttons */}
            {editing && (
              <div className="flex gap-4 pt-4">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={saving}
                  className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center justify-center disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* Delete Account Section */}
          <div className="mt-8 pt-8 border-t border-red-200">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Danger Zone</h2>
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-red-800 mb-2">Delete Account</h3>
              <p className="text-red-700 mb-4">
                Once you delete your account, there is no going back. All your pets, notifications, and data will be permanently deleted.
              </p>
              
              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  Delete My Account
                </button>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-red-800 mb-2">
                      Type <span className="font-mono font-bold">delete</span> to confirm:
                    </label>
                    <input
                      type="text"
                      value={deleteConfirmText}
                      onChange={(e) => {
                        setDeleteConfirmText(e.target.value);
                        setError(null);
                      }}
                      placeholder="Type 'delete' to confirm"
                      className="w-full px-4 py-2 border-2 border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      autoFocus
                    />
                    {error && deleteConfirmText.toLowerCase() !== 'delete' && (
                      <p className="text-red-600 text-sm mt-1">{error}</p>
                    )}
                  </div>
                  <div className="flex gap-4">
                    <button
                      onClick={handleDeleteAccount}
                      disabled={deleting || deleteConfirmText.toLowerCase() !== 'delete'}
                      className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {deleting ? 'Deleting...' : 'Confirm Delete Account'}
                    </button>
                    <button
                      onClick={() => {
                        setShowDeleteConfirm(false);
                        setDeleteConfirmText('');
                        setError(null);
                      }}
                      disabled={deleting}
                      className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium disabled:opacity-50 flex items-center justify-center"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

