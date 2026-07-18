'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from '@/context/SessionContext';
import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';
import {
  Target,
  Plus,
  Filter,
  Eye,
  Sliders,
  Calendar,
  AlertCircle,
  TrendingUp,
  Award,
  CheckCircle,
  X,
  RefreshCw,
  SlidersHorizontal,
  ChevronRight,
  TrendingDown,
  FolderOpen, // For FolderTree fallback or let's import it directly
  Network
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

interface Goal {
  id: number;
  title: string;
  description: string | null;
  level: string; // national, state, department, officer
  parentGoalId: number | null;
  ownerType: string; // individual, department
  ownerId: number;
  targetMetric: string;
  targetValue: number;
  currentValue: number;
  deadline: string;
  status: string; // pending, on_track, at_risk, completed, archived
  successParameter: string;
  ownerName: string;
  totalTasks: number;
  completedTasks: number;
}

const DelayTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900 text-white p-3 rounded-lg shadow-lg border border-slate-700 max-w-xs text-xs leading-normal">
        <p className="font-bold text-amber-400">[{data.type}] {data.fullName}</p>
        <p className="mt-1 font-semibold">Days Delayed: <span className="text-red-400">{data.daysDelayed} days</span></p>
        <p className="text-slate-400">Target SLA Date: {data.date}</p>
        <p className="mt-1.5 text-slate-300 font-medium italic">"{data.reason}"</p>
      </div>
    );
  }
  return null;
};

export default function GoalsPage() {
  const { currentUser, users } = useSession();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [levelFilter, setLevelFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Analytics panel state
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [goalTasks, setGoalTasks] = useState<any[]>([]);
  const [delayData, setDelayData] = useState<any[]>([]);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  // Weights config state
  const [showWeightsConfig, setShowWeightsConfig] = useState(false);
  const [w1, setW1] = useState(0.30); // Completion
  const [w2, setW2] = useState(0.20); // Timeliness
  const [w3, setW3] = useState(0.15); // Quality
  const [w4, setW4] = useState(0.15); // Attendance
  const [w5, setW5] = useState(0.10); // Collaboration
  const [w6, setW6] = useState(0.20); // Delay Penalty
  const [savingWeights, setSavingWeights] = useState(false);

  // Goal creation modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [level, setLevel] = useState('officer');
  const [parentGoalId, setParentGoalId] = useState('');
  const [ownerType, setOwnerType] = useState('individual');
  const [ownerId, setOwnerId] = useState('');
  const [targetMetric, setTargetMetric] = useState('FILES_CLEARED');
  const [targetValue, setTargetValue] = useState('10.0');
  const [deadline, setDeadline] = useState('');
  const [successParameter, setSuccessParameter] = useState('');
  const [submittingGoal, setSubmittingGoal] = useState(false);

  const levels = ["national", "state", "department", "officer"];
  
  useEffect(() => {
    fetchGoals();
    fetchWeights();
  }, [currentUser]);

  async function fetchGoals() {
    if (!currentUser) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/goals?userId=${currentUser.id}`);
      if (res.ok) {
        const data = await res.json();
        setGoals(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchWeights() {
    if (!currentUser || !currentUser.departmentId) return;
    try {
      const res = await fetch(`/api/weights?departmentId=${currentUser.departmentId}`);
      if (res.ok) {
        const data = await res.json();
        if (data) {
          setW1(data.w1);
          setW2(data.w2);
          setW3(data.w3);
          setW4(data.w4);
          setW5(data.w5);
          setW6(data.w6);
        }
      }
    } catch (err) {
      console.error(err);
    }
  }

  const handleSaveWeights = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !currentUser.departmentId) return;

    // Check sum is equal or near 1.0 (w1-w5 sum up to 1.0, w6 is delay penalty)
    const sum = w1 + w2 + w3 + w4 + w5;
    if (Math.abs(sum - 1.0) > 0.01) {
      alert(`Standard weights (w1 + w2 + w3 + w4 + w5) must sum to 1.0 (Currently: ${sum.toFixed(2)}). Please adjust.`);
      return;
    }

    setSavingWeights(true);
    try {
      const res = await fetch('/api/weights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          departmentId: currentUser.departmentId,
          w1, w2, w3, w4, w5, w6,
          actorId: currentUser.id
        })
      });

      if (res.ok) {
        setShowWeightsConfig(false);
        alert('KPI Formula weights successfully configured for your department!');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingWeights(false);
    }
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !title || !ownerId || !deadline || !targetValue) return;

    setSubmittingGoal(true);
    try {
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          level,
          parentGoalId: parentGoalId || null,
          ownerType,
          ownerId: parseInt(ownerId),
          targetMetric,
          targetValue: parseFloat(targetValue),
          deadline,
          successParameter,
          createdById: currentUser.id
        })
      });

      if (res.ok) {
        setTitle('');
        setDescription('');
        setIsCreateModalOpen(false);
        fetchGoals();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingGoal(false);
    }
  };

  const handleOpenAnalytics = async (goal: Goal) => {
    setSelectedGoal(goal);
    setLoadingAnalytics(true);
    setDelayData([]);
    try {
      // 1. Fetch tasks
      const resTasks = await fetch(`/api/tasks?userId=${currentUser?.id}`);
      let filteredTasks: any[] = [];
      if (resTasks.ok) {
        const data = await resTasks.json();
        filteredTasks = data.filter((t: any) => t.goalId === goal.id);
        setGoalTasks(filteredTasks);
      }

      // 2. Fetch files for delay tracking
      let filesUrl = '/api/files?all=true&status=pending';
      if (goal.ownerType === 'individual') {
        filesUrl = `/api/files?userId=${goal.ownerId}&status=pending`;
      }
      
      const resFiles = await fetch(filesUrl);
      let files: any[] = [];
      if (resFiles.ok) {
        files = await resFiles.json();
      }

      // 3. Compile delays from both tasks and files
      const delayItems: any[] = [];
      
      // Add delayed tasks
      filteredTasks.forEach((t: any) => {
        const taskDeadline = new Date(t.deadline);
        if (t.status !== 'done' && taskDeadline < new Date()) {
          const daysDelayed = Math.floor((Date.now() - taskDeadline.getTime()) / (1000 * 60 * 60 * 24));
          if (daysDelayed > 0) {
            delayItems.push({
              name: t.description.length > 25 ? t.description.slice(0, 25) + '...' : t.description,
              fullName: t.description,
              daysDelayed,
              reason: "Pending task resource clearance & dependency resolving.",
              date: taskDeadline.toLocaleDateString(),
              type: 'Task'
            });
          }
        }
      });

      // Add delayed files
      files.forEach((file: any) => {
        const created = new Date(file.createdAt);
        const due = new Date(created.getTime() + file.slaCategoryDays * 24 * 60 * 60 * 1000);
        if (due < new Date()) {
          const daysDelayed = Math.floor((Date.now() - due.getTime()) / (1000 * 60 * 60 * 24));
          if (daysDelayed > 0) {
            delayItems.push({
              name: file.subject.length > 25 ? file.subject.slice(0, 25) + '...' : file.subject,
              fullName: file.subject,
              daysDelayed,
              reason: file.employeeReason || "Processing backlog queue.",
              date: due.toLocaleDateString(),
              type: 'File'
            });
          }
        }
      });

      // Sort by delayed days ascending
      delayItems.sort((a, b) => a.daysDelayed - b.daysDelayed);
      setDelayData(delayItems);
    } catch (err) {
      console.error("Error opening analytics:", err);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const archiveGoal = async (goalId: number) => {
    if (!confirm('Are you sure you want to archive this goal? It will be removed from active lists.') || !currentUser) return;

    try {
      const res = await fetch(`/api/goals/${goalId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'archived',
          actorId: currentUser.id
        })
      });

      if (res.ok) {
        setSelectedGoal(null);
        fetchGoals();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredGoals = goals.filter(g => {
    const matchesLevel = levelFilter ? g.level === levelFilter : true;
    const matchesStatus = statusFilter ? g.status === statusFilter : true;
    return matchesLevel && matchesStatus;
  });

  const isSupervisor = currentUser?.personaType === 'secretary' || currentUser?.personaType === 'teamlead';

  return (
    <DashboardLayout>
      <div className="space-y-6">
        
        {/* Title and top header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Goal & KPI Management</h2>
            <p className="text-sm text-slate-500">Formulate cascading objectives and manage department weight variables.</p>
          </div>
          
          <div className="flex items-center gap-2">
            <Link
              href="/goals/cascade"
              className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl shadow-sm text-xs transition-all"
            >
              <Network className="h-4 w-4 text-slate-500" />
              Goal Cascade Tree
            </Link>

            {isSupervisor && (
              <button
                onClick={() => setShowWeightsConfig(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-xl shadow-sm text-xs transition-all"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Configure Formula Weights
              </button>
            )}
            
            <button
              onClick={() => {
                // Pre-select owner
                setOwnerId(currentUser?.id.toString() || '');
                setDeadline(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)); // 30 days out
                setIsCreateModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-4.5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-xl shadow-md text-xs transition-all"
            >
              <Plus className="h-4.5 w-4.5" />
              Create Objective Goal
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Filters:</span>
          </div>

          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Hierarchy Levels</option>
            <option value="national">National Goals</option>
            <option value="state">State Goals</option>
            <option value="department">Department Goals</option>
            <option value="officer">Officer Goals</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="on_track">On Track</option>
            <option value="at_risk">At Risk</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        {/* Goals table */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-900" />
            </div>
          ) : filteredGoals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-2">
              <Target className="h-10 w-10 text-slate-300" />
              <p className="text-sm font-semibold">No goals found matching criteria.</p>
              <p className="text-xs">Objectives defined at department or individual level will display here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <th className="px-6 py-4.5">Goal Description</th>
                    <th className="px-6 py-4.5">Level</th>
                    <th className="px-6 py-4.5">Owner Entity</th>
                    <th className="px-6 py-4.5">Target Value</th>
                    <th className="px-6 py-4.5">Progress %</th>
                    <th className="px-6 py-4.5">Deadline</th>
                    <th className="px-6 py-4.5">Status</th>
                    <th className="px-6 py-4.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredGoals.map((goal) => {
                    const progress = goal.targetValue > 0 ? (goal.currentValue / goal.targetValue) * 100 : 0;
                    const progressFormatted = parseFloat(Math.min(100, progress).toFixed(1));

                    return (
                      <tr key={goal.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-6 py-4.5 max-w-xs md:max-w-sm">
                          <p className="font-bold text-slate-800 line-clamp-1">{goal.title}</p>
                          <span className="text-[10px] text-slate-400 block mt-1">Success Criteria: {goal.successParameter}</span>
                        </td>
                        <td className="px-6 py-4.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            goal.level === 'national'
                              ? 'bg-purple-100 text-purple-800'
                              : goal.level === 'state'
                              ? 'bg-amber-100 text-amber-800'
                              : goal.level === 'department'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {goal.level}
                          </span>
                        </td>
                        <td className="px-6 py-4.5">
                          <p className="font-bold text-slate-700">{goal.ownerName}</p>
                          <p className="text-[10px] text-slate-400 capitalize">{goal.ownerType} scope</p>
                        </td>
                        <td className="px-6 py-4.5">
                          <span className="font-bold text-slate-700">{goal.currentValue} / {goal.targetValue}</span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">{goal.targetMetric}</span>
                        </td>
                        <td className="px-6 py-4.5">
                          <div className="w-full max-w-[100px] space-y-1">
                            <div className="flex items-center justify-between text-[10px] font-bold text-slate-600">
                              <span>{progressFormatted}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  goal.status === 'at_risk'
                                    ? 'bg-red-500'
                                    : progressFormatted >= 90
                                    ? 'bg-green-500'
                                    : 'bg-blue-600'
                                }`}
                                style={{ width: `${progressFormatted}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4.5 text-xs">
                          <span className="font-semibold text-slate-600">{new Date(goal.deadline).toLocaleDateString()}</span>
                        </td>
                        <td className="px-6 py-4.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            goal.status === 'completed'
                              ? 'bg-green-100 text-green-800 border border-green-200'
                              : goal.status === 'at_risk'
                              ? 'bg-red-100 text-red-800 border border-red-200 animate-pulse'
                              : goal.status === 'on_track'
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : 'bg-slate-100 text-slate-800 border border-slate-200'
                          }`}>
                            {goal.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4.5 text-right">
                          <button
                            onClick={() => handleOpenAnalytics(goal)}
                            className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-900 border border-blue-200 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            Analytics
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Goal Detail Analytics Drawer / Side Modal */}
        {selectedGoal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-end">
            <div className="h-full w-full max-w-xl bg-white border-l border-slate-200 shadow-2xl overflow-y-auto flex flex-col animate-in slide-in-from-right duration-150">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200 shrink-0">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-900" />
                  <span className="font-bold text-base">Goal Analytics Breakdown</span>
                </div>
                <button
                  onClick={() => setSelectedGoal(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 p-6 space-y-6">
                <div>
                  <span className="text-[9px] font-bold text-blue-600 uppercase tracking-widest bg-blue-50 border border-blue-100 px-2 py-0.5 rounded">
                    {selectedGoal.level} level
                  </span>
                  <h3 className="text-lg font-bold text-slate-800 mt-2">{selectedGoal.title}</h3>
                  <p className="text-xs text-slate-500 mt-1">{selectedGoal.description || 'No detailed description.'}</p>
                </div>

                {/* Progress Details Cards */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-center">
                    <span className="text-[10px] text-slate-400 block font-bold">CURRENT VALUE</span>
                    <span className="text-xl font-extrabold text-slate-800">{selectedGoal.currentValue}</span>
                    <span className="text-[9px] text-slate-400 block mt-0.5">{selectedGoal.targetMetric}</span>
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-center">
                    <span className="text-[10px] text-slate-400 block font-bold">TARGET VALUE</span>
                    <span className="text-xl font-extrabold text-slate-800">{selectedGoal.targetValue}</span>
                    <span className="text-[9px] text-slate-400 block mt-0.5">{selectedGoal.targetMetric}</span>
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-center">
                    <span className="text-[10px] text-slate-400 block font-bold">COMPLETION</span>
                    <span className="text-xl font-extrabold text-blue-700">
                      {parseFloat(Math.min(100, (selectedGoal.currentValue / selectedGoal.targetValue) * 100).toFixed(1))}%
                    </span>
                    <span className="text-[9px] text-slate-400 block mt-0.5">Progress Rollup</span>
                  </div>
                </div>

                {/* Simple Recharts chart showing mock progress history */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-700">Accumulated Progress Trend</h4>
                  <div className="h-44 w-full bg-slate-50 border border-slate-100 rounded-xl p-3">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={[
                        { week: 'Wk 1', progress: selectedGoal.currentValue * 0.2 },
                        { week: 'Wk 3', progress: selectedGoal.currentValue * 0.4 },
                        { week: 'Wk 5', progress: selectedGoal.currentValue * 0.7 },
                        { week: 'Wk 7', progress: selectedGoal.currentValue }
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="week" stroke="#94a3b8" style={{ fontSize: '10px' }} />
                        <YAxis domain={[0, selectedGoal.targetValue]} stroke="#94a3b8" style={{ fontSize: '10px' }} />
                        <Tooltip />
                        <Line type="monotone" dataKey="progress" stroke="#1e3a8a" strokeWidth={3} name="Progress" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* SLA Workload Delay Analytics */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-red-600 animate-pulse"></span>
                    SLA Workload Delay Analysis (Tasks & Files)
                  </h4>
                  <div className="h-44 w-full bg-slate-50 border border-slate-100 rounded-xl p-3">
                    {delayData.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-slate-400 text-center text-xs">
                        <CheckCircle className="h-6 w-6 text-green-500 mb-1" />
                        <span>All associated tasks and files are within SLA limits.</span>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={delayData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis dataKey="name" stroke="#94a3b8" style={{ fontSize: '9px' }} tickFormatter={(val) => val && val.length > 12 ? val.slice(0, 10) + '...' : val} />
                          <YAxis label={{ value: 'Days Delayed', angle: -90, position: 'insideLeft', style: { fontSize: '9px', fill: '#94a3b8', fontWeight: 'bold' } }} stroke="#94a3b8" style={{ fontSize: '9px' }} />
                          <Tooltip content={<DelayTooltip />} />
                          <Line 
                            type="monotone" 
                            dataKey="daysDelayed" 
                            stroke="#dc2626" 
                            strokeWidth={2.5} 
                            name="Days Delayed"
                            activeDot={{ r: 6 }} 
                            dot={{ r: 4, fill: '#dc2626', stroke: '#fff', strokeWidth: 2 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                {/* Child rollup objectives if they exist */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-700">Cascading Rollups (Child Objectives)</h4>
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                    {goals.filter(child => child.parentGoalId === selectedGoal.id).length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-400 bg-slate-50/50">
                        No active child objectives linked to this goal.
                      </div>
                    ) : (
                      goals.filter(child => child.parentGoalId === selectedGoal.id).map(child => (
                        <div key={child.id} className="p-3 bg-white flex items-center justify-between text-xs">
                          <div>
                            <p className="font-bold text-slate-700">{child.title}</p>
                            <span className="text-[10px] text-slate-400">Owner: {child.ownerName}</span>
                          </div>
                          <span className="font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-100">
                            {parseFloat(((child.currentValue / child.targetValue) * 100).toFixed(1))}%
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Linked Tasks Board */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-700">Associated Tasks ({selectedGoal.completedTasks} / {selectedGoal.totalTasks} Completed)</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {loadingAnalytics ? (
                      <div className="text-center py-4"><RefreshCw className="h-5 w-5 animate-spin text-slate-400 mx-auto" /></div>
                    ) : goalTasks.length === 0 ? (
                      <div className="text-center text-xs text-slate-400 py-6">No tasks specifically linked to this goal.</div>
                    ) : (
                      goalTasks.map((t: any) => (
                        <div key={t.id} className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/40 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-bold text-slate-700 block">{t.description}</span>
                            <span className="text-[10px] text-slate-400">Deadline: {new Date(t.deadline).toLocaleDateString()}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold ${
                            t.status === 'done' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {t.status.toUpperCase()}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Footer / Delete controls */}
              {isSupervisor && (
                <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
                  <button
                    onClick={() => archiveGoal(selectedGoal.id)}
                    className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-lg text-xs font-bold"
                  >
                    Archive Goal
                  </button>
                  <button
                    onClick={() => setSelectedGoal(null)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold"
                  >
                    Close Panel
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Weights Configuration Panel Modal */}
        {showWeightsConfig && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
                <div className="flex items-center gap-2 text-blue-900">
                  <Sliders className="h-5 w-5" />
                  <span className="font-bold text-base font-bold">Configure KPI Weights (w1-w6)</span>
                </div>
                <button
                  onClick={() => setShowWeightsConfig(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSaveWeights} className="p-6 space-y-4">
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-blue-800 text-xs leading-normal">
                  Configure weights for your department's productivity formula. The coefficients <strong>w1 to w5 must sum to exactly 1.0</strong>. The delay coefficient <strong>w6</strong> is a penalty subtractor.
                </div>

                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                  {/* w1 */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700">w1: Task Completion Rate Weight</span>
                      <span className="font-mono font-bold text-blue-600">{w1.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min="0.0"
                      max="1.0"
                      step="0.05"
                      value={w1}
                      onChange={(e) => setW1(parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-900"
                    />
                  </div>

                  {/* w2 */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700">w2: Timeliness Compliance Weight</span>
                      <span className="font-mono font-bold text-blue-600">{w2.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min="0.0"
                      max="1.0"
                      step="0.05"
                      value={w2}
                      onChange={(e) => setW2(parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-900"
                    />
                  </div>

                  {/* w3 */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700">w3: Quality Score Weight</span>
                      <span className="font-mono font-bold text-blue-600">{w3.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min="0.0"
                      max="1.0"
                      step="0.05"
                      value={w3}
                      onChange={(e) => setW3(parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-900"
                    />
                  </div>

                  {/* w4 */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700">w4: Attendance Score Weight</span>
                      <span className="font-mono font-bold text-blue-600">{w4.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min="0.0"
                      max="1.0"
                      step="0.05"
                      value={w4}
                      onChange={(e) => setW4(parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-900"
                    />
                  </div>

                  {/* w5 */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700">w5: Collaboration Score Weight</span>
                      <span className="font-mono font-bold text-blue-600">{w5.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min="0.0"
                      max="1.0"
                      step="0.05"
                      value={w5}
                      onChange={(e) => setW5(parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-900"
                    />
                  </div>

                  {/* w6 */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700">w6: Overdue Delay Penalty Weight</span>
                      <span className="font-mono font-bold text-rose-600">{w6.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min="0.0"
                      max="1.0"
                      step="0.05"
                      value={w6}
                      onChange={(e) => setW6(parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-rose-600"
                    />
                  </div>
                </div>

                {/* Confirm check */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className={`font-bold ${Math.abs(w1+w2+w3+w4+w5 - 1.0) <= 0.01 ? 'text-green-600' : 'text-red-500'}`}>
                    Sum: {(w1+w2+w3+w4+w5).toFixed(2)} / 1.00
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setShowWeightsConfig(false)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={savingWeights}
                      className="flex items-center gap-1.5 px-4.5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl font-bold shadow-md"
                    >
                      {savingWeights ? <RefreshCw className="h-3 w-3 animate-spin" /> : 'Save Weights'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Goal Creation Modal */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
                <div className="flex items-center gap-2 text-blue-900">
                  <Target className="h-5 w-5" />
                  <span className="font-bold text-base">Formulate New Performance Objective</span>
                </div>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCreateGoal} className="p-6 space-y-4">
                <div className="space-y-1">
                  <label htmlFor="goal-title" className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                    Objective Title
                  </label>
                  <input
                    id="goal-title"
                    type="text"
                    required
                    placeholder="Enter short descriptive title..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white font-bold text-slate-800"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label htmlFor="goal-level" className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                      Hierarchy Level
                    </label>
                    <select
                      id="goal-level"
                      value={level}
                      onChange={(e) => {
                        setLevel(e.target.value);
                        // Adjust default metrics
                        if (e.target.value === 'officer') {
                          setOwnerType('individual');
                        } else {
                          setOwnerType('department');
                        }
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    >
                      {levels.map(l => (
                        <option key={l} value={l}>{l.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="goal-parent" className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                      Parent Goal (For Cascading)
                    </label>
                    <select
                      id="goal-parent"
                      value={parentGoalId}
                      onChange={(e) => setParentGoalId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    >
                      <option value="">No Parent (Root Objective)</option>
                      {goals.map(g => (
                        <option key={g.id} value={g.id}>{g.title} ({g.level.toUpperCase()})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label htmlFor="goal-owner-type" className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                      Owner Type
                    </label>
                    <select
                      id="goal-owner-type"
                      value={ownerType}
                      onChange={(e) => {
                        setOwnerType(e.target.value);
                        setOwnerId('');
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    >
                      <option value="individual">Individual Officer</option>
                      <option value="department">Department / Team</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="goal-owner-id" className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                      Assign To Owner
                    </label>
                    <select
                      id="goal-owner-id"
                      required
                      value={ownerId}
                      onChange={(e) => setOwnerId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white font-semibold"
                    >
                      <option value="" disabled>Select Owner...</option>
                      {ownerType === 'individual' ? (
                        users.map(u => (
                          <option key={u.id} value={u.id}>{u.name} ({u.designation})</option>
                        ))
                      ) : (
                        // Mock departments lookup from users department
                        Array.from(new Set(users.map(u => JSON.stringify(u.department)).filter(d => d))).map(deptStr => {
                          const d = JSON.parse(deptStr);
                          return <option key={d.id} value={d.id}>{d.name}</option>;
                        })
                      )}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label htmlFor="goal-metric" className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                      Target Metric
                    </label>
                    <input
                      id="goal-metric"
                      type="text"
                      required
                      placeholder="e.g. FILES_PROCESSED"
                      value={targetMetric}
                      onChange={(e) => setTargetMetric(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="goal-target" className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                      Target Numerical Value
                    </label>
                    <input
                      id="goal-target"
                      type="number"
                      required
                      step="any"
                      placeholder="100.0"
                      value={targetValue}
                      onChange={(e) => setTargetValue(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label htmlFor="goal-deadline" className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                      Target Deadline
                    </label>
                    <input
                      id="goal-deadline"
                      type="date"
                      required
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="goal-success" className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                      Success Benchmark Parameters
                    </label>
                    <input
                      id="goal-success"
                      type="text"
                      required
                      placeholder="e.g., Turnaround time < 5 days"
                      value={successParameter}
                      onChange={(e) => setSuccessParameter(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingGoal}
                    className="flex items-center gap-1.5 px-4.5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-md disabled:opacity-70"
                  >
                    {submittingGoal ? <RefreshCw className="h-3 w-3 animate-spin" /> : 'Formulate Goal'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
