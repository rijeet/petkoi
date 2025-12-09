'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';

export default function AdminVerifyPage() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [otpToken, setOtpToken] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const handleCodeChange = (value: string) => {
    const sanitized = value.replace(/\D/g, '').slice(0, 6);
    setCode(sanitized);
  };

  useEffect(() => {
    const storedToken = sessionStorage.getItem('admin_otp_token');
    const storedEmail = sessionStorage.getItem('admin_email');
    setOtpToken(storedToken);
    setEmail(storedEmail);
    if (!storedToken) {
      router.replace('/admin/login');
    }
  }, [router]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpToken) {
      setError('OTP token missing. Please login again.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await apiClient.adminVerify(otpToken, code.trim());
      // store admin access token
      localStorage.setItem('admin_access_token', res.accessToken);
      localStorage.setItem('admin_role', res.role);
      sessionStorage.removeItem('admin_otp_token');
      router.push('/admin');
    } catch (err: any) {
      console.error('Admin OTP verify failed', err);
      setError(err?.message || err?.statusText || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!otpToken) {
      setError('OTP token missing. Please login again.');
      router.replace('/admin/login');
      return;
    }
    setError(null);
    setResending(true);
    try {
      await apiClient.adminResendOtp(otpToken);
    } catch (err: any) {
      console.error('Admin OTP resend failed', err);
      setError(err?.message || err?.statusText || 'Failed to resend code');
    } finally {
      setResending(false);
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
        <h1 className="text-3xl font-bold text-center mb-2">Email Verification</h1>
        <p className="text-center text-purple-100 mb-6">
          Enter the 6-digit code sent to {email || 'your email'} to complete admin sign-in.
        </p>

        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-purple-100 mb-1">Verification Code</label>
            <div className="grid grid-cols-6 gap-2">
              {[0, 1, 2, 3, 4, 5].map((idx) => (
                <input
                  key={idx}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={code[idx] ?? ''}
                  ref={(el) => {
                    inputsRef.current[idx] = el;
                  }}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 1);
                    const next = code.split('');
                    next[idx] = val;
                    const newCode = next.join('').slice(0, 6);
                    handleCodeChange(newCode);
                    if (val && idx < 5) {
                      inputsRef.current[idx + 1]?.focus();
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Backspace' && !code[idx] && idx > 0) {
                      inputsRef.current[idx - 1]?.focus();
                    }
                  }}
                  onPaste={(e) => {
                    e.preventDefault();
                    const pasted = e.clipboardData.getData('text');
                    const sanitized = pasted.replace(/\D/g, '').slice(0, 6);
                    handleCodeChange(sanitized);
                    // focus next empty box after paste
                    const nextIdx = Math.min(sanitized.length, 5);
                    setTimeout(() => {
                      inputsRef.current[nextIdx]?.focus();
                    }, 0);
                  }}
                  className="rounded-lg bg-white/15 border border-white/20 px-0 py-3 text-white text-center text-lg placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-300"
                  placeholder="0"
                  required={idx === 0}
                />
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-red-200 bg-red-500/20 border border-red-300/30 rounded-lg px-3 py-2">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-semibold shadow-lg disabled:opacity-60 disabled:cursor-not-allowed transition"
          >
            {loading ? 'Verifying...' : 'Verify & Sign In'}
          </button>
        </form>

        <div className="flex justify-between text-sm text-purple-100 mt-4">
          <button
            className="underline hover:text-white"
            onClick={() => {
              sessionStorage.removeItem('admin_otp_token');
              router.push('/admin/login');
            }}
          >
            Back to Login
          </button>
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="underline hover:text-white disabled:opacity-60"
          >
            {resending ? 'Resending...' : 'Resend code'}
          </button>
        </div>
      </div>
    </div>
  );
}

