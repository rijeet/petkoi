'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import Link from 'next/link';

interface Donation {
  id: string;
  userId: string;
  method: string;
  amountBDT: number;
  trxId: string;
  agentAccount?: string;
  status: string;
  createdAt: string;
  verifiedBy?: string;
  verifiedAt?: string;
  user?: {
    email: string;
    name?: string;
  };
}

export default function AdminDonationsPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [filter, setFilter] = useState<string>('ALL');
  const [selectedDonation, setSelectedDonation] = useState<Donation | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState<'VERIFIED' | 'REJECTED'>('VERIFIED');
  const [verifyNote, setVerifyNote] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('admin_access_token');
    if (!token) {
      router.push('/admin/login');
      return;
    }
    apiClient.setToken(token);
    setAuthorized(true);
    setChecking(false);
    loadDonations();
    loadStats();
  }, [router, filter]);

  const loadDonations = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('admin_access_token');
      if (token) {
        apiClient.setToken(token);
      }
      const data = await apiClient.adminGetDonations(filter !== 'ALL' ? filter : undefined) as Donation[];
      setDonations(data || []);
    } catch (error: any) {
      console.error('Failed to load donations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const token = localStorage.getItem('admin_access_token');
      if (token) {
        apiClient.setToken(token);
      }
      const data = await apiClient.adminGetDonationStats() as any;
      setStats(data);
    } catch (error: any) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleVerify = async () => {
    if (!selectedDonation) return;

    try {
      setVerifying(true);
      const token = localStorage.getItem('admin_access_token');
      if (token) {
        apiClient.setToken(token);
      }
      await apiClient.adminVerifyDonation(selectedDonation.id, {
        status: verifyStatus,
        note: verifyNote || undefined,
      });
      setSelectedDonation(null);
      setVerifyNote('');
      loadDonations();
      loadStats();
    } catch (error: any) {
      console.error('Failed to verify donation:', error);
      alert(error.message || 'Failed to verify donation');
    } finally {
      setVerifying(false);
    }
  };

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
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <Link href="/admin" className="text-sm text-white/70 hover:text-white mb-2 inline-block">
              ← Back to Control Center
            </Link>
            <h1 className="text-3xl font-bold">Donation Management</h1>
            <p className="text-white/80 mt-1">View, verify, and manage user donations</p>
          </div>
        </header>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-green-400 to-emerald-500 text-white shadow-lg p-4">
              <span className="text-xs uppercase tracking-wide">Total Amount</span>
              <span className="text-2xl font-bold block mt-1">{stats.totalAmount || 0} BDT</span>
            </div>
            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-blue-400 to-indigo-500 text-white shadow-lg p-4">
              <span className="text-xs uppercase tracking-wide">Verified</span>
              <span className="text-2xl font-bold block mt-1">{stats.verifiedAmount || 0} BDT</span>
              <span className="text-xs mt-1">({stats.verifiedCount || 0} donations)</span>
            </div>
            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-yellow-400 to-orange-500 text-white shadow-lg p-4">
              <span className="text-xs uppercase tracking-wide">Pending</span>
              <span className="text-2xl font-bold block mt-1">{stats.pendingAmount || 0} BDT</span>
              <span className="text-xs mt-1">({stats.pendingCount || 0} donations)</span>
            </div>
            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-pink-400 to-rose-500 text-white shadow-lg p-4">
              <span className="text-xs uppercase tracking-wide">Total Donations</span>
              <span className="text-2xl font-bold block mt-1">{stats.totalDonations || 0}</span>
            </div>
          </div>
        )}

        {/* Filter */}
        <div className="flex gap-2">
          {['ALL', 'PENDING', 'VERIFIED', 'REJECTED'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filter === status
                  ? 'bg-white text-purple-800'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Donations List */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-white/70">Loading donations...</p>
          </div>
        ) : donations.length === 0 ? (
          <div className="text-center py-12 bg-white/10 rounded-2xl border border-white/10">
            <p className="text-white/70">No donations found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {donations.map((donation) => (
              <div
                key={donation.id}
                className="bg-white/10 rounded-2xl border border-white/10 p-6 hover:bg-white/15 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-xl font-semibold">{donation.method}</h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          donation.status === 'VERIFIED'
                            ? 'bg-green-500/20 text-green-300 border border-green-500/50'
                            : donation.status === 'REJECTED'
                            ? 'bg-red-500/20 text-red-300 border border-red-500/50'
                            : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/50'
                        }`}
                      >
                        {donation.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-white/70">Amount:</span>
                        <p className="text-white font-semibold">{donation.amountBDT} BDT</p>
                      </div>
                      <div>
                        <span className="text-white/70">Transaction ID:</span>
                        <p className="text-white font-mono">{donation.trxId}</p>
                      </div>
                      {donation.agentAccount && (
                        <div>
                          <span className="text-white/70">Agent Account:</span>
                          <p className="text-white">{donation.agentAccount}</p>
                        </div>
                      )}
                      <div>
                        <span className="text-white/70">User:</span>
                        <p className="text-white">{donation.user?.email || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-white/70">Date:</span>
                        <p className="text-white">{new Date(donation.createdAt).toLocaleDateString()}</p>
                      </div>
                      {donation.verifiedAt && (
                        <div>
                          <span className="text-white/70">Verified At:</span>
                          <p className="text-white">{new Date(donation.verifiedAt).toLocaleDateString()}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  {donation.status === 'PENDING' && (
                    <button
                      onClick={() => setSelectedDonation(donation)}
                      className="ml-4 px-4 py-2 bg-white text-purple-800 rounded-lg font-semibold hover:bg-white/90 transition-all"
                    >
                      Verify
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Verify Modal */}
        {selectedDonation && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-gradient-to-br from-purple-800 to-indigo-900 rounded-2xl border border-white/20 p-6 max-w-md w-full">
              <h2 className="text-2xl font-bold mb-4">Verify Donation</h2>
              <div className="space-y-4 mb-6">
                <div>
                  <p className="text-white/70 text-sm">Amount:</p>
                  <p className="text-white font-semibold text-lg">{selectedDonation.amountBDT} BDT</p>
                </div>
                <div>
                  <p className="text-white/70 text-sm">Transaction ID:</p>
                  <p className="text-white font-mono">{selectedDonation.trxId}</p>
                </div>
                <div>
                  <label className="block text-white/70 text-sm mb-2">Status:</label>
                  <select
                    value={verifyStatus}
                    onChange={(e) => setVerifyStatus(e.target.value as 'VERIFIED' | 'REJECTED')}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                  >
                    <option value="VERIFIED">Verify</option>
                    <option value="REJECTED">Reject</option>
                  </select>
                </div>
                <div>
                  <label className="block text-white/70 text-sm mb-2">Note (Optional):</label>
                  <textarea
                    value={verifyNote}
                    onChange={(e) => setVerifyNote(e.target.value)}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                    rows={3}
                    placeholder="Add a note..."
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleVerify}
                  disabled={verifying}
                  className="flex-1 px-4 py-2 bg-white text-purple-800 rounded-lg font-semibold hover:bg-white/90 transition-all disabled:opacity-50"
                >
                  {verifying ? 'Processing...' : 'Confirm'}
                </button>
                <button
                  onClick={() => {
                    setSelectedDonation(null);
                    setVerifyNote('');
                  }}
                  className="px-4 py-2 bg-white/10 text-white rounded-lg font-semibold hover:bg-white/20 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

