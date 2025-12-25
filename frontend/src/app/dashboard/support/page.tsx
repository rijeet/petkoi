'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import Link from 'next/link';

interface SupportTicket {
  id: string;
  ticketNo: string;
  subject: string;
  status: string;
  priority: string;
  createdAt: string;
  messages: Array<{
    id: string;
    content: string;
    senderType: string;
    createdAt: string;
  }>;
}

export default function SupportPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
    priority: 'MEDIUM',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/signin');
      return;
    }
    if (isAuthenticated) {
      loadTickets();
    }
  }, [isAuthenticated, authLoading, router]);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      if (token) {
        apiClient.setToken(token);
      }
      const data = await apiClient.getSupportTickets() as SupportTicket[];
      setTickets(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('Failed to load tickets:', error);
      setError('Failed to load support tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const token = localStorage.getItem('auth_token');
      if (token) {
        apiClient.setToken(token);
      }
      await apiClient.createSupportTicket(formData);
      setSuccess('Support ticket created successfully!');
      setFormData({
        subject: '',
        message: '',
        priority: 'MEDIUM',
      });
      setShowCreateForm(false);
      loadTickets();
    } catch (error: any) {
      setError(error.message || 'Failed to create ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/50';
      case 'IN_PROGRESS':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50';
      case 'RESOLVED':
        return 'bg-green-500/20 text-green-300 border-green-500/50';
      case 'CLOSED':
        return 'bg-gray-500/20 text-gray-300 border-gray-500/50';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/50';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-red-500/20 text-red-300 border-red-500/50';
      case 'HIGH':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/50';
      case 'MEDIUM':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50';
      case 'LOW':
        return 'bg-green-500/20 text-green-300 border-green-500/50';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/50';
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-purple-900 flex items-center justify-center">
        <div className="text-cyan-300 text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-purple-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-cyan-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
            🎫 Support Tickets
          </h1>
          <p className="text-cyan-200 text-lg">
            Get help with your questions and issues
          </p>
        </div>

        {/* Create Ticket Button */}
        <div className="mb-6 flex justify-end">
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-pink-500 text-white rounded-lg hover:from-cyan-600 hover:to-pink-600 transition-all duration-300 shadow-[0_0_15px_rgba(236,72,153,0.6)] hover:shadow-[0_0_20px_rgba(236,72,153,0.8)] font-medium text-lg"
          >
            {showCreateForm ? 'Cancel' : '+ Create New Ticket'}
          </button>
        </div>

        {/* Create Ticket Form */}
        {showCreateForm && (
          <div className="bg-gradient-to-r from-purple-800/50 to-pink-800/50 backdrop-blur-sm rounded-2xl p-6 sm:p-8 border border-pink-500/30 shadow-xl mb-8">
            <h2 className="text-2xl font-bold mb-6 text-cyan-300">Create Support Ticket</h2>

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
                <label className="block text-cyan-200 mb-2 font-medium">Subject *</label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-4 py-2 bg-purple-900/50 border border-pink-500/30 rounded-lg text-cyan-100 focus:outline-none focus:ring-2 focus:ring-pink-400"
                  placeholder="Brief description of your issue"
                  required
                />
              </div>

              <div>
                <label className="block text-cyan-200 mb-2 font-medium">Message *</label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-4 py-2 bg-purple-900/50 border border-pink-500/30 rounded-lg text-cyan-100 focus:outline-none focus:ring-2 focus:ring-pink-400"
                  placeholder="Describe your issue in detail..."
                  rows={5}
                  required
                />
              </div>

              <div>
                <label className="block text-cyan-200 mb-2 font-medium">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-4 py-2 bg-purple-900/50 border border-pink-500/30 rounded-lg text-cyan-100 focus:outline-none focus:ring-2 focus:ring-pink-400"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full px-6 py-3 bg-gradient-to-r from-cyan-500 to-pink-500 text-white rounded-lg hover:from-cyan-600 hover:to-pink-600 transition-all duration-300 shadow-[0_0_15px_rgba(236,72,153,0.6)] hover:shadow-[0_0_20px_rgba(236,72,153,0.8)] font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Creating...' : '🎫 Create Ticket'}
              </button>
            </form>
          </div>
        )}

        {/* Tickets List */}
        {tickets.length === 0 ? (
          <div className="bg-gradient-to-r from-purple-800/50 to-pink-800/50 backdrop-blur-sm rounded-2xl p-12 border border-pink-500/30 shadow-xl text-center">
            <div className="text-6xl mb-4">🎫</div>
            <p className="text-cyan-200 text-lg mb-2">No support tickets yet</p>
            <p className="text-cyan-300/70 text-sm">Create a ticket to get help with any questions or issues</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tickets.map((ticket) => (
              <Link
                key={ticket.id}
                href={`/dashboard/support/${ticket.id}`}
                className="block bg-gradient-to-r from-purple-800/50 to-pink-800/50 backdrop-blur-sm rounded-2xl p-6 border border-pink-500/30 shadow-xl hover:shadow-2xl transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-cyan-200">{ticket.subject}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(ticket.status)}`}>
                        {ticket.status.replace('_', ' ')}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                    </div>
                    <p className="text-cyan-300/70 text-sm">Ticket #{ticket.ticketNo}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-cyan-300/70 text-sm">
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </p>
                    {ticket.messages && ticket.messages.length > 0 && (
                      <p className="text-cyan-300/50 text-xs mt-1">
                        {ticket.messages.length} message{ticket.messages.length !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                </div>
                {ticket.messages && ticket.messages.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-pink-500/20">
                    <p className="text-cyan-200 text-sm line-clamp-2">
                      {ticket.messages[0].content}
                    </p>
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

