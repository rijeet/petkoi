'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await apiClient.adminLogin(email.trim(), password);
      // stash otpToken in sessionStorage and go to verify
      sessionStorage.setItem('admin_otp_token', res.otpToken);
      sessionStorage.setItem('admin_email', email.trim());
      router.push('/admin/login/verify');
    } catch (err: any) {
      console.error('Admin login failed', err);
      setError(err?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-800 px-4">
      <div className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/15 rounded-2xl shadow-2xl p-8 text-white">
        <div className="flex items-center justify-center mb-6">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center shadow-lg">
            <span className="text-2xl">🛡️</span>
          </div>
        </div>
        <h1 className="text-3xl font-bold text-center mb-2">Admin Portal</h1>
        <p className="text-center text-purple-100 mb-6">Secure access to Pet Koi admin dashboard</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-purple-100 mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg bg-white/15 border border-white/20 px-3 py-2 text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-300"
              placeholder="admin@yourdomain.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-purple-100 mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg bg-white/15 border border-white/20 px-3 py-2 pr-12 text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-300"
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 right-2 px-2 text-purple-100 hover:text-white text-xs font-semibold"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-200 bg-red-500/20 border border-red-300/30 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-semibold shadow-lg disabled:opacity-60 disabled:cursor-not-allowed transition"
          >
            {loading ? 'Sending code...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-xs text-purple-100 mt-4">
          Remember: admins only. OTP will be sent to your email.
        </p>
      </div>
    </div>
  );
}

