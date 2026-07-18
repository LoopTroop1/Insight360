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
  Trash2,
  CheckCheck,
  Calendar,
  MessageSquare
} from 'lucide-react';

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

  const getNotificationIcon = (type: string) => {
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        
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

        {/* Notifications List */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm max-w-4xl">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-900" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center text-slate-400 py-20 space-y-2">
              <Bell className="h-10 w-10 text-slate-200 mx-auto" />
              <p className="font-semibold text-sm">Notifications inbox is empty.</p>
              <p className="text-xs">No pending action alerts logged.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-4 flex items-start gap-4 transition-colors ${
                    n.read ? 'bg-white text-slate-500' : 'bg-blue-50/20 text-slate-800 font-medium'
                  }`}
                >
                  <span className={`p-2 rounded-xl bg-slate-50 border border-slate-100 shrink-0 mt-0.5`}>
                    {getNotificationIcon(n.type)}
                  </span>
                  
                  <div className="flex-1 space-y-1 text-xs">
                    <p className="leading-relaxed font-semibold">{n.message}</p>
                    <span className="text-[10px] text-slate-400 block">
                      {new Date(n.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </DashboardLayout>
  );
}
