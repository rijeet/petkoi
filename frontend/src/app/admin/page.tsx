'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api';

type AdminRole = 'SUPER_ADMIN' | 'ORDER_TRACKER' | 'LOST_PET' | 'ADOPTION' | 'HEALTH';

const roleBadges: Record<AdminRole, { label: string; color: string }> = {
  SUPER_ADMIN: { label: 'Super Admin', color: 'from-purple-500 to-indigo-500' },
  ORDER_TRACKER: { label: 'Order Tracker', color: 'from-blue-500 to-cyan-500' },
  LOST_PET: { label: 'Lost Pet', color: 'from-amber-500 to-orange-500' },
  ADOPTION: { label: 'Adoption', color: 'from-emerald-500 to-teal-500' },
  HEALTH: { label: 'Health', color: 'from-rose-500 to-pink-500' },
};

const roleSections: Array<{ role: AdminRole; title: string; description: string }> = [
  { role: 'SUPER_ADMIN', title: 'System Administration', description: 'Manage all admin roles, settings, and security.' },
  { role: 'ORDER_TRACKER', title: 'Order Tracking', description: 'Monitor and update pet tag and accessory orders.' },
  { role: 'LOST_PET', title: 'Lost & Found', description: 'Handle lost pet reports and reunification workflows.' },
  { role: 'ADOPTION', title: 'Adoption & Found Pets', description: 'Oversee adoption requests and found pet intake.' },
  { role: 'HEALTH', title: 'Health & Wellness', description: 'Track health issues, vaccination follow-ups, and alerts.' },
];

export default function AdminHome() {
  const router = useRouter();
  const [role, setRole] = useState<AdminRole | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('admin_access_token');
    const storedRole = localStorage.getItem('admin_role') as AdminRole | null;
    if (!token || !storedRole) {
      router.replace('/admin/login');
      return;
    }
    setRole(storedRole);
  }, [router]);

  const handleLogout = async () => {
    try {
      await apiClient.adminLogout();
    } finally {
      localStorage.removeItem('admin_access_token');
      localStorage.removeItem('admin_role');
      sessionStorage.removeItem('admin_otp_token');
      sessionStorage.removeItem('admin_email');
      router.push('/admin/login');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 text-white px-4 py-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm text-purple-100">
              <span className="h-8 w-8 rounded-2xl bg-white/15 flex items-center justify-center">🛡️</span>
              <span className="font-semibold">Admin Portal</span>
            </div>
            <h1 className="text-3xl font-bold mt-2">Welcome to Pet Koi Admin</h1>
            <p className="text-purple-100 mt-1">Secure access for authorized administrators only.</p>
          </div>
          <div className="flex items-center gap-3">
            {role && (
              <span
                className={`px-4 py-2 rounded-full bg-gradient-to-r ${roleBadges[role]?.color} text-sm font-semibold shadow-lg`}
              >
                {roleBadges[role]?.label || role}
              </span>
            )}
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-full border border-white/30 bg-white/10 hover:bg-white/15 text-sm font-semibold"
            >
              Logout
            </button>
          </div>
        </header>

        <div className="grid gap-4">
          {roleSections
            .filter((section) => role === 'SUPER_ADMIN' || section.role === role)
            .map((section) => (
              <div
                key={section.role}
                className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-lg p-5 shadow-xl"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r ${roleBadges[section.role].color}`}>
                      {roleBadges[section.role].label}
                    </div>
                    <h3 className="text-xl font-semibold">{section.title}</h3>
                    <p className="text-purple-100 text-sm">{section.description}</p>
                  </div>
                  <Link
                    href="#"
                    className="text-sm font-semibold text-white bg-white/10 hover:bg-white/15 border border-white/10 rounded-full px-3 py-2"
                  >
                    Open
                  </Link>
                </div>
              </div>
            ))}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-lg p-5 shadow-xl">
          <h3 className="text-lg font-semibold mb-2">Session & Security</h3>
          <p className="text-purple-100 text-sm">
            You are signed in with an admin session. Refresh tokens are stored in a secure, HTTP-only cookie.
            Use Logout to revoke this session.
          </p>
        </div>
      </div>
    </div>
  );
}

