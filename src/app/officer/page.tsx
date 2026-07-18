'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from '@/context/SessionContext';
import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import {
  CheckSquare,
  FileText,
  AlertCircle,
  TrendingUp,
  Award,
  Bell,
  HelpCircle,
  HeartHandshake,
  MessageSquare,
  X,
  Star,
  CheckCircle2,
  RefreshCw,
  Clock,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface DashboardData {
  user: any;
  tasks: any[];
  pendingFiles: any[];
  latestKpi: any;
  kpiHistory: any[];
  engagement: any;
  notifications: any[];
  upcomingDeadlines: any[];
  workloadEvents: any[];
}

export default function OfficerPage() {
  const { currentUser } = useSession();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  // Help Request Modal
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [helpMsg, setHelpMsg] = useState('');
  const [submittingHelp, setSubmittingHelp] = useState(false);
  const [helpSuccess, setHelpSuccess] = useState(false);

  // Survey Feedback Modal
  const [isSurveyOpen, setIsSurveyOpen] = useState(false);
  const [surveyRating, setSurveyRating] = useState(5);
  const [surveyComment, setSurveyComment] = useState('');
  const [submittingSurvey, setSubmittingSurvey] = useState(false);
  const [surveySuccess, setSurveySuccess] = useState(false);

  // Task inline update state
  const [updatingTaskId, setUpdatingTaskId] = useState<number | null>(null);

  // Workload Assistance request hooks
  const [workloadTab, setWorkloadTab] = useState<'incoming' | 'outgoing' | 'accepted' | 'declined' | 'history'>('incoming');
  const [activeWorkloadEventId, setActiveWorkloadEventId] = useState<number | null>(null);
  const [isDeclineModalOpen, setIsDeclineModalOpen] = useState(false);
  const [declineReasonText, setDeclineReasonText] = useState('Already handling urgent work');
  const [processingWorkload, setProcessingWorkload] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleWorkloadRequestAction = async (eventId: number, action: 'accept' | 'decline') => {
    if (!currentUser) return;
    setProcessingWorkload(true);
    try {
      const res = await fetch('/api/burnout-shield/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          actorId: currentUser.id,
          action,
          declineReason: action === 'decline' ? declineReasonText : undefined
        })
      });

      if (res.ok) {
        const payload = await res.json();
        if (action === 'accept') {
          confetti({
            particleCount: 65,
            spread: 45,
            origin: { y: 0.8 }
          });
          setToastMessage('Workload accepted! Files successfully transferred.');
        } else {
          setToastMessage(payload.fallbackExecuted
            ? 'Request declined. No other peers available. Fallback policy executed.'
            : 'Request declined. Workload escalated to the next ranked officer.');
        }
        setTimeout(() => setToastMessage(null), 4000);
        setIsDeclineModalOpen(false);
        fetchDashboardData();
      } else {
        alert('Failed to process workload request action.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setProcessingWorkload(false);
    }
  };

  useEffect(() => {
    setIsMounted(true);
    fetchDashboardData();
  }, [currentUser]);

  async function fetchDashboardData() {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/officer-dashboard?userId=${currentUser.id}`);
      if (res.ok) {
        const payload = await res.json();
        setData(payload);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // Handle task status update
  const handleTaskStatusChange = async (taskId: number, newStatus: string) => {
    setUpdatingTaskId(taskId);
    const completionPct = newStatus === 'done' ? 100 : newStatus === 'in-progress' ? 50 : 0;
    
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          completionPct
        })
      });

      if (res.ok) {
        if (newStatus === 'done') {
          // Success explosion!
          confetti({
            particleCount: 80,
            spread: 50,
            origin: { y: 0.8 }
          });
        }
        // Refresh dashboard numbers
        fetchDashboardData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingTaskId(null);
    }
  };

  // Submit help request
  const submitHelpRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !helpMsg) return;

    setSubmittingHelp(true);
    try {
      const res = await fetch('/api/help-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          message: helpMsg
        })
      });

      if (res.ok) {
        setHelpSuccess(true);
        setHelpMsg('');
        setTimeout(() => {
          setIsHelpModalOpen(false);
          setHelpSuccess(false);
        }, 1500);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingHelp(false);
    }
  };

  // Submit feedback survey
  const submitSurvey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setSubmittingSurvey(true);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          rating: surveyRating,
          comment: surveyComment
        })
      });

      if (res.ok) {
        setSurveySuccess(true);
        setSurveyComment('');
        setTimeout(() => {
          setIsSurveyOpen(false);
          setSurveySuccess(false);
          fetchDashboardData();
        }, 1500);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingSurvey(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-40">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-900" />
        </div>
      </DashboardLayout>
    );
  }

  if (!data) return null;

  const { latestKpi, tasks, pendingFiles, kpiHistory, engagement, notifications, upcomingDeadlines } = data;
  const dpiScore = latestKpi?.dpi || 75.0;

  // Split badges
  const badgesList = engagement?.badgesEarned ? engagement.badgesEarned.split(',') : [];

  // Chart computations
  const todoCount = tasks.filter((t: any) => t.status === 'to-do').length;
  const inProgressCount = tasks.filter((t: any) => t.status === 'in-progress').length;
  const doneCount = tasks.filter((t: any) => t.status === 'done').length;
  const taskStatusData = [
    { name: 'To-Do', value: todoCount, color: '#f59e0b' },
    { name: 'In Progress', value: inProgressCount, color: '#3b82f6' },
    { name: 'Completed', value: doneCount, color: '#10b981' }
  ].filter(item => item.value > 0);

  const filePriorities = pendingFiles.reduce((acc: Record<string, number>, file: any) => {
    const p = file.priority || 'MEDIUM';
    acc[p] = (acc[p] || 0) + 1;
    return acc;
  }, {});
  const priorityOrder = ['CRITICAL', 'HIGH', 'MEDIUM', 'NORMAL', 'LOW'];
  const filePriorityData = priorityOrder
    .map(p => ({
      priority: p,
      Count: filePriorities[p] || 0
    }))
    .filter(item => item.Count > 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        
        {/* Welcome Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <div className="flex items-center gap-3">
            <img
              src={currentUser?.avatarUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"}
              alt={currentUser?.name}
              className="h-14 w-14 rounded-full object-cover border-2 border-blue-900/10 shadow"
            />
            <div>
              <h2 className="text-xl font-bold text-slate-800">Welcome Back, {currentUser?.name}</h2>
              <p className="text-xs text-slate-500 font-medium">Logged in under: {currentUser?.designation} • {currentUser?.department?.name}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsHelpModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 font-bold rounded-xl text-xs transition-all"
            >
              <HeartHandshake className="h-4 w-4 text-amber-700" />
              Request Help
            </button>
            <button
              onClick={() => setIsSurveyOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 font-bold rounded-xl text-xs transition-all"
            >
              <MessageSquare className="h-4 w-4 text-blue-700" />
              Submit Feedback
            </button>
          </div>
        </div>

        {/* Top summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Personal DPI */}
          <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-blue-900"></div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Personal DPI</span>
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-900">
                <TrendingUp className="h-4.5 w-4.5" />
              </span>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-800">{dpiScore}</span>
              <span className="text-xs font-bold text-green-600">/ 100</span>
            </div>
            <div className="mt-2 text-[10px] text-slate-500 font-semibold flex items-center gap-1">
              <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold ${
                dpiScore >= 80 ? 'bg-green-100 text-green-800' : dpiScore >= 60 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
              }`}>
                {dpiScore >= 80 ? 'EXCELLENT' : dpiScore >= 60 ? 'GOOD' : 'CRITICAL'}
              </span>
              <span>vs previous period</span>
            </div>
          </div>

          {/* Pending Files */}
          <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-yellow-500"></div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pending Files</span>
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-yellow-50 text-yellow-800">
                <FileText className="h-4.5 w-4.5" />
              </span>
            </div>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-3xl font-extrabold text-slate-800">{pendingFiles.length}</span>
              <span className="text-xs text-slate-400">e-Files</span>
            </div>
            <p className="text-[10px] text-slate-400 font-semibold mt-2.5">Awaiting notesheet clearance</p>
          </div>

          {/* Pending Tasks */}
          <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-green-600"></div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Tasks</span>
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-green-50 text-green-700">
                <CheckSquare className="h-4.5 w-4.5" />
              </span>
            </div>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-3xl font-extrabold text-slate-800">{tasks.filter(t => t.status !== 'done').length}</span>
              <span className="text-xs text-slate-400">assigned</span>
            </div>
            <p className="text-[10px] text-slate-400 font-semibold mt-2.5">Rolls up into cascading goals</p>
          </div>

          {/* Engagement Score */}
          <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-purple-600"></div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Engagement Index</span>
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-50 text-purple-700">
                <Award className="h-4.5 w-4.5" />
              </span>
            </div>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-3xl font-extrabold text-slate-800">{engagement?.engagementIndex || 70.0}</span>
              <span className="text-xs text-slate-400">%</span>
            </div>
            <p className="text-[10px] text-slate-400 font-semibold mt-2.5">Reflected in SPARROW sync</p>
          </div>
        </div>

        {/* Performance Graph Trend & Right Widgets */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Performance Line Chart */}
          <div className="lg:col-span-2 p-5 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm text-slate-800">8-Week Performance Ledger Trend</h3>
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Real-time Telemetry</span>
            </div>
            
            {/* Chart Holder */}
            <div className="h-64 w-full flex-1">
              {isMounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={kpiHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="week" stroke="#94a3b8" style={{ fontSize: '10px' }} />
                    <YAxis domain={[0, 100]} stroke="#94a3b8" style={{ fontSize: '10px' }} />
                    <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px' }} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Line
                      type="monotone"
                      dataKey="dpi"
                      name="Productivity Index (DPI)"
                      stroke="#1e3a8a"
                      strokeWidth={3}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="quality"
                      name="Quality Score"
                      stroke="#0d9488"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Sidebar Widgets (Upcoming Deadlines & Badges) */}
          <div className="space-y-4">
            
            {/* Deadlines Widget */}
            <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm">
              <h3 className="font-bold text-sm text-slate-800 mb-3 flex items-center gap-1.5">
                <AlertCircle className="h-4.5 w-4.5 text-rose-500" />
                Deadlines Alert (7 Days)
              </h3>
              
              <div className="space-y-2.5 max-h-36 overflow-y-auto">
                {upcomingDeadlines.length === 0 ? (
                  <div className="text-center text-xs text-slate-400 py-6">No urgent deadlines approaching.</div>
                ) : (
                  upcomingDeadlines.map((dl: any) => (
                    <div key={dl.id} className="p-2.5 rounded-xl bg-rose-50/40 border border-rose-100 flex items-center justify-between text-xs">
                      <div>
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold mr-1.5 ${
                          dl.type === 'TASK' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                        }`}>
                          {dl.type}
                        </span>
                        <span className="font-bold text-slate-700">{dl.title}</span>
                      </div>
                      <span className="font-bold text-rose-600 shrink-0 ml-2">
                        {new Date(dl.deadline).toLocaleDateString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Badges Achievements */}
            <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm">
              <h3 className="font-bold text-sm text-slate-800 mb-3 flex items-center gap-1.5">
                <Award className="h-4.5 w-4.5 text-purple-600" />
                DPI Badge Achievements
              </h3>
              
              <div className="flex flex-wrap gap-2">
                {badgesList.length === 0 ? (
                  <div className="text-center text-xs text-slate-400 py-4 w-full">Complete tasks and files to earn badges.</div>
                ) : (
                  badgesList.map((badge: string) => {
                    const formattedBadge = badge.replace('_', ' ').toUpperCase();
                    return (
                      <span
                        key={badge}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 ${
                          badge === 'speed_demon'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : badge === 'citizen_hero'
                            ? 'bg-teal-50 text-teal-800 border-teal-200'
                            : 'bg-blue-50 text-blue-800 border-blue-200'
                        }`}
                      >
                        <Award className="h-3.5 w-3.5" />
                        {formattedBadge}
                      </span>
                    );
                  })
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Visualizations Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Task Status Distribution (Pie Chart) */}
          <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col">
            <h3 className="font-bold text-sm text-slate-800 mb-4">Task Status Distribution</h3>
            <div className="h-60 w-full flex items-center justify-center">
              {isMounted && taskStatusData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={taskStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {taskStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [value ? `${value} Tasks` : '', 'Count']} />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-xs text-slate-400 py-12">No tasks to display status distribution.</div>
              )}
            </div>
          </div>

          {/* Pending Files Priority Distribution (Bar Chart) */}
          <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col">
            <h3 className="font-bold text-sm text-slate-800 mb-4">Pending Files Priority Breakdown</h3>
            <div className="h-60 w-full">
              {isMounted && pendingFiles.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={filePriorityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="priority" stroke="#94a3b8" style={{ fontSize: '10px' }} />
                    <YAxis allowDecimals={false} stroke="#94a3b8" style={{ fontSize: '10px' }} />
                    <Tooltip formatter={(value) => [value ? `${value} Files` : '', 'Pending']} />
                    <Bar dataKey="Count" fill="#1e3a8a" radius={[4, 4, 0, 0]}>
                      {filePriorityData.map((entry, index) => {
                        let barColor = '#3b82f6';
                        if (entry.priority === 'CRITICAL') barColor = '#e11d48';
                        else if (entry.priority === 'HIGH') barColor = '#d97706';
                        else if (entry.priority === 'LOW') barColor = '#94a3b8';
                        return <Cell key={`cell-${index}`} fill={barColor} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-xs text-slate-400 py-12">No pending files to display.</div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Double Panel (Tasks list & Pending files) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Today's Tasks board */}
          <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col">
            <h3 className="font-bold text-sm text-slate-800 mb-3 flex items-center gap-1.5">
              <CheckSquare className="h-4.5 w-4.5 text-blue-900" />
              Assigned Work Tasks
            </h3>
            
            <div className="flex-1 overflow-y-auto space-y-3 max-h-72">
              {tasks.length === 0 ? (
                <div className="text-center text-xs text-slate-400 py-12">No work tasks assigned.</div>
              ) : (
                tasks.map((task: any) => (
                  <div
                    key={task.id}
                    className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                      task.status === 'done'
                        ? 'bg-slate-50 border-slate-200 text-slate-400 line-through'
                        : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <span className="mt-1">
                        <CheckCircle2 className={`h-4.5 w-4.5 ${
                          task.status === 'done' ? 'text-green-600' : 'text-slate-300'
                        }`} />
                      </span>
                      <div>
                        <p className="text-xs font-bold text-slate-700">{task.description}</p>
                        <p className="text-[10px] text-slate-400 mt-1">Goal: {task.goal?.title} | Deadline: {new Date(task.deadline).toLocaleDateString()}</p>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {updatingTaskId === task.id ? (
                        <RefreshCw className="h-4 w-4 animate-spin text-slate-400" />
                      ) : (
                        <select
                          value={task.status}
                          disabled={task.status === 'done'}
                          onChange={(e) => handleTaskStatusChange(task.id, e.target.value)}
                          className="bg-slate-50 text-[10px] font-bold border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer disabled:opacity-50"
                        >
                          <option value="to-do">TO-DO</option>
                          <option value="in-progress">IN PROGRESS</option>
                          <option value="done">DONE</option>
                        </select>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Pending files list */}
          <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col">
            <h3 className="font-bold text-sm text-slate-800 mb-3 flex items-center gap-1.5">
              <FileText className="h-4.5 w-4.5 text-blue-900" />
              Active Pending File Queue
            </h3>
            
            <div className="flex-1 overflow-y-auto space-y-3 max-h-72">
              {pendingFiles.length === 0 ? (
                <div className="text-center text-xs text-slate-400 py-12">File inbox is empty. All items disposed!</div>
              ) : (
                pendingFiles.map((file: any) => (
                  <div key={file.id} className="p-3.5 bg-white border border-slate-200 hover:border-slate-300 rounded-xl shadow-sm flex items-center justify-between gap-4">
                    <div>
                      <Link href={`/files/${file.id}`} className="text-xs font-bold text-slate-800 hover:text-blue-800 hover:underline line-clamp-1">
                        {file.subject}
                      </Link>
                      <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-400">
                        <span>Ref: #{file.id}</span>
                        <span>•</span>
                        <span className={`font-semibold ${
                          file.priority === 'CRITICAL' ? 'text-red-600' : 'text-slate-400'
                        }`}>
                          {file.priority}
                        </span>
                        <span>•</span>
                        <span>{file.category}</span>
                      </div>
                    </div>

                    <Link
                      href={`/files/${file.id}`}
                      className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:underline shrink-0"
                    >
                      Clear File
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Workload Assistance Panel */}
        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5">
                <HeartHandshake className="h-4.5 w-4.5 text-blue-900" />
                Workload Assistance Center
              </h3>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                Manage, review, and dispatch collaborative queue redistribution requests across team colleagues.
              </p>
            </div>
            <div className="flex flex-wrap gap-1 bg-slate-50 border border-slate-200 rounded-xl p-1 text-[10px] font-bold">
              {[
                { key: 'incoming', label: 'Incoming' },
                { key: 'outgoing', label: 'Outgoing' },
                { key: 'accepted', label: 'Accepted' },
                { key: 'declined', label: 'Declined' },
                { key: 'history', label: 'History' }
              ].map(tab => {
                const count = 
                  tab.key === 'incoming' ? (data.workloadEvents?.filter((e: any) => e.currentRecipientId === currentUser?.id && e.status === 'proposed').length || 0) :
                  tab.key === 'outgoing' ? (data.workloadEvents?.filter((e: any) => e.officerId === currentUser?.id && e.status === 'proposed').length || 0) :
                  tab.key === 'accepted' ? (data.workloadEvents?.filter((e: any) => e.reassignedToId === currentUser?.id && e.status === 'auto_executed' && e.officerId !== currentUser?.id).length || 0) :
                  tab.key === 'declined' ? (data.workloadEvents?.filter((e: any) => e.officerId === currentUser?.id && e.declineReasons && e.declineReasons !== '{}').length || 0) :
                  (data.workloadEvents?.filter((e: any) => e.status === 'auto_executed').length || 0);

                return (
                  <button
                    key={tab.key}
                    onClick={() => setWorkloadTab(tab.key as any)}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      workloadTab === tab.key
                        ? 'bg-blue-900 text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {tab.label} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Render Cards by Tab */}
          <div className="space-y-3">
            {(() => {
              const filtered = (data.workloadEvents || []).filter((e: any) => {
                if (workloadTab === 'incoming') return e.currentRecipientId === currentUser?.id && e.status === 'proposed';
                if (workloadTab === 'outgoing') return e.officerId === currentUser?.id && e.status === 'proposed';
                if (workloadTab === 'accepted') return e.reassignedToId === currentUser?.id && e.status === 'auto_executed' && e.officerId !== currentUser?.id;
                if (workloadTab === 'declined') return e.officerId === currentUser?.id && e.declineReasons && e.declineReasons !== '{}';
                return e.status === 'auto_executed';
              });

              if (filtered.length === 0) {
                return <div className="text-center py-10 text-xs text-slate-400 font-medium">No workload requests in this category.</div>;
              }

              return filtered.map((e: any) => {
                let metadata = { effort: 'Medium', priority: 'High', expectedCompletion: '3 Days', project: 'Core Ops' };
                try {
                  if (e.metadataJson) {
                    const parsed = JSON.parse(e.metadataJson);
                    metadata = {
                      effort: parsed.estimatedEffort || 'Medium',
                      priority: parsed.priority || 'High',
                      expectedCompletion: '3 Days',
                      project: parsed.affectedProject || 'Core Ops'
                    };
                  }
                } catch (err) {}

                const fileCount = e.filesReassigned.split(',').length;

                return (
                  <div key={e.id} className="p-4 bg-slate-50 hover:bg-slate-100/50 border border-slate-200 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-slate-800">
                          {workloadTab === 'incoming' ? `From: Officer ${e.officer?.name}` : workloadTab === 'outgoing' ? `Assigned To: Queue Recipient ID #${e.currentRecipientId || 'N/A'}` : `Balancing Event #${e.id}`}
                        </span>
                        <span className="text-[10px] bg-slate-200/80 px-2 py-0.5 rounded text-slate-500 font-bold">
                          {e.officer?.department?.name || 'Department'}
                        </span>
                        <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase ${
                          metadata.priority === 'High' || metadata.priority === 'CRITICAL' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {metadata.priority}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-normal font-medium">
                        Files Requested: <strong className="text-slate-800 font-bold">{fileCount} files</strong> | Target Project: <span className="font-semibold">{metadata.project}</span>
                      </p>
                      <div className="text-[10px] text-slate-400 font-semibold flex flex-wrap gap-x-3 gap-y-1">
                        <span>AI Match Score: <strong className="text-purple-600 font-extrabold">97%</strong></span>
                        <span>•</span>
                        <span>Expected Effort: <strong>{metadata.effort}</strong></span>
                        <span>•</span>
                        <span>Expected Completion: <strong>{metadata.expectedCompletion}</strong></span>
                        {workloadTab === 'declined' && (
                          <>
                            <span>•</span>
                            <span className="text-red-500 italic">Decline Logs: {e.declineReasons}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {workloadTab === 'incoming' && (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleWorkloadRequestAction(e.id, 'accept')}
                          disabled={processingWorkload}
                          className="px-3.5 py-1.5 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-lg text-[10px] shadow-sm transition-all"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => {
                            setActiveWorkloadEventId(e.id);
                            setIsDeclineModalOpen(true);
                          }}
                          disabled={processingWorkload}
                          className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-600 font-bold rounded-lg text-[10px] transition-all"
                        >
                          Decline
                        </button>
                      </div>
                    )}

                    {workloadTab !== 'incoming' && (
                      <div className="text-[10px] font-bold uppercase shrink-0 text-slate-400 bg-slate-200/50 px-2.5 py-1 rounded-lg">
                        {e.status === 'auto_executed' ? 'Completed' : 'Pending Review'}
                      </div>
                    )}
                  </div>
                );
              });
            })()}
          </div>
        </div>

        {/* Decline Reason Modal for Workspace */}
        {isDeclineModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
                <div className="flex items-center gap-2 text-red-800">
                  <AlertCircle className="h-5 w-5" />
                  <span className="font-bold text-base">Decline Workload Assistance</span>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-xs text-slate-500">
                  Declining this request escalates it to the next ranked officer. Select your constraint:
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
                        name="declineReasonText"
                        checked={declineReasonText === reason}
                        onChange={() => setDeclineReasonText(reason)}
                        className="text-blue-900 focus:ring-blue-900"
                      />
                      {reason}
                    </label>
                  ))}
                </div>
                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                  <button
                    onClick={() => setIsDeclineModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => activeWorkloadEventId && handleWorkloadRequestAction(activeWorkloadEventId, 'decline')}
                    disabled={processingWorkload}
                    className="px-4.5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md"
                  >
                    Confirm Decline
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Workspace Toast */}
        {toastMessage && (
          <div className="fixed bottom-5 right-5 bg-slate-900 border border-slate-800 text-white px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 z-50 animate-in fade-in slide-in-from-bottom-5">
            <Sparkles className="h-5 w-5 text-amber-400" />
            <span className="text-xs font-bold">{toastMessage}</span>
          </div>
        )}

        {/* Workload Help Request Modal */}
        {isHelpModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
                <div className="flex items-center gap-2 text-amber-800">
                  <HelpCircle className="h-5 w-5" />
                  <span className="font-bold text-base">Request Workload Support</span>
                </div>
                <button
                  onClick={() => setIsHelpModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {helpSuccess ? (
                <div className="p-8 flex flex-col items-center justify-center text-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-green-50 text-green-600 border border-green-200 flex items-center justify-center">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">Support Request Forwarded</h4>
                  <p className="text-xs text-slate-500">Supervisor notified. Burnout protection rules active.</p>
                </div>
              ) : (
                <form onSubmit={submitHelpRequest} className="p-6 space-y-4">
                  <div className="space-y-1.5">
                    <label htmlFor="help-message" className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                      Message to supervisor
                    </label>
                    <textarea
                      id="help-message"
                      required
                      rows={4}
                      placeholder="Explain your backlog load or help needed..."
                      value={helpMsg}
                      onChange={(e) => setHelpMsg(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                    />
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setIsHelpModalOpen(false)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingHelp}
                      className="flex items-center gap-1.5 px-4.5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md"
                    >
                      {submittingHelp ? (
                        <>
                          <RefreshCw className="h-3 w-3 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        'Request Support'
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Survey Feedback Modal */}
        {isSurveyOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
                <div className="flex items-center gap-2 text-blue-900">
                  <MessageSquare className="h-5 w-5" />
                  <span className="font-bold text-base">Monthly Engagement Survey</span>
                </div>
                <button
                  onClick={() => setIsSurveyOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {surveySuccess ? (
                <div className="p-8 flex flex-col items-center justify-center text-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-green-50 text-green-600 border border-green-200 flex items-center justify-center">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">Feedback Logged Successfully</h4>
                  <p className="text-xs text-slate-500">Recalculating monthly employee engagement index...</p>
                </div>
              ) : (
                <form onSubmit={submitSurvey} className="p-6 space-y-4">
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                      Workload Fairness Score
                    </span>
                    <div className="flex items-center gap-2.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setSurveyRating(star)}
                          className="p-1 text-amber-400 hover:scale-110 transition-transform"
                        >
                          <Star className={`h-8 w-8 ${star <= surveyRating ? 'fill-amber-400' : 'text-slate-300'}`} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="survey-comment" className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                      Survey Comments / Feedback
                    </label>
                    <textarea
                      id="survey-comment"
                      rows={3}
                      placeholder="Comment on workload distribution, equipment, or operational blockers..."
                      value={surveyComment}
                      onChange={(e) => setSurveyComment(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    />
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setIsSurveyOpen(false)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingSurvey}
                      className="flex items-center gap-1.5 px-4.5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-md"
                    >
                      {submittingSurvey ? (
                        <>
                          <RefreshCw className="h-3 w-3 animate-spin" />
                          Logging...
                        </>
                      ) : (
                        'Submit Survey'
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
