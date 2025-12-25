'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

interface Message {
  id: string;
  content: string;
  senderType: string;
  isRead: boolean;
  createdAt: string;
}

interface SupportTicket {
  id: string;
  ticketNo: string;
  subject: string;
  status: string;
  priority: string;
  createdAt: string;
  messages: Message[];
  assignedAdmin?: {
    email: string;
  };
}

export default function TicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/signin');
      return;
    }
    if (isAuthenticated) {
      loadTicket();
    }
  }, [params.id, isAuthenticated, authLoading, router]);

  const loadTicket = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      if (token) {
        apiClient.setToken(token);
      }
      const data = await apiClient.getSupportTicket(params.id as string) as SupportTicket;
      setTicket(data);
    } catch (error: any) {
      console.error('Failed to load ticket:', error);
      setError('Failed to load ticket');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setError('');
    setSending(true);

    try {
      const token = localStorage.getItem('auth_token');
      if (token) {
        apiClient.setToken(token);
      }
      await apiClient.sendSupportTicketMessage(params.id as string, message);
      setMessage('');
      loadTicket();
      // Mark as read
      try {
        await apiClient.markSupportTicketAsRead(params.id as string);
      } catch (e) {
        // Ignore read marking errors
      }
    } catch (error: any) {
      setError(error.message || 'Failed to send message');
    } finally {
      setSending(false);
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

  if (!ticket) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-cyan-300 text-xl mb-4">Ticket not found</p>
          <Link
            href="/dashboard/support"
            className="text-pink-400 hover:text-pink-300 underline"
          >
            Back to Support Tickets
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-purple-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/dashboard/support"
          className="text-sm sm:text-base text-cyan-300 hover:text-cyan-200 mb-6 inline-block font-medium"
        >
          ← Back to Support Tickets
        </Link>

        {/* Ticket Header */}
        <div className="bg-gradient-to-r from-purple-800/50 to-pink-800/50 backdrop-blur-sm rounded-2xl p-6 sm:p-8 border border-pink-500/30 shadow-xl mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-cyan-200 mb-3">{ticket.subject}</h1>
              <p className="text-cyan-300/70 text-sm">Ticket #{ticket.ticketNo}</p>
            </div>
            <div className="flex flex-col gap-2 items-end">
              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(ticket.status)}`}>
                {ticket.status.replace('_', ' ')}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(ticket.priority)}`}>
                {ticket.priority}
              </span>
            </div>
          </div>
          {ticket.assignedAdmin && (
            <p className="text-cyan-300/70 text-sm">
              Assigned to: {ticket.assignedAdmin.email}
            </p>
          )}
        </div>

        {/* Messages */}
        <div className="bg-gradient-to-r from-purple-800/50 to-pink-800/50 backdrop-blur-sm rounded-2xl p-6 sm:p-8 border border-pink-500/30 shadow-xl mb-6">
          <h2 className="text-xl font-bold mb-6 text-cyan-300">Messages</h2>
          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
              {error}
            </div>
          )}
          <div className="space-y-4 mb-6">
            {ticket.messages && ticket.messages.length > 0 ? (
              ticket.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-4 rounded-xl ${
                    msg.senderType === 'USER'
                      ? 'bg-cyan-500/20 border border-cyan-500/30'
                      : 'bg-pink-500/20 border border-pink-500/30'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className={`text-xs font-semibold ${
                      msg.senderType === 'USER' ? 'text-cyan-300' : 'text-pink-300'
                    }`}>
                      {msg.senderType === 'USER' ? 'You' : 'Admin'}
                    </span>
                    <span className="text-cyan-300/50 text-xs">
                      {new Date(msg.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-cyan-100 whitespace-pre-wrap">{msg.content}</p>
                </div>
              ))
            ) : (
              <p className="text-cyan-300/70 text-center py-8">No messages yet</p>
            )}
          </div>

          {/* Send Message Form */}
          {ticket.status !== 'CLOSED' && (
            <form onSubmit={handleSendMessage} className="space-y-4">
              <div>
                <label className="block text-cyan-200 mb-2 font-medium">Your Message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-4 py-2 bg-purple-900/50 border border-pink-500/30 rounded-lg text-cyan-100 focus:outline-none focus:ring-2 focus:ring-pink-400"
                  placeholder="Type your message..."
                  rows={4}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={sending || !message.trim()}
                className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-pink-500 text-white rounded-lg hover:from-cyan-600 hover:to-pink-600 transition-all duration-300 shadow-[0_0_15px_rgba(236,72,153,0.6)] hover:shadow-[0_0_20px_rgba(236,72,153,0.8)] font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? 'Sending...' : '📤 Send Message'}
              </button>
            </form>
          )}
          {ticket.status === 'CLOSED' && (
            <div className="p-4 bg-gray-500/20 border border-gray-500/30 rounded-lg text-center">
              <p className="text-cyan-300">This ticket is closed. Please create a new ticket for further assistance.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

