'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from '@/context/SessionContext';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FileText,
  Target,
  Network,
  Cpu,
  BarChart3,
  Users2,
  Lock,
  Bell,
  RefreshCw,
  LayoutDashboard,
  CheckSquare,
  FileSpreadsheet
} from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { currentUser, users, loading, switchUser } = useSession();
  const pathname = usePathname();
  const [unreadNotifications, setUnreadNotifications] = useState<number>(0);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  // Fetch unread notifications count
  useEffect(() => {
    if (!currentUser) return;
    async function fetchNotifications() {
      if (!currentUser) return;
      try {
        const res = await fetch(`/api/notifications?userId=${currentUser.id}`);
        if (res.ok) {
          const data = await res.json();
          setNotifications(data.slice(0, 5)); // show top 5 in dropdown
          setUnreadNotifications(data.filter((n: any) => !n.read).length);
        }
      } catch (err) {
        console.error('Error fetching notifications:', err);
      }
    }
    fetchNotifications();
    // Refresh notifications every 10 seconds for mock real-time
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, [currentUser]);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-2">
          <RefreshCw className="h-10 w-10 animate-spin text-blue-900" />
          <p className="text-sm font-medium text-slate-600">Initializing e-Office Pro...</p>
        </div>
      </div>
    );
  }

  // Get active layout base route depending on persona
  let dashboardLink = '/officer';
  if (currentUser?.personaType === 'secretary') dashboardLink = '/secretary';
  else if (currentUser?.personaType === 'teamlead') dashboardLink = '/teamlead';

  const menuItems = [
    { name: 'Dashboard', path: dashboardLink, icon: LayoutDashboard, roles: ['all'] },
    { name: 'e-Office Files', path: '/files', icon: FileText, roles: ['all'] },
    { name: 'Goals & KPIs', path: '/goals', icon: Target, roles: ['all'] },
    { name: 'Hierarchy Explorer', path: '/hierarchy', icon: Network, roles: ['secretary', 'teamlead'] },
    { name: 'AI Decision Center', path: '/ai-center', icon: Cpu, roles: ['secretary', 'teamlead', 'officer'] },
    { name: 'Benchmark Center', path: '/benchmarks', icon: BarChart3, roles: ['secretary', 'teamlead'] },
    { name: 'Citizen Impact', path: '/citizen-impact', icon: Users2, roles: ['all'] },
    { name: 'Audit Vault', path: '/audit-vault', icon: Lock, roles: ['secretary', 'auditor'] },
    { name: 'SPARROW Sync', path: '/sparrow-sync', icon: FileSpreadsheet, roles: ['secretary', 'officer'] },
    { name: 'Print Reports', path: '/reports', icon: FileText, roles: ['secretary', 'teamlead'] },
  ];

  const handleMarkAllRead = async () => {
    if (!currentUser) return;
    try {
      await fetch(`/api/notifications/read-all`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id })
      });
      setUnreadNotifications(0);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-900">
      {/* Sidebar */}
      <aside className="hidden w-64 bg-slate-900 text-slate-100 md:flex md:flex-col border-r border-slate-800">
        {/* Brand Logo */}
        <div className="flex flex-col gap-1 p-5 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 font-bold text-white text-base">
              eP
            </span>
            <span className="text-lg font-bold tracking-tight">e-Office Pro</span>
          </div>
          <span className="text-xs text-blue-400 font-medium">NIC Performance Management</span>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            // Check roles
            const isAccessible =
              item.roles.includes('all') ||
              (currentUser && item.roles.includes(currentUser.personaType)) ||
              (currentUser && currentUser.role === 'secretary'); // Secretary has access to all

            if (!isAccessible) return null;

            const isActive = pathname === item.path || pathname.startsWith(item.path + '/');

            return (
              <Link
                key={item.name}
                href={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-700 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User profile footer in sidebar */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <img
              src={currentUser?.avatarUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150"}
              alt={currentUser?.name}
              className="h-9 w-9 rounded-full object-cover border border-slate-700"
            />
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-semibold truncate text-white">{currentUser?.name}</p>
              <p className="text-xs text-slate-400 truncate">{currentUser?.designation}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="flex h-16 items-center justify-between px-6 bg-white border-b border-slate-200 shadow-sm relative">
          {/* Top Indian flag stripes decoration */}
          <div className="absolute top-0 left-0 right-0 h-1 flex">
            <div className="flex-1 bg-[#FF9933]"></div>
            <div className="flex-1 bg-white"></div>
            <div className="flex-1 bg-[#138808]"></div>
          </div>

          <div className="flex items-center gap-4">
            <h1 className="text-lg font-bold text-slate-800 md:block hidden">
              {currentUser?.department?.name || 'Government of India'}
            </h1>
          </div>

          {/* Header Action Items */}
          <div className="flex items-center gap-4">
            {/* Dynamic Auth Persona Selector */}
            <div className="flex items-center gap-2 bg-slate-100 rounded-lg p-1.5 border border-slate-200">
              <span className="text-xs font-semibold text-slate-500 px-2 uppercase md:inline-block hidden">
                Persona Switcher:
              </span>
              <select
                value={currentUser?.id || ''}
                onChange={(e) => switchUser(parseInt(e.target.value))}
                className="bg-white text-xs font-semibold text-slate-800 border border-slate-200 rounded px-2.5 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.personaType.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>

            {/* Notification Bell with Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
                className="p-2 text-slate-500 hover:text-slate-800 rounded-full hover:bg-slate-100 relative"
              >
                <Bell className="h-5 w-5" />
                {unreadNotifications > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
                    {unreadNotifications}
                  </span>
                )}
              </button>

              {showNotificationDropdown && (
                <div className="absolute right-0 mt-2 w-80 rounded-xl bg-white border border-slate-200 shadow-xl z-50 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
                    <span className="text-sm font-semibold text-slate-800">Notifications</span>
                    <button
                      onClick={handleMarkAllRead}
                      className="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      Mark all as read
                    </button>
                  </div>
                  <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-400">No new notifications.</div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`p-3 text-xs leading-normal transition-colors ${
                            n.read ? 'text-slate-500 bg-white' : 'text-slate-800 bg-blue-50/40 font-medium'
                          }`}
                        >
                          <p>{n.message}</p>
                          <span className="text-[10px] text-slate-400 mt-1 block">
                            {new Date(n.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                  <Link
                    href="/notifications"
                    onClick={() => setShowNotificationDropdown(false)}
                    className="block text-center py-2.5 bg-slate-50 text-xs font-semibold text-blue-600 hover:text-blue-800 border-t border-slate-200 hover:bg-slate-100 transition-colors"
                  >
                    View all notifications
                  </Link>
                </div>
              )}
            </div>

            {/* Quick Badge indicator */}
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                currentUser?.personaType === 'secretary'
                  ? 'bg-purple-100 text-purple-800 border border-purple-200'
                  : currentUser?.personaType === 'teamlead'
                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                  : 'bg-green-100 text-green-800 border border-green-200'
              }`}>
                {currentUser?.personaType === 'secretary' ? 'Secretary' : currentUser?.personaType === 'teamlead' ? 'Team Lead' : 'Officer'}
              </span>
            </div>
          </div>
        </header>

        {/* Scrollable View Area */}
        <main className="flex-1 overflow-y-auto p-6 bg-slate-50">
          {children}
        </main>
      </div>
    </div>
  );
}
