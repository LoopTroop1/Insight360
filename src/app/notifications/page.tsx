'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from '@/context/SessionContext';
import DashboardLayout from '@/components/DashboardLayout';
import {
  Bell,
  Cpu,
  AlertCircle,
  TrendingUp,
  CheckCircle,
  RefreshCw,
  CheckCheck,
  Calendar,
  MessageSquare,
  Sparkles,
  User,
  Clock,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  HeartHandshake
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface Notification {
  id: number;
  message: string;
  type: string; // high_risk_file, performance_improvement, goal_delayed, ai_recommendation
  read: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const { currentUser } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<'all' | 'operational' | 'workload'>('all');

  // Workload Request State
  const [activeEventId, setActiveEventId] = useState<number | null>(null);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineReason, setDeclineReason] = useState('Already handling urgent work');
  const [processingAction, setProcessingAction] = useState(false);
  const [expandedDetails, setExpandedDetails] = useState<Record<number, boolean>>({});
  const [successToast, setSuccessToast] = useState<string | null>(null);

  useEffect(() => {
    fetchNotifications();
  }, [currentUser]);

  async function fetchNotifications() {
    if (!currentUser) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/notifications?userId=${currentUser.id}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleMarkAllRead = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch('/api/notifications/read-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id })
      });

      if (res.ok) {
        fetchNotifications();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleWorkloadAction = async (eventId: number, action: 'accept' | 'decline') => {
    if (!currentUser) return;
    setProcessingAction(true);
    try {
      const res = await fetch('/api/burnout-shield/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          actorId: currentUser.id,
          action,
          declineReason: action === 'decline' ? declineReason : undefined
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (action === 'accept') {
          confetti({
            particleCount: 100,
            spread: 60,
            origin: { y: 0.8 }
          });
          showToast('Workload accepted! Files successfully transferred.');
        } else {
          showToast(data.fallbackExecuted 
            ? 'Request declined. No other peers available. Fallback assignment executed.' 
            : 'Request declined. Workload escalated to the next ranked officer.');
        }
        setShowDeclineModal(false);
        fetchNotifications();
      } else {
        alert('Failed to process workload action');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setProcessingAction(false);
    }
  };

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => {
      setSuccessToast(null);
    }, 4000);
  };

  const parseEventId = (message: string) => {
    const match = message.match(/\[Event ID:\s*(\d+)\]/);
    return match ? parseInt(match[1]) : null;
  };

  const getNotificationIcon = (type: string, message: string) => {
    if (message.includes('[AI Workload Assistance Request]')) {
      return <HeartHandshake className="h-4.5 w-4.5 text-blue-600 animate-pulse" />;
    }
    switch (type) {
      case 'ai_recommendation':
        return <Cpu className="h-4.5 w-4.5 text-purple-600" />;
      case 'high_risk_file':
        return <AlertCircle className="h-4.5 w-4.5 text-rose-600 animate-pulse" />;
      case 'goal_delayed':
        return <Calendar className="h-4.5 w-4.5 text-amber-600" />;
      case 'performance_improvement':
        return <TrendingUp className="h-4.5 w-4.5 text-green-600" />;
      default:
        return <Bell className="h-4.5 w-4.5 text-slate-500" />;
    }
  };

  // Filter notifications based on tab selection
  const filteredNotifications = notifications.filter(n => {
    const isWorkload = n.message.includes('[AI Workload Assistance Request]');
    if (category === 'workload') return isWorkload;
    if (category === 'operational') return !isWorkload;
    return true;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6 relative">
        
        {/* Success Toast */}
        {successToast && (
          <div className="fixed bottom-5 right-5 bg-slate-900 border border-slate-800 text-white px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 z-50 animate-in fade-in slide-in-from-bottom-5">
            <Sparkles className="h-5 w-5 text-amber-400" />
            <span className="text-xs font-bold">{successToast}</span>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Bell className="h-6 w-6 text-blue-900" />
              Official Notifications Inbox
            </h2>
            <p className="text-sm text-slate-500">Live operational alerts, SLA notifications, and AI decision support triggers.</p>
          </div>

          <button
            onClick={handleMarkAllRead}
            disabled={notifications.length === 0 || !notifications.some(n => !n.read)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl border border-slate-200 text-xs transition-all disabled:opacity-50 shrink-0"
          >
            <CheckCheck className="h-4.5 w-4.5" />
            Mark all as read
          </button>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex border-b border-slate-200 gap-1">
          <button
            onClick={() => setCategory('all')}
            className={`px-4 py-2 border-b-2 font-bold text-xs transition-all ${
              category === 'all'
                ? 'border-blue-800 text-blue-900'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            All Alerts ({notifications.length})
          </button>
          <button
            onClick={() => setCategory('operational')}
            className={`px-4 py-2 border-b-2 font-bold text-xs transition-all ${
              category === 'operational'
                ? 'border-blue-800 text-blue-900'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            Operational Alerts ({notifications.filter(n => !n.message.includes('[AI Workload Assistance Request]')).length})
          </button>
          <button
            onClick={() => setCategory('workload')}
            className={`px-4 py-2 border-b-2 font-bold text-xs transition-all flex items-center gap-1.5 ${
              category === 'workload'
                ? 'border-blue-800 text-blue-900'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            AI Workload Requests ({notifications.filter(n => n.message.includes('[AI Workload Assistance Request]')).length})
            {notifications.some(n => !n.read && n.message.includes('[AI Workload Assistance Request]')) && (
              <span className="h-2 w-2 rounded-full bg-blue-600 animate-ping"></span>
            )}
          </button>
        </div>

        {/* Notifications List */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm max-w-4xl">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-900" />
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center text-slate-400 py-20 space-y-2">
              <Bell className="h-10 w-10 text-slate-200 mx-auto" />
              <p className="font-semibold text-sm">No notifications found in this category.</p>
              <p className="text-xs">No pending action alerts logged.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredNotifications.map((n) => {
                const eventId = parseEventId(n.message);
                const isWorkload = n.message.includes('[AI Workload Assistance Request]');

                return (
                  <div
                    key={n.id}
                    className={`p-5 flex flex-col md:flex-row items-start justify-between gap-4 transition-colors ${
                      n.read ? 'bg-white text-slate-500' : 'bg-blue-50/10 text-slate-800 font-medium'
                    }`}
                  >
                    <div className="flex items-start gap-4 flex-1">
                      <span className={`p-2 rounded-xl bg-slate-50 border border-slate-100 shrink-0 mt-0.5`}>
                        {getNotificationIcon(n.type, n.message)}
                      </span>
                      
                      <div className="flex-1 space-y-1 text-xs">
                        {isWorkload ? (
                          // Custom e-Office styled Collaborative Workload request layout
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wide">
                                AI Workload Request
                              </span>
                              {!n.read && <span className="bg-red-500 text-white text-[8px] font-bold px-1 py-0.2 rounded animate-pulse">Unread</span>}
                            </div>
                            <p className="leading-relaxed font-bold text-slate-800">
                              {n.message.replace(/\[Event ID:\s*\d+\]/, '').replace('[AI Workload Assistance Request] ', '')}
                            </p>
                            
                            {/* Toggleable Details panel */}
                            {eventId && expandedDetails[eventId] && (
                              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 animate-in slide-in-from-top-2">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Redistribution Metrics Preview</span>
                                <div className="grid grid-cols-2 gap-4 text-[11px]">
                                  <div>
                                    <span className="text-slate-400 block font-medium">Estimated Effort:</span>
                                    <span className="font-bold text-slate-700">Medium (Routine backlogs)</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 block font-medium">Priority Level:</span>
                                    <span className="font-bold text-red-600">CRITICAL</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 block font-medium">Predicted Productivity Gain:</span>
                                    <span className="font-bold text-emerald-600">+4.5% DPI</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 block font-medium">AI Recommendation Score:</span>
                                    <span className="font-bold text-purple-700">97.2% Match</span>
                                  </div>
                                </div>
                                <div className="border-t border-slate-200 pt-2 text-[10px] text-slate-400">
                                  <span>Transfer Target File References: <strong>#F-102, #F-104, #F-107</strong></span>
                                </div>
                              </div>
                            )}

                            {/* Actions panel */}
                            {eventId && (
                              <div className="flex flex-wrap items-center gap-2.5 pt-1.5">
                                <button
                                  onClick={() => handleWorkloadAction(eventId, 'accept')}
                                  disabled={processingAction}
                                  className="px-3.5 py-1.5 bg-blue-900 hover:bg-blue-800 text-white rounded-lg font-bold text-[10px] transition-all shadow-sm"
                                >
                                  Accept Request
                                </button>
                                <button
                                  onClick={() => {
                                    setActiveEventId(eventId);
                                    setShowDeclineModal(true);
                                  }}
                                  disabled={processingAction}
                                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 rounded-lg font-bold text-[10px] transition-all"
                                >
                                  Decline
                                </button>
                                <button
                                  onClick={() => {
                                    setExpandedDetails(prev => ({
                                      ...prev,
                                      [eventId]: !prev[eventId]
                                    }));
                                  }}
                                  className="text-[10px] text-slate-400 hover:text-slate-700 font-bold flex items-center gap-0.5 ml-2"
                                >
                                  {expandedDetails[eventId] ? (
                                    <>
                                      Hide Details
                                      <ChevronUp className="h-3 w-3" />
                                    </>
                                  ) : (
                                    <>
                                      View Details
                                      <ChevronDown className="h-3 w-3" />
                                    </>
                                  )}
                                </button>
                              </div>
                            )}
                          </div>
                        ) : (
                          // Normal message structure
                          <div className="space-y-0.5">
                            <p className="leading-relaxed font-bold">{n.message}</p>
                            <span className="text-[10px] text-slate-400 block">
                              {new Date(n.createdAt).toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Decline Reason Modal */}
        {showDeclineModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
                <div className="flex items-center gap-2 text-red-800">
                  <AlertTriangle className="h-5 w-5" />
                  <span className="font-bold text-base">Decline Workload Assistance</span>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-xs text-slate-500">
                  Declining this request escalates it to the next eligible officer in the department. Please select a reason for the audit vault log:
                </p>
                <div className="space-y-2">
                  {[
                    'Already handling urgent work',
                    'On leave soon',
                    'Lack of expertise',
                    'Current workload capacity exceeded',
                    'Other operational constraint'
                  ].map(reason => (
                    <label key={reason} className="flex items-center gap-2.5 p-2 bg-slate-50 hover:bg-slate-100 rounded-lg cursor-pointer text-xs font-semibold text-slate-700">
                      <input
                        type="radio"
                        name="declineReason"
                        checked={declineReason === reason}
                        onChange={() => setDeclineReason(reason)}
                        className="text-blue-900 focus:ring-blue-900"
                      />
                      {reason}
                    </label>
                  ))}
                </div>
                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                  <button
                    onClick={() => setShowDeclineModal(false)}
                    className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => activeEventId && handleWorkloadAction(activeEventId, 'decline')}
                    disabled={processingAction}
                    className="px-4.5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md"
                  >
                    Confirm Decline
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
