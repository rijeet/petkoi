'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';

interface Donation {
  id: string;
  method: string;
  amountBDT: number;
  trxId: string;
  status: string;
  createdAt: string;
}

export default function DonationsPage() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loadingDonations, setLoadingDonations] = useState(true);
  const [formData, setFormData] = useState({
    method: 'BKASH',
    amountBDT: '',
    trxId: '',
    agentAccount: '',
    contactNumber: '',
    note: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/auth/signin');
      return;
    }

    if (isAuthenticated) {
      fetchDonations();
    }
  }, [isAuthenticated, loading, router]);

  const fetchDonations = async () => {
    try {
      setLoadingDonations(true);
      const data = await apiClient.getDonations() as Donation[];
      setDonations(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('Failed to fetch donations:', error);
      setError('Failed to load donations');
    } finally {
      setLoadingDonations(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Validate required fields
    if (!formData.agentAccount || formData.agentAccount.trim() === '') {
      setError('Agent Account is required');
      return;
    }
    
    setSubmitting(true);

    try {
      await apiClient.createDonation({
        ...formData,
        amountBDT: parseInt(formData.amountBDT),
      });

      setSuccess('Donation submitted successfully! It will be verified by our team.');
      setFormData({
        method: 'BKASH',
        amountBDT: '',
        trxId: '',
        agentAccount: '',
        contactNumber: '',
        note: '',
      });
      fetchDonations();
    } catch (error: any) {
      setError(error.message || 'Failed to submit donation');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || loadingDonations) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-purple-900 flex items-center justify-center">
        <div className="text-cyan-300 text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-purple-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-cyan-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
            💝 Support Pet Koi
          </h1>
          <p className="text-cyan-200 text-lg">
            Your contribution helps us keep the platform running and help more lost pets
          </p>
        </div>

        {/* Donation Image and Form Side by Side */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Donation Image - Left Side */}
          <div className="bg-gradient-to-r from-purple-800/50 to-pink-800/50 backdrop-blur-sm rounded-2xl p-6 sm:p-8 border border-pink-500/30 shadow-xl flex items-center justify-center">
            <img
              src="https://ik.imagekit.io/3q7x0peae/Pet%20Public%20Img/donation.png?updatedAt=1765031751558"
              alt="Donation Payment Methods"
              className="max-w-full h-auto rounded-xl shadow-lg"
              style={{ maxHeight: '500px' }}
            />
          </div>

          {/* Make a Donation Form - Right Side */}
          <div className="bg-gradient-to-r from-purple-800/50 to-pink-800/50 backdrop-blur-sm rounded-2xl p-6 sm:p-8 border border-pink-500/30 shadow-xl">
            <h2 className="text-2xl font-bold mb-6 text-cyan-300">Make a Donation</h2>

            {error && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 bg-green-500/20 border border-green-500/50 rounded-lg text-green-200 text-sm">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-cyan-200 mb-2 font-medium">Payment Method</label>
                <select
                  value={formData.method}
                  onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                  className="w-full px-4 py-2 bg-purple-900/50 border border-pink-500/30 rounded-lg text-cyan-100 focus:outline-none focus:ring-2 focus:ring-pink-400"
                  required
                >
                  <option value="BKASH">bKash</option>
                  <option value="NAGAD">Nagad</option>
                  <option value="ROCKET">Rocket</option>
                  <option value="BANK">Bank</option>
                  <option value="PAYPAL">PayPal</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-cyan-200 mb-2 font-medium">Amount (BDT)</label>
                <input
                  type="number"
                  min="1"
                  value={formData.amountBDT}
                  onChange={(e) => setFormData({ ...formData, amountBDT: e.target.value })}
                  className="w-full px-4 py-2 bg-purple-900/50 border border-pink-500/30 rounded-lg text-cyan-100 focus:outline-none focus:ring-2 focus:ring-pink-400"
                  placeholder="Enter amount"
                  required
                />
              </div>

              <div>
                <label className="block text-cyan-200 mb-2 font-medium">Transaction ID</label>
                <input
                  type="text"
                  value={formData.trxId}
                  onChange={(e) => setFormData({ ...formData, trxId: e.target.value })}
                  className="w-full px-4 py-2 bg-purple-900/50 border border-pink-500/30 rounded-lg text-cyan-100 focus:outline-none focus:ring-2 focus:ring-pink-400"
                  placeholder="Enter transaction ID"
                  required
                />
              </div>

              <div>
                <label className="block text-cyan-200 mb-2 font-medium">
                  Agent Account <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.agentAccount}
                  onChange={(e) => setFormData({ ...formData, agentAccount: e.target.value })}
                  className="w-full px-4 py-2 bg-purple-900/50 border border-pink-500/30 rounded-lg text-cyan-100 focus:outline-none focus:ring-2 focus:ring-pink-400"
                  placeholder="Agent account number"
                  required
                />
              </div>

              <div>
                <label className="block text-cyan-200 mb-2 font-medium">Contact Number (Optional)</label>
                <input
                  type="text"
                  value={formData.contactNumber}
                  onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                  className="w-full px-4 py-2 bg-purple-900/50 border border-pink-500/30 rounded-lg text-cyan-100 focus:outline-none focus:ring-2 focus:ring-pink-400"
                  placeholder="Your contact number"
                />
              </div>

              <div>
                <label className="block text-cyan-200 mb-2 font-medium">Note (Optional)</label>
                <textarea
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  className="w-full px-4 py-2 bg-purple-900/50 border border-pink-500/30 rounded-lg text-cyan-100 focus:outline-none focus:ring-2 focus:ring-pink-400"
                  placeholder="Any additional message..."
                  rows={3}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full px-6 py-3 bg-gradient-to-r from-cyan-500 to-pink-500 text-white rounded-lg hover:from-cyan-600 hover:to-pink-600 transition-all duration-300 shadow-[0_0_15px_rgba(236,72,153,0.6)] hover:shadow-[0_0_20px_rgba(236,72,153,0.8)] font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Submitting...' : '💝 Submit Donation'}
              </button>
            </form>
          </div>
        </div>

        {/* My Donations Section - Full Width Below */}
        <div className="bg-gradient-to-r from-purple-800/50 to-pink-800/50 backdrop-blur-sm rounded-2xl p-6 sm:p-8 border border-pink-500/30 shadow-xl">
          <h2 className="text-2xl font-bold mb-6 text-cyan-300">My Donations</h2>

          {donations.length === 0 ? (
            <div className="text-center py-12 text-cyan-200">
              <div className="text-5xl mb-4">📝</div>
              <p>No donations yet</p>
              <p className="text-sm text-cyan-300/70 mt-2">Your donation history will appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {donations.map((donation) => (
                <div
                  key={donation.id}
                  className="bg-purple-900/30 border border-pink-500/20 rounded-lg p-4"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-cyan-200 font-semibold">{donation.method}</p>
                      <p className="text-pink-300 text-lg font-bold">{donation.amountBDT} BDT</p>
                    </div>
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
                  <p className="text-cyan-300/70 text-sm">Transaction: {donation.trxId}</p>
                  <p className="text-cyan-300/50 text-xs mt-2">
                    {new Date(donation.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

