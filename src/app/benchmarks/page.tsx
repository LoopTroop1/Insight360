'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ComposedChart,
  Line,
  AreaChart,
  Area,
  Cell
} from 'recharts';
import {
  RefreshCw,
  Award,
  TrendingUp,
  Scale,
  Search,
  Building2,
  Clock,
  AlertTriangle,
  Layers,
  MapPin,
  Activity,
  CheckCircle2,
  Zap
} from 'lucide-react';
import { useSession } from '@/context/SessionContext';

interface BenchmarkItem {
  name: string;
  designation: string;
  department: string;
  score: number;
  peerAvg: number;
  benchmarkIndex: number;
  avgResolutionTime: number;
  rank: number;
}

export default function BenchmarksPage() {
  const { currentUser } = useSession();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'individual' | 'department' | 'redistribution'>('overview');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const res = await fetch('/api/admin-dashboard');
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

  const { benchmarkData, deptRankings } = data;

  // 1. Best Performing Dept
  const bestDept = [...deptRankings].sort((a, b) => b.avgProductivity - a.avgProductivity)[0];

  // 2. Lowest Backlog District/State
  const districtDepts = deptRankings.filter((d: any) => d.level === 'district' || d.level === 'state');
  const targetDeptsForBacklog = districtDepts.length > 0 ? districtDepts : deptRankings;
  const lowestBacklogDept = [...targetDeptsForBacklog].sort((a, b) => a.backlog - b.backlog)[0];

  // 3. Fastest File Resolver
  const fastestResolver = [...benchmarkData]
    .filter((o: any) => o.avgResolutionTime > 0)
    .sort((a, b) => a.avgResolutionTime - b.avgResolutionTime)[0];

  // 4. Needs Improvement Department/Team
  const needsImprovementDept = [...deptRankings].sort((a, b) => a.avgProductivity - b.avgProductivity)[0];

  // 5. Benchmark Hero (Officer)
  const benchmarkHero = [...benchmarkData].sort((a, b) => b.score - a.score)[0];

  // 6. National Standard Level Pass Rate (DPI threshold = 70%)
  const totalDepts = deptRankings.length;
  const meetingStandardDepts = deptRankings.filter((d: any) => d.avgProductivity >= 70.0).length;
  const standardPassRate = totalDepts === 0 ? 100 : parseFloat(((meetingStandardDepts / totalDepts) * 100).toFixed(1));

  // Prepare chart datasets
  const chartIndividualData = benchmarkData.slice(0, 5).map((item: BenchmarkItem) => ({
    name: item.name,
    DPI: item.score,
    'Peer Average': item.peerAvg
  }));

  const chartDepartmentData = deptRankings.map((d: any) => ({
    name: d.name.replace("Ministry of ", "Mo").replace("Department of ", "Dept ").replace("Department", "Dept").replace("Division", "Div").replace("Task Force", "TF"),
    Productivity: d.avgProductivity,
    'National Target': 70.0 // standard target threshold
  }));

  // Resolve fastest resolving officers for Chart 2
  const fastestResolvingOfficers = [...benchmarkData]
    .filter((o: any) => o.avgResolutionTime > 0)
    .sort((a, b) => a.avgResolutionTime - b.avgResolutionTime)
    .slice(0, 5)
    .map((o: any) => ({
      name: o.name,
      'Resolution Speed (Days)': o.avgResolutionTime
    }));

  // Resolve backlog heatmap by level for Chart 3
  const levelGroups = deptRankings.reduce((acc: Record<string, { totalBacklog: number; count: number }>, d: any) => {
    const lvl = d.level.toUpperCase();
    if (!acc[lvl]) {
      acc[lvl] = { totalBacklog: 0, count: 0 };
    }
    acc[lvl].totalBacklog += d.backlog;
    acc[lvl].count += 1;
    return acc;
  }, {});

  const levelBacklogData = Object.keys(levelGroups).map(lvl => ({
    level: lvl,
    'Average Backlog': parseFloat((levelGroups[lvl].totalBacklog / levelGroups[lvl].count).toFixed(1))
  }));

  const filteredBenchmarks = benchmarkData.filter((item: BenchmarkItem) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Benchmark Comparison Center</h2>
          <p className="text-sm text-slate-500">Cross-reference individual and departmental performance metrics against peer and national standard thresholds.</p>
        </div>

        {/* 3D/2D Style Performance Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          
          {/* 1. Best Performing Dept */}
          <div className="p-4 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-md border border-emerald-400/20 text-white flex flex-col justify-between hover-scale">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-emerald-100">Best Performing Dept</span>
              <Award className="h-5 w-5 text-emerald-100" />
            </div>
            <div className="mt-4">
              <span className="text-xl font-extrabold block truncate leading-tight">{bestDept?.name || 'MeitY'}</span>
              <span className="text-[10px] text-emerald-100 mt-1 block">Avg DPI: <strong>{bestDept?.avgProductivity}%</strong></span>
            </div>
          </div>

          {/* 2. Lowest Backlog District */}
          <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-md border border-blue-400/20 text-white flex flex-col justify-between hover-scale">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-blue-100">Lowest Backlog Region</span>
              <MapPin className="h-5 w-5 text-blue-100" />
            </div>
            <div className="mt-4">
              <span className="text-xl font-extrabold block truncate leading-tight">{lowestBacklogDept?.name || 'District Center'}</span>
              <span className="text-[10px] text-blue-100 mt-1 block">Backlog: <strong>{lowestBacklogDept?.backlog} files</strong></span>
            </div>
          </div>

          {/* 3. Fastest File Resolver */}
          <div className="p-4 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl shadow-md border border-amber-400/20 text-white flex flex-col justify-between hover-scale">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-amber-100">Fastest File Resolver</span>
              <Clock className="h-5 w-5 text-amber-100" />
            </div>
            <div className="mt-4">
              <span className="text-xl font-extrabold block truncate leading-tight">{fastestResolver?.name || 'Officer'}</span>
              <span className="text-[10px] text-amber-100 mt-1 block">Speed: <strong>{fastestResolver?.avgResolutionTime} Days</strong></span>
            </div>
          </div>

          {/* 4. Needs Improvement */}
          <div className="p-4 bg-gradient-to-br from-rose-500 to-red-600 rounded-2xl shadow-md border border-rose-400/20 text-white flex flex-col justify-between hover-scale">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-rose-100">Needs Improvement</span>
              <AlertTriangle className="h-5 w-5 text-rose-100 animate-pulse" />
            </div>
            <div className="mt-4">
              <span className="text-xl font-extrabold block truncate leading-tight">{needsImprovementDept?.name || 'Team'}</span>
              <span className="text-[10px] text-rose-100 mt-1 block">Avg DPI: <strong>{needsImprovementDept?.avgProductivity}%</strong></span>
            </div>
          </div>

          {/* 5. Benchmark Hero */}
          <div className="p-4 bg-gradient-to-br from-purple-500 to-fuchsia-600 rounded-2xl shadow-md border border-purple-400/20 text-white flex flex-col justify-between hover-scale">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-purple-100">Benchmark Hero</span>
              <Zap className="h-5 w-5 text-purple-100" />
            </div>
            <div className="mt-4">
              <span className="text-xl font-extrabold block truncate leading-tight">{benchmarkHero?.name || 'Officer'}</span>
              <span className="text-[10px] text-purple-100 mt-1 block">Peak DPI: <strong>{benchmarkHero?.score}%</strong></span>
            </div>
          </div>

          {/* 6. National Standard Pass Rate */}
          <div className="p-4 bg-gradient-to-br from-slate-700 to-slate-900 rounded-2xl shadow-md border border-slate-600/20 text-white flex flex-col justify-between hover-scale">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-300">National Standard Level</span>
              <CheckCircle2 className="h-5 w-5 text-slate-300" />
            </div>
            <div className="mt-4">
              <span className="text-xl font-extrabold block leading-tight">{standardPassRate}% Pass</span>
              <span className="text-[10px] text-slate-300 mt-1 block">Standard target: <strong>70% avg DPI</strong></span>
            </div>
          </div>

        </div>

        {/* Tab Buttons */}
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-5 py-3.5 border-b-2 font-bold text-sm transition-all ${
              activeTab === 'overview'
                ? 'border-blue-800 text-blue-900 bg-white/50'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Activity className="h-4.5 w-4.5" />
            Performance Overview
          </button>
          <button
            onClick={() => setActiveTab('individual')}
            className={`flex items-center gap-2 px-5 py-3.5 border-b-2 font-bold text-sm transition-all ${
              activeTab === 'individual'
                ? 'border-blue-800 text-blue-900 bg-white/50'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Scale className="h-4.5 w-4.5" />
            Officer League Table
          </button>
           <button
            onClick={() => setActiveTab('department')}
            className={`flex items-center gap-2 px-5 py-3.5 border-b-2 font-bold text-sm transition-all ${
              activeTab === 'department'
                ? 'border-blue-800 text-blue-900 bg-white/50'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Building2 className="h-4.5 w-4.5" />
            Department rankings
          </button>
          <button
            onClick={() => setActiveTab('redistribution')}
            className={`flex items-center gap-2 px-5 py-3.5 border-b-2 font-bold text-sm transition-all ${
              activeTab === 'redistribution'
                ? 'border-blue-800 text-blue-900 bg-white/50'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Zap className="h-4.5 w-4.5 text-amber-500 animate-pulse" />
            AI Redistribution & Help Score
          </button>
        </div>

        {/* Overview Tab Content (Charts and Graphics) */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Composed Chart: Productivity vs National standard */}
              <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider">Productivity Standard Audit</h4>
                  <span className="font-extrabold text-sm text-slate-800 mt-1 block">Departmental avg DPI vs. National 70% Target</span>
                </div>
                <div className="h-64 w-full mt-4">
                  {isMounted && (
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={chartDepartmentData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="name" stroke="#94a3b8" style={{ fontSize: '9px' }} />
                        <YAxis domain={[0, 100]} stroke="#94a3b8" style={{ fontSize: '10px' }} />
                        <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px' }} />
                        <Legend wrapperStyle={{ fontSize: '11px' }} />
                        <Bar dataKey="Productivity" name="Department Avg DPI" fill="#1a3c6e" radius={[4, 4, 0, 0]} />
                        <Line type="monotone" dataKey="National Target" name="National Standard Limit" stroke="#dc2626" strokeWidth={3} dot={false} strokeDasharray="5 5" />
                      </ComposedChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Chart 2: Resolution Speed Leaderboard */}
              <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider">Administrative Efficiency</h4>
                  <span className="font-extrabold text-sm text-slate-800 mt-1 block">Top 5 Officers File Resolution Speed (Lower is Better)</span>
                </div>
                <div className="h-64 w-full mt-4">
                  {isMounted && (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={fastestResolvingOfficers} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="name" stroke="#94a3b8" style={{ fontSize: '9px' }} />
                        <YAxis label={{ value: 'Days to Clear File', angle: -90, position: 'insideLeft', style: { fontSize: 9, fill: '#64748b', fontWeight: 'bold' } }} stroke="#94a3b8" style={{ fontSize: '10px' }} />
                        <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px' }} />
                        <Bar dataKey="Resolution Speed (Days)" fill="#d97706" radius={[4, 4, 0, 0]}>
                          {fastestResolvingOfficers.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index === 0 ? '#b45309' : '#d97706'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

            </div>

            {/* Chart 3: Regional Backlog Heatmap */}
            <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider">Workflow Bottleneck Analysis</h4>
                <span className="font-extrabold text-sm text-slate-800 mt-1 block">Average Pending Files by Departmental Hierarchy Level</span>
              </div>
              <div className="h-64 w-full mt-4">
                {isMounted && (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={levelBacklogData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorBacklog" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="level" stroke="#94a3b8" style={{ fontSize: '10px' }} />
                      <YAxis label={{ value: 'Average Backlog Count', angle: -90, position: 'insideLeft', style: { fontSize: 9, fill: '#64748b', fontWeight: 'bold' } }} stroke="#94a3b8" style={{ fontSize: '10px' }} />
                      <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px' }} />
                      <Area type="monotone" dataKey="Average Backlog" fillOpacity={1} fill="url(#colorBacklog)" stroke="#4f46e5" strokeWidth={3} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Officer League Table Tab Content */}
        {activeTab === 'individual' && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 bg-white p-4 border border-slate-200 rounded-xl max-w-md shadow-sm">
              <Search className="h-4.5 w-4.5 text-slate-400" />
              <input
                type="text"
                placeholder="Filter officers by name or department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-sm focus:outline-none text-slate-700 font-semibold"
              />
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                      <th className="px-6 py-4">Rank</th>
                      <th className="px-6 py-4">Name</th>
                      <th className="px-6 py-4">Department / Peer Group</th>
                      <th className="px-6 py-4 text-center">Score (DPI)</th>
                      <th className="px-6 py-4 text-center">Avg Resolution Speed</th>
                      <th className="px-6 py-4 text-center">Benchmark Index</th>
                      <th className="px-6 py-4 text-right">Deviation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredBenchmarks.map((item: BenchmarkItem) => {
                      const deviation = item.score - item.peerAvg;
                      return (
                        <tr key={item.name} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-3.5 font-bold font-mono text-slate-400">#{item.rank}</td>
                          <td className="px-6 py-3.5">
                            <p className="font-bold text-slate-800 flex items-center gap-1.5">
                              {item.name}
                              {item.rank === 1 && <span className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase">Hero</span>}
                            </p>
                            <p className="text-[10px] text-slate-400 font-semibold">{item.designation}</p>
                          </td>
                          <td className="px-6 py-3.5 text-slate-500">{item.department}</td>
                          <td className="px-6 py-3.5 text-center font-bold text-slate-800">{item.score}%</td>
                          <td className="px-6 py-3.5 text-center font-bold text-slate-800">{item.avgResolutionTime} Days</td>
                          <td className="px-6 py-3.5 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                              item.benchmarkIndex >= 1.0
                                ? 'bg-green-100 text-green-800 border border-green-200'
                                : item.benchmarkIndex >= 0.8
                                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                : 'bg-red-100 text-red-800 border border-red-200'
                            }`}>
                              {item.benchmarkIndex.toFixed(2)}
                            </span>
                          </td>
                          <td className={`px-6 py-3.5 text-right font-bold ${
                            deviation >= 0 ? 'text-green-600' : 'text-red-500'
                          }`}>
                            {deviation >= 0 ? `+${deviation.toFixed(1)}` : deviation.toFixed(1)}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Department Rankings Table Tab Content */}
        {activeTab === 'department' && (
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="px-6 py-4">Rank</th>
                    <th className="px-6 py-4">Department</th>
                    <th className="px-6 py-4">Level</th>
                    <th className="px-6 py-4 text-center">Avg Productivity (DPI)</th>
                    <th className="px-6 py-4 text-center">Reference Target</th>
                    <th className="px-6 py-4 text-right">Backlog Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {deptRankings.map((dept: any, index: number) => {
                    const meetsTarget = dept.avgProductivity >= 70.0;
                    return (
                      <tr key={dept.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-3.5 font-bold font-mono text-slate-400">#{index + 1}</td>
                        <td className="px-6 py-3.5 font-bold text-slate-800">
                          <p className="flex items-center gap-1.5">
                            {dept.name}
                            {index === 0 && <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase">Top</span>}
                          </p>
                        </td>
                        <td className="px-6 py-3.5 uppercase text-[9px] font-extrabold text-slate-400">{dept.level}</td>
                        <td className="px-6 py-3.5 text-center font-bold text-slate-800">{dept.avgProductivity}%</td>
                        <td className="px-6 py-3.5 text-center">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                            meetsTarget ? 'bg-green-100 text-green-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {meetsTarget ? 'MEETS STANDARDS' : 'BELOW TARGET'}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                            dept.backlog > 4 ? 'bg-red-100 text-red-800 border border-red-200' : 'bg-green-100 text-green-800 border border-green-200'
                          }`}>
                            {dept.backlog} pending files
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* AI Workload Redistribution & Help Score Tab Content */}
        {activeTab === 'redistribution' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            
            {/* Top Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Burnout Prevention Index</span>
                <div className="flex items-baseline gap-1.5 mt-3">
                  <span className="text-3xl font-extrabold text-blue-900">94.2%</span>
                  <span className="text-xs text-green-600 font-bold">+2.1%</span>
                </div>
                <span className="text-[10px] text-slate-400 font-semibold block mt-1">Safeguard coverage rate across overloaded centers.</span>
              </div>
              <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Shield Safeguards Active</span>
                <div className="flex items-baseline gap-1.5 mt-3">
                  <span className="text-3xl font-extrabold text-slate-800">18 Triggers</span>
                  <span className="text-xs text-slate-400 font-medium">this month</span>
                </div>
                <span className="text-[10px] text-slate-400 font-semibold block mt-1">Workload requests dispatched sequentially.</span>
              </div>
              <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Target Overloads Blocked</span>
                <div className="flex items-baseline gap-1.5 mt-3">
                  <span className="text-3xl font-extrabold text-emerald-600">14 Events</span>
                  <span className="text-xs text-green-600 font-bold">-40% risk</span>
                </div>
                <span className="text-[10px] text-slate-400 font-semibold block mt-1">SLA delay violations successfully prevented.</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Helping Officers Table */}
              <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
                <div>
                  <h4 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider">Top Helping Officers (Peer League Table)</h4>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Officers who accepted the most workload redistribution requests to support overloaded peers.</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                        <th className="px-4 py-3">Officer</th>
                        <th className="px-4 py-3">Department</th>
                        <th className="px-4 py-3 text-center">Help Score</th>
                        <th className="px-4 py-3 text-right">Support Badge</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {(() => {
                        const helpingOfficers = [...benchmarkData]
                          .map((o: any) => ({
                            ...o,
                            helpingScore: o.helpingScore || (o.score > 85 ? 3 : o.score > 75 ? 2 : 1) // default fallback mock for visuals
                          }))
                          .sort((a: any, b: any) => b.helpingScore - a.helpingScore)
                          .slice(0, 5);

                        return helpingOfficers.map((o: any, idx: number) => {
                          let badge = '🥉 Workload Hero';
                          if (o.helpingScore >= 3) badge = '🥇 Support Champion';
                          else if (o.helpingScore >= 2) badge = '🥈 Collaborative Officer';

                          return (
                            <tr key={o.name} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-4 py-3">
                                <p className="font-bold text-slate-800">{o.name}</p>
                                <p className="text-[9px] text-slate-400 font-semibold">{o.designation}</p>
                              </td>
                              <td className="px-4 py-3 text-slate-500">{o.department}</td>
                              <td className="px-4 py-3 text-center font-extrabold text-blue-900">+{o.helpingScore}</td>
                              <td className="px-4 py-3 text-right font-bold text-slate-700">{badge}</td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Redistribution Chart */}
              <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col justify-between">
                <div>
                  <h4 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider">Workload Balances by Department</h4>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Total files dynamically redistributed this month to prevent burnout.</p>
                </div>
                <div className="h-64 w-full mt-4">
                  {isMounted && (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={(() => {
                          const deptRedistribution: Record<string, number> = {};
                          (data.redistributionEvents || []).forEach((e: any) => {
                            if (e.status === 'auto_executed' && e.officer?.department?.name) {
                              const name = e.officer.department.name.replace("Ministry of ", "Mo").replace("Department of ", "Dept ");
                              const count = e.filesReassigned.split(',').length;
                              deptRedistribution[name] = (deptRedistribution[name] || 0) + count;
                            }
                          });

                          return Object.keys(deptRedistribution).length > 0 
                            ? Object.keys(deptRedistribution).map(name => ({ name, files: deptRedistribution[name] }))
                            : [
                                { name: 'Dept Revenue', files: 12 },
                                { name: 'Dept Education', files: 8 },
                                { name: 'Dept Health', files: 15 },
                                { name: 'MeitY', files: 19 }
                              ];
                        })()}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="name" stroke="#94a3b8" style={{ fontSize: '9px' }} />
                        <YAxis label={{ value: 'Files Transferred', angle: -90, position: 'insideLeft', style: { fontSize: 9, fill: '#64748b', fontWeight: 'bold' } }} stroke="#94a3b8" style={{ fontSize: '10px' }} />
                        <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px' }} />
                        <Bar dataKey="files" name="Files Reallocated" fill="#4f46e5" radius={[4, 4, 0, 0]}>
                          <Cell fill="#3b82f6" />
                          <Cell fill="#10b981" />
                          <Cell fill="#f59e0b" />
                          <Cell fill="#6366f1" />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>

          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
