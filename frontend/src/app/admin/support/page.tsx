'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import Link from 'next/link';

interface SupportTicket {
  id: string;
  ticketNo: string;
  userId: string;
  subject: string;
  status: string;
  priority: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    email: string;
    name?: string;
  };
  messages: Array<{
    id: string;
    content: string;
    senderType: string;
    createdAt: string;
  }>;
}

export default function AdminSupportPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('ALL');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('admin_access_token');
    if (!token) {
      router.push('/admin/login');
      return;
    }
    apiClient.setToken(token);
    setAuthorized(true);
    setChecking(false);
    loadTickets();
  }, [router, filter]);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('admin_access_token');
      if (token) {
        apiClient.setToken(token);
      }
      const data = await apiClient.adminGetSupportTickets(filter !== 'ALL' ? filter : undefined) as SupportTicket[];
      setTickets(data || []);
    } catch (error: any) {
      console.error('Failed to load tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTicketDetail = async (ticketId: string) => {
    try {
      const token = localStorage.getItem('admin_access_token');
      if (token) {
        apiClient.setToken(token);
      }
      const data = await apiClient.adminGetSupportTicket(ticketId) as SupportTicket;
      setSelectedTicket(data);
    } catch (error: any) {
      console.error('Failed to load ticket:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedTicket || !message.trim()) return;

    try {
      setSending(true);
      const token = localStorage.getItem('admin_access_token');
      if (token) {
        apiClient.setToken(token);
      }
      await apiClient.adminSendTicketMessage(selectedTicket.id, message);
      setMessage('');
      loadTicketDetail(selectedTicket.id);
      loadTickets();
    } catch (error: any) {
      console.error('Failed to send message:', error);
      alert(error.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleUpdateStatus = async (ticketId: string, status: string) => {
    try {
      setUpdatingStatus(true);
      const token = localStorage.getItem('admin_access_token');
      if (token) {
        apiClient.setToken(token);
      }
      await apiClient.adminUpdateTicketStatus(ticketId, status);
      loadTickets();
      if (selectedTicket) {
        loadTicketDetail(ticketId);
      }
    } catch (error: any) {
      console.error('Failed to update status:', error);
      alert(error.message || 'Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAssign = async (ticketId: string) => {
    try {
      const token = localStorage.getItem('admin_access_token');
      if (!token) {
        alert('Admin token not found. Please log in again.');
        router.push('/admin/login');
        return;
      }
      apiClient.setToken(token);
      // Decode JWT to get admin ID (sub claim)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const adminId = payload.sub;
      await apiClient.adminAssignTicket(ticketId, adminId);
      loadTickets();
      if (selectedTicket) {
        loadTicketDetail(ticketId);
      }
    } catch (error: any) {
      console.error('Failed to assign ticket:', error);
      alert(error.message || 'Failed to assign ticket');
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
            <h1 className="text-3xl font-bold">Support Tickets</h1>
            <p className="text-white/80 mt-1">Manage user support tickets and respond to inquiries</p>
          </div>
        </header>

        {/* Filter */}
        <div className="flex gap-2">
          {['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filter === status
                  ? 'bg-white text-purple-800'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              {status.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Tickets List */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-white/70">Loading tickets...</p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-12 bg-white/10 rounded-2xl border border-white/10">
            <p className="text-white/70">No tickets found</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {tickets.map((ticket) => (
              <div
                key={ticket.id}
                className="bg-white/10 rounded-2xl border border-white/10 p-6 hover:bg-white/15 transition-all cursor-pointer"
                onClick={() => loadTicketDetail(ticket.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-xl font-semibold">{ticket.subject}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(ticket.status)}`}>
                        {ticket.status.replace('_', ' ')}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-white/70">Ticket #:</span>
                        <p className="text-white font-mono">{ticket.ticketNo}</p>
                      </div>
                      <div>
                        <span className="text-white/70">User:</span>
                        <p className="text-white">{ticket.user?.email || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-white/70">Messages:</span>
                        <p className="text-white">{ticket.messages?.length || 0}</p>
                      </div>
                      <div>
                        <span className="text-white/70">Created:</span>
                        <p className="text-white">{new Date(ticket.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Ticket Detail Modal */}
        {selectedTicket && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-gradient-to-br from-purple-800 to-indigo-900 rounded-2xl border border-white/20 p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto my-8">
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-2">{selectedTicket.subject}</h2>
                  <p className="text-white/70 text-sm">Ticket #{selectedTicket.ticketNo}</p>
                </div>
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="text-white/70 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="flex gap-2 mb-6">
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(selectedTicket.status)}`}>
                  {selectedTicket.status.replace('_', ' ')}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(selectedTicket.priority)}`}>
                  {selectedTicket.priority}
                </span>
              </div>

              {/* Status Actions */}
              <div className="flex gap-2 mb-6">
                {selectedTicket.status !== 'IN_PROGRESS' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedTicket.id, 'IN_PROGRESS')}
                    disabled={updatingStatus}
                    className="px-4 py-2 bg-yellow-500 text-white rounded-lg font-semibold hover:bg-yellow-600 transition-all disabled:opacity-50"
                  >
                    Mark In Progress
                  </button>
                )}
                {selectedTicket.status !== 'RESOLVED' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedTicket.id, 'RESOLVED')}
                    disabled={updatingStatus}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-all disabled:opacity-50"
                  >
                    Mark Resolved
                  </button>
                )}
                {selectedTicket.status !== 'CLOSED' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedTicket.id, 'CLOSED')}
                    disabled={updatingStatus}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg font-semibold hover:bg-gray-600 transition-all disabled:opacity-50"
                  >
                    Close Ticket
                  </button>
                )}
                {!selectedTicket.assignedTo && (
                  <button
                    onClick={() => handleAssign(selectedTicket.id)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-all"
                  >
                    Assign to Me
                  </button>
                )}
              </div>

              {/* Messages */}
              <div className="space-y-4 mb-6">
                <h3 className="text-lg font-semibold">Messages</h3>
                {selectedTicket.messages && selectedTicket.messages.length > 0 ? (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {selectedTicket.messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`p-4 rounded-lg ${
                          msg.senderType === 'USER'
                            ? 'bg-blue-500/20 border border-blue-500/30'
                            : 'bg-purple-500/20 border border-purple-500/30'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <span className={`text-sm font-semibold ${
                            msg.senderType === 'USER' ? 'text-blue-300' : 'text-purple-300'
                          }`}>
                            {msg.senderType === 'USER' ? 'User' : 'Admin'}
                          </span>
                          <span className="text-white/50 text-xs">
                            {new Date(msg.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-white whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-white/70 text-center py-8">No messages yet</p>
                )}
              </div>

              {/* Send Message */}
              {selectedTicket.status !== 'CLOSED' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Reply</h3>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                    rows={4}
                    placeholder="Type your response..."
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={sending || !message.trim()}
                    className="px-6 py-2 bg-white text-purple-800 rounded-lg font-semibold hover:bg-white/90 transition-all disabled:opacity-50"
                  >
                    {sending ? 'Sending...' : 'Send Message'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

