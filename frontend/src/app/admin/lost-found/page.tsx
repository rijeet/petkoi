'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';

interface LostPet {
  id: string;
  name: string;
  breed?: string | null;
  color?: string | null;
  type?: string | null;
  updatedAt?: string;
  owner?: { email?: string; name?: string; phone?: string; homeAddress?: string; district?: string; city?: string };
}

export default function AdminLostFoundPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);
  const [pets, setPets] = useState<LostPet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('admin_access_token');
    if (!token) {
      router.push('/admin/login');
      return;
    }
    apiClient.setToken(token);
    setAuthorized(true);
    setChecking(false);
    loadPets();
  }, [router]);

  if (checking || !authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-800 text-white">
        <p className="text-sm text-white/80">Checking admin access…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-800 text-white px-6 py-10">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-white/70">Admin Console</p>
            <h1 className="text-2xl font-semibold">Lost &amp; Found</h1>
            <p className="text-white/80 text-sm">Manage lost pet reports and reunification workflows.</p>
          </div>
          <Link
            href="/admin"
            className="px-4 py-2 rounded-full bg-white text-purple-800 font-semibold shadow hover:shadow-lg transition"
          >
            Back to Admin
          </Link>
        </div>

        <div className="rounded-2xl bg-white/10 border border-white/10 backdrop-blur p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Lost Pets</h2>
            <button
              onClick={loadPets}
              className="px-3 py-1.5 rounded-full bg-white text-purple-800 text-sm font-semibold shadow hover:shadow-lg transition"
            >
              Refresh
            </button>
          </div>
          {loading ? (
            <p className="text-sm text-white/80">Loading lost pets...</p>
          ) : error ? (
            <p className="text-sm text-red-200">{error}</p>
          ) : (
            <div className="space-y-3">
              {pets.map((p) => (
                <div key={p.id} className="rounded-xl border border-white/10 bg-white/5 backdrop-blur p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-white">{p.name || 'Unnamed pet'}</p>
                      <p className="text-sm text-white/70">
                        {p.breed || p.type || 'Pet'} • {p.color || 'Unknown color'}
                      </p>
                      {p.updatedAt && (
                        <p className="text-xs text-white/60">Updated {new Date(p.updatedAt).toLocaleString()}</p>
                      )}
                    </div>
                    <div className="text-right text-sm text-white/80">
                      <p className="font-semibold">Owner</p>
                      <p>{p.owner?.name || 'Unknown'}</p>
                      <p>{p.owner?.email || '—'}</p>
                      <p>{p.owner?.phone || '—'}</p>
                      <p className="text-white/60 text-xs">
                        {p.owner?.city || ''} {p.owner?.district || ''}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-white/70 mt-2">{p.owner?.homeAddress || 'No address provided'}</p>
                </div>
              ))}
              {pets.length === 0 && <p className="text-sm text-white/70">No lost pets reported.</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  async function loadPets() {
    try {
      setLoading(true);
      setError(null);
      const data = (await apiClient.adminListLostPets()) as LostPet[];
      setPets(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load lost pets');
    } finally {
      setLoading(false);
    }
  }
}

