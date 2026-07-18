'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from '@/context/SessionContext';
import DashboardLayout from '@/components/DashboardLayout';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  TrendingUp,
  Target,
  AlertTriangle,
  FolderOpen,
  Users2,
  ListTodo,
  Cpu,
  ArrowRight,
  TrendingDown,
  ChevronUp,
  ChevronDown,
  RefreshCw,
  Award,
  CheckCircle,
  XCircle,
  Lightbulb,
  X,
  FileText,
  Clock,
  AlertCircle
} from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  label: string;
  trend?: string;
  trendDir?: 'up' | 'down';
  color: string;
  icon: React.ReactNode;
  onClick?: () => void;
}

function MetricCard({ title, value, label, trend, trendDir, color, icon, onClick }: MetricCardProps) {
  return (
    <div 
      onClick={onClick}
      className={`p-5 bg-white border border-slate-200 rounded-2xl shadow-sm relative overflow-hidden hover-scale ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className={`absolute top-0 left-0 right-0 h-1 ${color}`}></div>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{title}</span>
        <span className={`flex h-7 w-7 items-center justify-center rounded-lg bg-slate-50 text-slate-700`}>
          {icon}
        </span>
      </div>
      <div className="mt-4 flex items-baseline gap-1">
        <span className="text-3xl font-extrabold text-slate-800">{value}</span>
        <span className="text-xs text-slate-400 font-semibold">{label}</span>
      </div>
      {(trend || trendDir) && (
        <div className="mt-2 text-[10px] text-slate-500 font-bold flex items-center gap-0.5">
          {trendDir === 'up' ? (
            <ChevronUp className="h-3.5 w-3.5 text-green-600" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-red-500" />
          )}
          <span className={trendDir === 'up' ? 'text-green-600' : 'text-red-500'}>{trend}</span>
          <span className="ml-1 text-slate-400 font-medium">vs last month</span>
        </div>
      )}
    </div>
  );
}

export default function SecretaryPage() {
  const { currentUser } = useSession();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actingRecId, setActingRecId] = useState<number | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Drilldown states
  const [drilldownType, setDrilldownType] = useState<string | null>(null);
  const [drilldownTitle, setDrilldownTitle] = useState<string>('');
  const [drilldownData, setDrilldownData] = useState<any[]>([]);
  const [drilldownLoading, setDrilldownLoading] = useState(false);

  const handleDrilldown = async (type: string, title: string) => {
    if (!currentUser) return;
    setDrilldownType(type);
    setDrilldownTitle(title);
    setDrilldownData([]);
    
    // Local state data metrics (doesn't require fetching)
    if (type === 'departments_at_risk') {
      const atRiskDepts = (dashboardData?.deptRankings || []).filter((d: any) => d.status === 'At Risk');
      setDrilldownData(atRiskDepts);
      return;
    }
    if (type === 'overall_dpi') {
      setDrilldownData(dashboardData?.benchmarkData || []);
      return;
    }
    if (type === 'citizen_score') {
      setDrilldownData(dashboardData?.citizenRecords || []);
      return;
    }

    // Server-fetched data metrics
    setDrilldownLoading(true);
    try {
      if (type === 'pending_files') {
        const res = await fetch('/api/files?all=true&status=pending');
        if (res.ok) {
          const files = await res.json();
          setDrilldownData(files);
        }
      } else if (type === 'goals_on_track' || type === 'completed_goals') {
        const res = await fetch(`/api/goals?userId=${currentUser.id}`);
        if (res.ok) {
          const goals = await res.json();
          const filtered = goals.filter((g: any) => 
            type === 'goals_on_track' ? g.status === 'on_track' : g.status === 'completed'
          );
          setDrilldownData(filtered);
        }
      }
    } catch (err) {
      console.error('Error fetching drilldown details:', err);
    } finally {
      setDrilldownLoading(false);
    }
  };

  useEffect(() => {
    setIsMounted(true);
    fetchDashboardData();
  }, [currentUser]);

  async function fetchDashboardData() {
    try {
      const res = await fetch('/api/admin-dashboard');
      if (res.ok) {
        const data = await res.json();
        setDashboardData(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleRecommendationAction = async (recId: number, status: 'accepted' | 'dismissed') => {
    if (!currentUser) return;
    setActingRecId(recId);
    try {
      const res = await fetch(`/api/ai-recommendations/${recId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          actorId: currentUser.id
        })
      });

      if (res.ok) {
        fetchDashboardData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActingRecId(null);
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

  if (!dashboardData) return null;

  const { metrics, priorities, aiRecommendations, deptRankings } = dashboardData;

  // Split recommendations into High-Confidence Alerts (>0.7) and regular suggestions
  const highConfidenceAlerts = aiRecommendations.filter((r: any) => r.confidenceScore >= 0.8);
  const generalSuggestions = aiRecommendations.filter((r: any) => r.confidenceScore < 0.8);

  // Chart data calculations
  const deptChartData = deptRankings.map((d: any) => ({
    name: d.name.replace("Ministry of ", "Mo").replace("Department of ", "Dept ").replace("Department", "Dept").replace("Division", "Div").replace("Task Force", "TF"),
    DPI: d.avgProductivity,
    Backlog: d.backlog
  }));

  const recGroups = aiRecommendations.reduce((acc: Record<string, number>, rec: any) => {
    const t = rec.type || 'Other';
    acc[t] = (acc[t] || 0) + 1;
    return acc;
  }, {});

  const labelMap: Record<string, string> = {
    delay_risk: 'Delay Risk',
    burnout: 'Burnout Shield',
    rework_risk: 'Rework Risk',
    reassignment: 'Reassignment'
  };

  const recColors: Record<string, string> = {
    delay_risk: '#e11d48',
    burnout: '#d97706',
    rework_risk: '#3b82f6',
    reassignment: '#7c3aed'
  };

  const recChartData = Object.keys(recGroups).map(type => ({
    name: labelMap[type] || type.replace('_', ' ').toUpperCase(),
    value: recGroups[type],
    color: recColors[type] || '#64748b'
  }));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        
        {/* Title */}
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Executive Performance Dashboard</h2>
          <p className="text-sm text-slate-500">Cabinet Secretary View • National Administrative Performance Ledger</p>
        </div>

        {/* Top Metric Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <MetricCard
            title="Overall DPI"
            value={metrics.overallDpi}
            label="/ 100"
            trend="1.8%"
            trendDir="up"
            color="bg-blue-900"
            icon={<TrendingUp className="h-4.5 w-4.5" />}
            onClick={() => handleDrilldown('overall_dpi', 'Overall DPI Performance Ratings')}
          />
          <MetricCard
            title="Goal Completion"
            value={`${metrics.goalCompletionPct}%`}
            label="resolved"
            trend="5.2%"
            trendDir="up"
            color="bg-green-600"
            icon={<Target className="h-4.5 w-4.5" />}
            onClick={() => handleDrilldown('completed_goals', 'Completed Strategic Goals')}
          />
          <MetricCard
            title="Departments At Risk"
            value={metrics.departmentsAtRiskCount}
            label="units"
            trend="Reduced"
            trendDir="up"
            color="bg-red-500"
            icon={<AlertTriangle className="h-4.5 w-4.5 text-red-500" />}
            onClick={() => handleDrilldown('departments_at_risk', 'Departments Currently Flagged At Risk')}
          />
          <MetricCard
            title="Goals On Track"
            value={metrics.goalsOnTrack}
            label="active"
            trend="Stable"
            trendDir="up"
            color="bg-emerald-500"
            icon={<CheckCircle className="h-4.5 w-4.5 text-emerald-600" />}
            onClick={() => handleDrilldown('goals_on_track', 'Active Goals On Track')}
          />
          <MetricCard
            title="Pending Files"
            value={metrics.pendingFilesCount}
            label="in-queue"
            trend="8.1%"
            trendDir="up"
            color="bg-amber-500"
            icon={<FolderOpen className="h-4.5 w-4.5 text-amber-500" />}
            onClick={() => handleDrilldown('pending_files', 'All Organization-Wide Pending Files')}
          />
          <MetricCard
            title="Citizen Score"
            value={metrics.citizenSatisfaction}
            label="/ 5.0"
            trend="0.1"
            trendDir="up"
            color="bg-purple-600"
            icon={<Users2 className="h-4.5 w-4.5 text-purple-600" />}
            onClick={() => handleDrilldown('citizen_score', 'Citizen Impact Service Outcomes')}
          />
        </div>

        {/* Priorities and Rankings Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Priorities List */}
          <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col">
            <h3 className="font-bold text-sm text-slate-800 mb-3.5 flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <ListTodo className="h-4.5 w-4.5 text-slate-500" />
              Today's Priority Ledger
            </h3>
            <div className="flex-1 overflow-y-auto space-y-3 max-h-[300px]">
              {priorities.length === 0 ? (
                <div className="text-center text-xs text-slate-400 py-12">No high priority action items.</div>
              ) : (
                priorities.map((item: any) => (
                  <div key={item.id} className="p-3 bg-rose-50/20 hover:bg-rose-50/40 rounded-xl border border-rose-100/50 flex items-start gap-2.5 text-xs">
                    <span className="mt-0.5 shrink-0 px-1.5 py-0.5 rounded text-[8px] bg-red-100 text-red-800 font-extrabold">
                      {item.type}
                    </span>
                    <span className="font-bold text-slate-700 leading-normal">{item.title}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Department Rankings Table */}
          <div className="lg:col-span-2 p-5 bg-white border border-slate-200 rounded-2xl shadow-sm">
            <h3 className="font-bold text-sm text-slate-800 mb-3.5 flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <Award className="h-4.5 w-4.5 text-blue-900" />
              Department performance Leaderboard
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 font-bold text-slate-500 pb-2">
                    <th className="py-2">Department Name</th>
                    <th className="py-2">Level</th>
                    <th className="py-2 text-center">Avg Productivity</th>
                    <th className="py-2 text-center">File Backlog</th>
                    <th className="py-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {deptRankings.map((dept: any, index: number) => (
                    <tr key={dept.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 font-bold text-slate-800 flex items-center gap-2">
                        <span className="font-mono text-slate-400">#{index + 1}</span>
                        {dept.name}
                      </td>
                      <td className="py-3 uppercase text-[9px] font-extrabold text-slate-400">{dept.level}</td>
                      <td className="py-3 text-center font-bold text-blue-950">{dept.avgProductivity} %</td>
                      <td className="py-3 text-center text-slate-500">{dept.backlog} files</td>
                      <td className="py-3 text-right">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          dept.status === 'Active'
                            ? 'bg-green-100 text-green-800 border border-green-200'
                            : 'bg-red-100 text-red-800 border border-red-200'
                        }`}>
                          {dept.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Visual Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Departmental Avg Productivity Bar Chart */}
          <div className="lg:col-span-2 p-5 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col">
            <h3 className="font-bold text-sm text-slate-800 mb-4 flex items-center gap-1.5 pb-2 border-b border-slate-100">
              <TrendingUp className="h-4.5 w-4.5 text-blue-900" />
              Departmental Productivity (DPI) & Backlog Load
            </h3>
            <div className="h-64 w-full">
              {isMounted && deptRankings.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={deptChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" stroke="#94a3b8" style={{ fontSize: '9px' }} />
                    <YAxis yAxisId="left" domain={[0, 100]} stroke="#94a3b8" style={{ fontSize: '10px' }} />
                    <YAxis yAxisId="right" orientation="right" stroke="#e11d48" style={{ fontSize: '10px' }} />
                    <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px' }} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Bar yAxisId="left" dataKey="DPI" name="Avg DPI (%)" fill="#1e3a8a" radius={[4, 4, 0, 0]} />
                    <Bar yAxisId="right" dataKey="Backlog" name="File Backlog" fill="#e11d48" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-xs text-slate-400 py-20">No rankings data to display.</div>
              )}
            </div>
          </div>
          
          {/* AI Recommendation Types Pie Chart */}
          <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col">
            <h3 className="font-bold text-sm text-slate-800 mb-4 flex items-center gap-1.5 pb-2 border-b border-slate-100">
              <Cpu className="h-4.5 w-4.5 text-purple-600 animate-pulse" />
              AI Recommendation Breakdown
            </h3>
            <div className="h-64 w-full flex items-center justify-center">
              {isMounted && recChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={recChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {recChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [value ? `${value} Alerts` : '', 'Count']} />
                    <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '10px' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-xs text-slate-400 py-20">No active AI alerts to chart.</div>
              )}
            </div>
          </div>
        </div>

        {/* AI Recommendations Panel split */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* AI Urgent Alerts (High Confidence > 0.7) */}
          <div className="p-5 bg-rose-50/15 border border-rose-200 rounded-2xl shadow-sm flex flex-col">
            <h3 className="font-bold text-sm text-slate-800 mb-3.5 flex items-center gap-1.5 border-b border-rose-200/50 pb-2">
              <Cpu className="h-4.5 w-4.5 text-rose-600" />
              AI Decision Center: High Urgency Alerts
            </h3>

            <div className="flex-1 space-y-3 max-h-72 overflow-y-auto pr-1">
              {highConfidenceAlerts.length === 0 ? (
                <div className="text-center text-xs text-slate-400 py-12">No high confidence alerts currently pending.</div>
              ) : (
                highConfidenceAlerts.map((rec: any) => (
                  <div key={rec.id} className="p-4 rounded-xl bg-white border border-rose-100 shadow-sm relative overflow-hidden flex flex-col gap-3">
                    <div className="absolute top-0 left-0 bottom-0 w-1 bg-red-600"></div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase">
                      <span className="text-red-600">{rec.type.replace('_', ' ')}</span>
                      <span>Confidence: {(rec.confidenceScore * 100).toFixed(0)}%</span>
                    </div>
                    <p className="text-xs text-slate-700 leading-normal">{rec.message}</p>
                    <div className="flex items-center justify-end gap-2 border-t border-slate-50 pt-2 shrink-0">
                      <button
                        onClick={() => handleRecommendationAction(rec.id, 'dismissed')}
                        disabled={actingRecId === rec.id}
                        className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold rounded-lg text-[10px] transition-all"
                      >
                        Dismiss
                      </button>
                      <button
                        onClick={() => handleRecommendationAction(rec.id, 'accepted')}
                        disabled={actingRecId === rec.id}
                        className="px-3.5 py-1 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-[10px] transition-all shadow"
                      >
                        Accept Reassignment
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* AI General Suggestions */}
          <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col">
            <h3 className="font-bold text-sm text-slate-800 mb-3.5 flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <Lightbulb className="h-4.5 w-4.5 text-blue-900" />
              AI Decision Center: Optimization Suggestions
            </h3>

            <div className="flex-1 space-y-3 max-h-72 overflow-y-auto pr-1">
              {generalSuggestions.length === 0 ? (
                <div className="text-center text-xs text-slate-400 py-12">No optimization suggestions currently pending.</div>
              ) : (
                generalSuggestions.map((rec: any) => (
                  <div key={rec.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 shadow-sm relative overflow-hidden flex flex-col gap-3">
                    <div className="absolute top-0 left-0 bottom-0 w-1 bg-blue-700"></div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase">
                      <span className="text-blue-800">{rec.type.replace('_', ' ')}</span>
                      <span>Confidence: {(rec.confidenceScore * 100).toFixed(0)}%</span>
                    </div>
                    <p className="text-xs text-slate-700 leading-normal">{rec.message}</p>
                    <div className="flex items-center justify-end gap-2 border-t border-slate-200/20 pt-2 shrink-0">
                      <button
                        onClick={() => handleRecommendationAction(rec.id, 'dismissed')}
                        disabled={actingRecId === rec.id}
                        className="px-3 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-500 font-bold rounded-lg text-[10px] transition-all"
                      >
                        Dismiss
                      </button>
                      <button
                        onClick={() => handleRecommendationAction(rec.id, 'accepted')}
                        disabled={actingRecId === rec.id}
                        className="px-3.5 py-1 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-lg text-[10px] transition-all shadow"
                      >
                        Accept
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* AI Redistribution Monitor (Executive Telemetry) */}
        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Cpu className="h-5 w-5 text-blue-900" />
            <div>
              <h3 className="font-extrabold text-sm text-slate-800">AI Workload Redistribution Monitor</h3>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Real-time status of delegated backlogs, colleague escalations, and automated policy overrides.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Today's Transfers</span>
              <span className="text-xl font-extrabold text-slate-800 mt-1 block">{(dashboardData?.redistributionEvents || []).length}</span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Accepted Requests</span>
              <span className="text-xl font-extrabold text-green-600 mt-1 block">{(dashboardData?.redistributionEvents || []).filter((e: any) => e.status === 'auto_executed' && e.reassignedToId !== null).length}</span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Declined Requests</span>
              <span className="text-xl font-extrabold text-red-500 mt-1 block">
                {(() => {
                  let dCount = 0;
                  (dashboardData?.redistributionEvents || []).forEach((e: any) => {
                    try {
                      if (e.declineReasons && e.declineReasons !== '{}') {
                        dCount += Object.keys(JSON.parse(e.declineReasons)).length;
                      }
                    } catch (err) {}
                  });
                  return dCount;
                })()}
              </span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Pending Requests</span>
              <span className="text-xl font-extrabold text-blue-600 mt-1 block">{(dashboardData?.redistributionEvents || []).filter((e: any) => e.status === 'proposed').length}</span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Policy Fallbacks</span>
              <span className="text-xl font-extrabold text-amber-500 mt-1 block">
                {(dashboardData?.redistributionEvents || []).filter((e: any) => e.status === 'auto_executed' && e.redistributionQueue === '').length}
              </span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Avg Response Speed</span>
              <span className="text-xl font-extrabold text-slate-700 mt-1 block">4.5 Min</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Load Balance Heatmap */}
            <div className="lg:col-span-2 space-y-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Department Load Balance Grid</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {(dashboardData?.deptRankings || []).map((d: any) => {
                  const isCritical = d.backlog > 8;
                  const isWarning = d.backlog > 4;

                  return (
                    <div key={d.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-800 block truncate max-w-[180px]">{d.name}</span>
                        <span className="text-[9px] text-slate-400 font-semibold uppercase">{d.level} level</span>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold block ${
                          isCritical ? 'bg-red-100 text-red-800' : isWarning ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {isCritical ? 'CRITICAL' : isWarning ? 'IMBALANCED' : 'BALANCED'}
                        </span>
                        <span className="text-[9px] text-slate-400 mt-0.5 block font-semibold">{d.backlog} files pending</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* AI Recommendations & Analytics panel */}
            <div className="space-y-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">AI Collaborative Insights</span>
              <div className="p-4 bg-blue-50/50 border border-blue-200/50 rounded-xl space-y-3 text-[11px] leading-relaxed text-slate-700 font-medium">
                <div className="flex items-start gap-2">
                  <Lightbulb className="h-4.5 w-4.5 text-amber-500 shrink-0 mt-0.5" />
                  <p>
                    <strong className="text-blue-900">Revenue Division</strong> has accepted <strong className="text-emerald-600">94%</strong> of redistribution requests.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <Lightbulb className="h-4.5 w-4.5 text-amber-500 shrink-0 mt-0.5" />
                  <p>
                    <strong className="text-blue-900">Education Division</strong> frequently declines workload assistance due to pending board audits.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <Lightbulb className="h-4.5 w-4.5 text-amber-500 shrink-0 mt-0.5" />
                  <p>
                    <strong className="text-blue-900">Health Division</strong> requires <strong className="text-red-600">one additional officer</strong> based on workload simulation.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <Lightbulb className="h-4.5 w-4.5 text-amber-500 shrink-0 mt-0.5" />
                  <p>
                    Officer <strong className="text-purple-700">Alkesh Sharma</strong> is the most collaborative employee this month (+3 accepted support items).
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Drill-down Modal */}
      {drilldownType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4 transition-all duration-300 animate-fade-in">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-slate-200 animate-scale-in">
            
            {/* Header */}
            <div className="relative text-white p-5 flex flex-col justify-between select-none" style={{ background: 'linear-gradient(135deg, #1a3c6e 0%, #1e3a8a 100%)' }}>
              <div className="absolute top-0 left-0 right-0 h-1.5 flex">
                <div className="flex-1 bg-[#FF9933]"></div>
                <div className="flex-1 bg-white"></div>
                <div className="flex-1 bg-[#138808]"></div>
              </div>
              
              <div className="flex justify-between items-center mt-1">
                <div>
                  <h3 className="text-lg font-bold tracking-tight">{drilldownTitle}</h3>
                  <p className="text-xs text-slate-300">Detailed metric ledger records</p>
                </div>
                <button 
                  onClick={() => setDrilldownType(null)}
                  className="p-1.5 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
              {drilldownLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <RefreshCw className="h-8 w-8 animate-spin text-blue-900" />
                  <p className="text-xs text-slate-500 font-semibold">Retrieving matching ledger entries...</p>
                </div>
              ) : drilldownData.length === 0 ? (
                <div className="text-center py-16 text-slate-500 text-xs font-semibold">
                  No records found matching this metric.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  {drilldownType === 'pending_files' && (
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 font-bold text-slate-500 pb-2 bg-slate-100/50">
                          <th className="py-2.5 px-3">File ID & Subject</th>
                          <th className="py-2.5 px-3">Category</th>
                          <th className="py-2.5 px-3 text-center">Priority</th>
                          <th className="py-2.5 px-3">Current Holder</th>
                          <th className="py-2.5 px-3 text-right">SLA Target Due</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium bg-white">
                        {drilldownData.map((file) => {
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

                          return (
                            <tr key={file.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="py-3 px-3">
                                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                                    {fileIdStr}
                                  </span>
                                  {cleanSubject}
                                </div>
                              </td>
                              <td className="py-3 px-3 text-slate-500">{file.category}</td>
                              <td className="py-3 px-3 text-center">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider shrink-0 border ${
                                  priorityLower === 'high' || priorityLower === 'urgent' || priorityLower === 'critical'
                                    ? 'bg-red-50 text-red-600 border-red-200'
                                    : priorityLower === 'medium'
                                    ? 'bg-amber-50 text-amber-600 border-amber-200'
                                    : 'bg-slate-50 text-slate-600 border-slate-200'
                                }`}>
                                  {file.priority}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-slate-700 font-semibold">{file.currentHolder?.name || 'Unassigned'}</td>
                              <td className="py-3 px-3 text-right">
                                <div className="flex flex-col items-end gap-0.5">
                                  <span className={`font-semibold ${isOverdue ? 'text-red-500 font-bold' : 'text-slate-500'}`}>
                                    {dueDate.toLocaleDateString()} {isOverdue && '(Overdue)'}
                                  </span>
                                  <span className="text-[9px] text-slate-400">Recv: {receivedDate.toLocaleDateString()}</span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}

                  {drilldownType === 'overall_dpi' && (
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 font-bold text-slate-500 pb-2 bg-slate-100/50">
                          <th className="py-2.5 px-3">Rank</th>
                          <th className="py-2.5 px-3">Officer Name</th>
                          <th className="py-2.5 px-3">Department</th>
                          <th className="py-2.5 px-3 text-center">Productivity Index (DPI)</th>
                          <th className="py-2.5 px-3 text-right">Benchmark Ratio</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium bg-white">
                        {drilldownData.map((item) => (
                          <tr key={item.name} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-3 px-3 font-mono text-slate-400">#{item.rank}</td>
                            <td className="py-3 px-3 font-bold text-slate-800">
                              <div>{item.name}</div>
                              <div className="text-[10px] text-slate-400 font-medium">{item.designation}</div>
                            </td>
                            <td className="py-3 px-3 text-slate-500">{item.department}</td>
                            <td className="py-3 px-3 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                item.score >= 80 ? 'bg-green-50 text-green-800' : item.score >= 50 ? 'bg-amber-50 text-amber-800' : 'bg-red-50 text-red-800'
                              }`}>
                                {item.score.toFixed(1)} %
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right font-semibold text-slate-600">
                              {item.peerAvg > 0 ? ((item.score / item.peerAvg) * 100).toFixed(0) : 100}% of peer avg
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {(drilldownType === 'goals_on_track' || drilldownType === 'completed_goals') && (
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 font-bold text-slate-500 pb-2 bg-slate-100/50">
                          <th className="py-2.5 px-3">Goal Details</th>
                          <th className="py-2.5 px-3 text-center">Level</th>
                          <th className="py-2.5 px-3">Owner</th>
                          <th className="py-2.5 px-3 text-center">Target Metric</th>
                          <th className="py-2.5 px-3 text-center">Progress %</th>
                          <th className="py-2.5 px-3 text-right">Target Deadline</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium bg-white">
                        {drilldownData.map((goal) => {
                          const progressPct = goal.targetValue === 0 ? 0 : Math.round((goal.currentValue / goal.targetValue) * 100);
                          return (
                            <tr key={goal.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="py-3 px-3 max-w-xs">
                                <div className="font-bold text-slate-800">{goal.title}</div>
                                <div className="text-[10px] text-slate-400 font-normal leading-normal">{goal.description}</div>
                              </td>
                              <td className="py-3 px-3 text-center uppercase text-[9px] font-extrabold text-slate-400">{goal.level}</td>
                              <td className="py-3 px-3 text-slate-700 font-semibold">{goal.ownerName}</td>
                              <td className="py-3 px-3 text-center text-slate-500 font-mono">{goal.targetMetric}</td>
                              <td className="py-3 px-3 text-center">
                                <div className="flex flex-col items-center gap-1">
                                  <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div 
                                      className={`h-full rounded-full ${drilldownType === 'completed_goals' ? 'bg-green-500' : 'bg-blue-600'}`} 
                                      style={{ width: `${progressPct}%` }}
                                    />
                                  </div>
                                  <span className="text-[9px] font-bold text-slate-600">{progressPct}% ({goal.currentValue}/{goal.targetValue})</span>
                                </div>
                              </td>
                              <td className="py-3 px-3 text-right text-slate-600 font-semibold">{new Date(goal.deadline).toLocaleDateString()}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}

                  {drilldownType === 'departments_at_risk' && (
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 font-bold text-slate-500 pb-2 bg-slate-100/50">
                          <th className="py-2.5 px-3">Department Name</th>
                          <th className="py-2.5 px-3 text-center">Level</th>
                          <th className="py-2.5 px-3 text-center">Avg Productivity</th>
                          <th className="py-2.5 px-3 text-center">File Backlog</th>
                          <th className="py-2.5 px-3 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium bg-white">
                        {drilldownData.map((dept) => (
                          <tr key={dept.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-3 px-3 font-bold text-slate-800">{dept.name}</td>
                            <td className="py-3 px-3 text-center uppercase text-[9px] font-extrabold text-slate-400">{dept.level}</td>
                            <td className="py-3 px-3 text-center font-bold text-red-600">{dept.avgProductivity} %</td>
                            <td className="py-3 px-3 text-center text-slate-500">{dept.backlog} files</td>
                            <td className="py-3 px-3 text-right">
                              <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-red-100 text-red-800 border border-red-200">
                                At Risk
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {drilldownType === 'citizen_score' && (
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 font-bold text-slate-500 pb-2 bg-slate-100/50">
                          <th className="py-2.5 px-3">Department Name</th>
                          <th className="py-2.5 px-3 text-center">Citizens Served</th>
                          <th className="py-2.5 px-3 text-center">Avg Wait Time</th>
                          <th className="py-2.5 px-3 text-center">Baseline Wait</th>
                          <th className="py-2.5 px-3 text-right">Service Improvement %</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium bg-white">
                        {drilldownData.map((rec) => (
                          <tr key={rec.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-3 px-3 font-bold text-slate-800">{rec.department?.name || 'Unknown Department'}</td>
                            <td className="py-3 px-3 text-center font-semibold text-slate-700">{rec.citizensServed.toLocaleString()}</td>
                            <td className="py-3 px-3 text-center text-slate-500">{rec.avgWaitDays.toFixed(1)} days</td>
                            <td className="py-3 px-3 text-center text-slate-400">{rec.baselineWaitDays.toFixed(1)} days</td>
                            <td className="py-3 px-3 text-right">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-50 text-green-700 border border-green-200">
                                + {rec.improvementPct.toFixed(1)} %
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
              <span className="text-[10px] text-slate-400 font-semibold uppercase">e-Office Pro Drilldown Engine</span>
              <button 
                onClick={() => setDrilldownType(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-xs transition-all"
              >
                Close Ledger
              </button>
            </div>

          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
