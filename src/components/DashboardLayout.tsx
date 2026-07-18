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
  FileSpreadsheet,
  X,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowRight
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

  // Priority Briefing Modal States
  const [showPriorityModal, setShowPriorityModal] = useState(false);
  const [briefingData, setBriefingData] = useState<{
    tasks: any[];
    pendingFiles: any[];
    latestKpi?: any;
  } | null>(null);
  const [fetchingBriefing, setFetchingBriefing] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    
    // Check if the user has already seen the daily briefing popup in the current session
    const key = `seen_priority_briefing_${currentUser.id}`;
    const hasSeen = sessionStorage.getItem(key);
    
    if (!hasSeen) {
      setShowPriorityModal(true);
      sessionStorage.setItem(key, 'true');
      
      // Fetch user briefing payload (tasks, pending files, KPIs)
      setFetchingBriefing(true);
      fetch(`/api/officer-dashboard?userId=${currentUser.id}`)
        .then((res) => {
          if (res.ok) return res.json();
          throw new Error('Failed to fetch briefing data');
        })
        .then((data) => {
          setBriefingData({
            tasks: data.tasks || [],
            pendingFiles: data.pendingFiles || [],
            latestKpi: data.latestKpi || null,
          });
        })
        .catch((err) => console.error('Error fetching priority briefing:', err))
        .finally(() => setFetchingBriefing(false));
    }
  }, [currentUser]);

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

      {/* Priority Briefing Modal Popup */}
      {showPriorityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4 transition-all duration-300 animate-fade-in">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200 animate-scale-in">
            
            {/* Header Banner */}
            <div className="relative text-white p-6 flex flex-col justify-between select-none" style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #172554 100%)' }}>
              <div className="absolute top-0 left-0 right-0 h-1.5 flex">
                <div className="flex-1 bg-[#FF9933]"></div>
                <div className="flex-1 bg-white"></div>
                <div className="flex-1 bg-[#138808]"></div>
              </div>
              
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
                    <Bell className="h-5 w-5 text-amber-400 animate-bounce" />
                    Daily Performance Briefing
                  </h2>
                  <p className="text-xs text-slate-300 mt-1">
                    Welcome back, <span className="font-semibold text-white">{currentUser?.name}</span> ({currentUser?.designation})
                  </p>
                </div>
                <button 
                  onClick={() => setShowPriorityModal(false)}
                  className="p-1.5 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Mini DPI Card */}
              {briefingData?.latestKpi && (
                <div className="mt-4 p-3 bg-white/10 border border-white/10 rounded-xl flex items-center justify-between gap-4 backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-white/10 flex items-center justify-center font-bold text-amber-300 text-sm">
                      DPI
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-300">Departmental/Individual Index</p>
                      <p className="text-sm font-bold text-white">
                        Performance Rating: {briefingData.latestKpi.dpi.toFixed(1)} / 100
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      briefingData.latestKpi.dpi >= 80 
                        ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
                        : briefingData.latestKpi.dpi >= 50 
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                        : 'bg-red-500/20 text-red-300 border border-red-500/30'
                    }`}>
                      {briefingData.latestKpi.dpi >= 80 ? 'Exemplary' : briefingData.latestKpi.dpi >= 50 ? 'Satisfactory' : 'Needs Review'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Content Columns */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
              {fetchingBriefing ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <RefreshCw className="h-8 w-8 animate-spin text-blue-900" />
                  <p className="text-xs font-medium text-slate-500">Retrieving today's agenda...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Left: Tasks */}
                  <div className="flex flex-col">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-3 border-b border-slate-200 pb-2 uppercase tracking-wider text-xs">
                      <CheckSquare className="h-4 w-4 text-blue-600" />
                      Priority Tasks ({briefingData?.tasks.filter(t => t.status !== 'done').length || 0})
                    </h3>
                    
                    <div className="space-y-3 overflow-y-auto max-h-[380px] pr-1">
                      {briefingData?.tasks.filter(t => t.status !== 'done').length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-white rounded-xl border border-slate-200">
                          <CheckCircle2 className="h-8 w-8 text-green-500 mb-2" />
                          <p className="text-xs font-bold text-slate-800">All Tasks Completed</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">Great job! You have no outstanding tasks for today.</p>
                        </div>
                      ) : (
                        briefingData?.tasks.filter(t => t.status !== 'done').map((task) => {
                          const isOverdue = new Date(task.deadline) < new Date();
                          const taskIdMatch = task.description.match(/^Task-(\d+):/i);
                          const taskId = taskIdMatch ? `Task ${taskIdMatch[1]}` : `Task #${task.id}`;
                          const cleanDesc = task.description
                            .replace(/^Task-\d+:\s*/i, '')
                            .replace(/^Detail action item supporting\s*/i, '')
                            .replace(/\.\s*Requires detailed compliance review\.?$/i, '');

                          const daysLeft = Math.ceil((new Date(task.deadline).getTime() - new Date().getTime()) / (24 * 60 * 60 * 1000));
                          let deadlineText = '';
                          if (daysLeft < 0) {
                            deadlineText = `Overdue by ${Math.abs(daysLeft)}d`;
                          } else if (daysLeft === 0) {
                            deadlineText = 'Due Today';
                          } else if (daysLeft === 1) {
                            deadlineText = 'Due Tomorrow';
                          } else {
                            deadlineText = `Due in ${daysLeft}d`;
                          }

                          return (
                            <div key={task.id} className="p-3 bg-white rounded-xl border border-slate-200 hover:border-blue-300 transition-all flex flex-col gap-2 shadow-sm hover-scale">
                              <div className="flex justify-between items-start gap-2">
                                <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5 shrink-0">
                                  <CheckSquare className="h-3.5 w-3.5" />
                                  {taskId}
                                </span>
                                <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                                  task.status === 'in-progress' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-slate-100 text-slate-600'
                                }`}>
                                  {task.status}
                                </span>
                              </div>

                              <p className="text-xs font-semibold text-slate-800 line-clamp-1 leading-relaxed">
                                {cleanDesc}
                              </p>

                              {/* Visual Progress Bar */}
                              <div className="flex items-center gap-2 mt-1">
                                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-blue-600 rounded-full transition-all duration-500" 
                                    style={{ width: `${task.completionPct}%` }}
                                  />
                                </div>
                                <span className="text-[9px] font-bold text-slate-500">{task.completionPct}%</span>
                              </div>

                              <div className="flex justify-between items-center text-[9px] text-slate-400 border-t border-slate-100 pt-1.5 mt-1">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  Deadline: {new Date(task.deadline).toLocaleDateString()}
                                </span>
                                <span className={`font-semibold flex items-center gap-1 ${isOverdue ? 'text-red-500 font-bold animate-pulse' : 'text-slate-500'}`}>
                                  <AlertCircle className="h-3 w-3" />
                                  {deadlineText}
                                </span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Right: Files */}
                  <div className="flex flex-col">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-3 border-b border-slate-200 pb-2 uppercase tracking-wider text-xs">
                      <FileText className="h-4 w-4 text-amber-600" />
                      Pending Files ({briefingData?.pendingFiles.length || 0})
                    </h3>

                    <div className="space-y-3 overflow-y-auto max-h-[380px] pr-1">
                      {briefingData?.pendingFiles.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-white rounded-xl border border-slate-200">
                          <CheckCircle2 className="h-8 w-8 text-green-500 mb-2" />
                          <p className="text-xs font-bold text-slate-800">Files Queue Cleared</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">No pending files require your signature.</p>
                        </div>
                      ) : (
                        briefingData?.pendingFiles.map((file) => {
                          const priorityLower = file.priority.toLowerCase();
                          const receivedDate = new Date(file.createdAt);
                          const dueDate = new Date(receivedDate);
                          dueDate.setDate(dueDate.getDate() + file.slaCategoryDays);
                          const isOverdue = dueDate < new Date();
                          
                          const fileIdMatch = file.subject.match(/^File-(\d+):/i);
                          const fileIdStr = fileIdMatch ? `File ${fileIdMatch[1]}` : `File #${file.id}`;
                          const cleanSubject = file.subject
                            .replace(/^File-\d+:\s*/i, '')
                            .replace(/^Discussion on\s*/i, '');

                          const elapsedDays = Math.max(0, Math.floor((new Date().getTime() - receivedDate.getTime()) / (24 * 60 * 60 * 1000)));
                          const slaPercent = Math.min(100, Math.round((elapsedDays / file.slaCategoryDays) * 100));
                          const slaColor = isOverdue ? 'bg-red-500' : slaPercent > 75 ? 'bg-amber-500' : 'bg-green-500';

                          return (
                            <div key={file.id} className="p-3 bg-white rounded-xl border border-slate-200 hover:border-amber-300 transition-all flex flex-col gap-2 shadow-sm hover-scale">
                              <div className="flex justify-between items-start gap-2">
                                <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5 shrink-0">
                                  <FileText className="h-3.5 w-3.5" />
                                  {fileIdStr}
                                </span>
                                <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider shrink-0 border ${
                                  priorityLower === 'high' || priorityLower === 'urgent' || priorityLower === 'critical'
                                    ? 'bg-red-50 text-red-600 border-red-200'
                                    : priorityLower === 'medium'
                                    ? 'bg-amber-50 text-amber-600 border-amber-200'
                                    : 'bg-slate-50 text-slate-600 border-slate-200'
                                }`}>
                                  {file.priority}
                                </span>
                              </div>

                              <p className="text-xs font-semibold text-slate-800 line-clamp-1 leading-relaxed">
                                {cleanSubject}
                              </p>

                              {/* SLA Progress Bar */}
                              <div className="mt-1 space-y-1">
                                <div className="flex justify-between text-[8px] font-semibold text-slate-400">
                                  <span>SLA Time Elapsed: {slaPercent}%</span>
                                  <span>{elapsedDays}/{file.slaCategoryDays} Days</span>
                                </div>
                                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full ${slaColor} rounded-full`} 
                                    style={{ width: `${slaPercent}%` }}
                                  />
                                </div>
                              </div>

                              <div className="flex justify-between items-center text-[9px] text-slate-400 border-t border-slate-100 pt-1.5 mt-1">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  Recv: {receivedDate.toLocaleDateString()}
                                </span>
                                <span className={`font-semibold flex items-center gap-1 ${isOverdue ? 'text-red-500 font-bold' : 'text-slate-500'}`}>
                                  <AlertCircle className="h-3 w-3" />
                                  Due: {dueDate.toLocaleDateString()} {isOverdue && ' (Overdue)'}
                                </span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center gap-4">
              <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
                <Lock className="h-3.5 w-3.5 text-slate-400" />
                <span>NIC secure workspace ledger</span>
              </div>
              <button
                onClick={() => setShowPriorityModal(false)}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all transform active:scale-95"
              >
                Acknowledge & Start Work
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
