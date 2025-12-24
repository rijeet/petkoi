'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';

interface AdminUser {
  id: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

interface DbTable {
  schema: string;
  name: string;
  type: string;
}

export default function AdminSystemPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tables, setTables] = useState<DbTable[]>([]);
  const [loadingTables, setLoadingTables] = useState(true);
  const [tablesError, setTablesError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('admin_access_token');
    if (!token) {
      router.push('/admin/login');
      return;
    }
    apiClient.setToken(token);
    setAuthorized(true);
    setChecking(false);
    loadUsers();
    loadTables();
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
            <h1 className="text-2xl font-semibold">System Administration</h1>
            <p className="text-white/80 text-sm">
              Roles, settings, and security controls. (Placeholder module)
            </p>
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
            <h2 className="text-lg font-semibold">Admin Users</h2>
            <button
              onClick={loadUsers}
              className="px-3 py-1.5 rounded-full bg-white text-purple-800 text-sm font-semibold shadow hover:shadow-lg transition"
            >
              Refresh
            </button>
          </div>
          {loading ? (
            <p className="text-sm text-white/80">Loading admin users...</p>
          ) : error ? (
            <p className="text-sm text-red-200">{error}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-white/90">
                <thead>
                  <tr className="text-left text-white/70">
                    <th className="py-2 pr-4">Email</th>
                    <th className="py-2 pr-4">Role</th>
                    <th className="py-2 pr-4">Created</th>
                    <th className="py-2 pr-4">Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-t border-white/10">
                      <td className="py-2 pr-4">{u.email}</td>
                      <td className="py-2 pr-4 font-semibold">{u.role}</td>
                      <td className="py-2 pr-4 text-white/70">
                        {new Date(u.createdAt).toLocaleString()}
                      </td>
                      <td className="py-2 pr-4 text-white/70">
                        {new Date(u.updatedAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td className="py-3 text-white/70" colSpan={4}>
                        No admin users found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="rounded-2xl bg-white/10 border border-white/10 backdrop-blur p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Database Tables</h2>
            <button
              onClick={loadTables}
              className="px-3 py-1.5 rounded-full bg-white text-purple-800 text-sm font-semibold shadow hover:shadow-lg transition"
            >
              Refresh
            </button>
          </div>
          {loadingTables ? (
            <p className="text-sm text-white/80">Loading tables...</p>
          ) : tablesError ? (
            <p className="text-sm text-red-200">{tablesError}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-white/90">
                <thead>
                  <tr className="text-left text-white/70">
                    <th className="py-2 pr-4">Schema</th>
                    <th className="py-2 pr-4">Table</th>
                    <th className="py-2 pr-4">Type</th>
                  </tr>
                </thead>
                <tbody>
                  {tables.map((t) => (
                    <tr key={`${t.schema}.${t.name}`} className="border-t border-white/10">
                      <td className="py-2 pr-4 text-white/80">{t.schema}</td>
                      <td className="py-2 pr-4 font-semibold">{t.name}</td>
                      <td className="py-2 pr-4 text-white/70">{t.type}</td>
                    </tr>
                  ))}
                  {tables.length === 0 && (
                    <tr>
                      <td className="py-3 text-white/70" colSpan={3}>
                        No tables found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  async function loadUsers() {
    try {
      setLoading(true);
      setError(null);
      const data = (await apiClient.adminListUsers()) as AdminUser[];
      setUsers(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load admin users');
    } finally {
      setLoading(false);
    }
  }

  async function loadTables() {
    try {
      setLoadingTables(true);
      setTablesError(null);
      const data = (await apiClient.adminListTables()) as DbTable[];
      setTables(data);
    } catch (err: any) {
      setTablesError(err?.message || 'Failed to load tables');
    } finally {
      setLoadingTables(false);
    }
  }
}

