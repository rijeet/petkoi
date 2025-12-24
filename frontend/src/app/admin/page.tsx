'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';

const MODULES = [
  {
    key: 'system',
    title: 'System Administration',
    badge: 'Super Admin',
    description: 'Manage admin roles, settings, security, and platform controls.',
    path: '/admin/system',
  },
  {
    key: 'order-tracking',
    title: 'Order Tracking',
    badge: 'Order Tracker',
    description: 'Monitor and update pet tag and accessory orders.',
    path: '/admin/order-tracking',
  },
  {
    key: 'lost-found',
    title: 'Lost & Found',
    badge: 'Lost Pet',
    description: 'Handle lost pet reports and reunification workflows.',
    path: '/admin/lost-found',
  },
];

export default function AdminIndexPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);
  const [stats, setStats] = useState<{ users: number; pets: number; orders: number; lostPets: number } | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('admin_access_token');
    if (!token) {
      router.push('/admin/login');
      return;
    }
    apiClient.setToken(token);
    setAuthorized(true);
    setChecking(false);
    loadStats();
  }, [router]);

  if (checking || !authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-800 text-white">
        <div className="text-center space-y-2">
          <div className="animate-pulse h-3 w-20 bg-white/30 rounded-full mx-auto" />
          <p className="text-sm text-white/80">Checking admin access…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-800 px-6 py-10 text-white">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="space-y-2">
          <p className="text-sm text-white/70">Admin Console</p>
          <h1 className="text-3xl font-bold">Control Center</h1>
          <p className="text-white/80">
            Access advanced tools for system configuration, order oversight, and lost-pet operations.
          </p>
        </header>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {['Users', 'Pets', 'Orders', 'Lost'].map((label, idx) => {
            const value =
              idx === 0 ? stats?.users : idx === 1 ? stats?.pets : idx === 2 ? stats?.orders : stats?.lostPets;
            const colors = [
              'from-pink-400 to-rose-500',
              'from-indigo-400 to-blue-500',
              'from-emerald-400 to-teal-500',
              'from-amber-400 to-orange-500',
            ];
            return (
              <div
                key={label}
                className={`rounded-2xl border border-white/10 bg-gradient-to-br ${colors[idx]} text-white shadow-lg p-4 flex flex-col gap-1`}
              >
                <span className="text-xs uppercase tracking-wide">{label}</span>
                <span className="text-2xl font-bold">{loadingStats ? '…' : value ?? '—'}</span>
              </div>
            );
          })}
        </div>
        {statsError && <p className="text-sm text-red-200">{statsError}</p>}

        <div className="grid gap-6 md:grid-cols-2">
          {MODULES.map((module) => (
            <div
              key={module.key}
              className="rounded-2xl bg-white/10 border border-white/10 shadow-xl backdrop-blur p-6 flex flex-col justify-between hover:-translate-y-0.5 transition-transform"
            >
              <div className="space-y-3">
                <span className="inline-flex items-center gap-2 text-xs font-semibold bg-white/15 text-white px-3 py-1 rounded-full">
                  {module.badge}
                </span>
                <div className="space-y-1">
                  <h2 className="text-xl font-semibold">{module.title}</h2>
                  <p className="text-white/80 text-sm leading-relaxed">
                    {module.description}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between">
                <div className="text-xs text-white/70">
                  Advanced access • Admin only
                </div>
                <Link
                  href={module.path}
                  className="px-4 py-2 rounded-full bg-white text-purple-800 font-semibold shadow hover:shadow-lg transition"
                >
                  Open
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  async function loadStats() {
    try {
      setLoadingStats(true);
      setStatsError(null);
      const data = (await apiClient.adminStats()) as any;
      setStats({
        users: data?.users ?? 0,
        pets: data?.pets ?? 0,
        orders: data?.orders ?? 0,
        lostPets: data?.lostPets ?? 0,
      });
    } catch (err: any) {
      setStatsError(err?.message || 'Failed to load stats');
    } finally {
      setLoadingStats(false);
    }
  }
}

