'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import {
  ArrowLeft,
  RefreshCw,
  Award,
  TrendingUp,
  BarChart4,
  ArrowUpDown,
  Search,
  Scale
} from 'lucide-react';

interface BenchmarkItem {
  name: string;
  designation: string;
  department: string;
  score: number;
  peerAvg: number;
  benchmarkIndex: number;
  rank: number;
}

export default function BenchmarksPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'individual' | 'department'>('individual');
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

  const filteredBenchmarks = benchmarkData.filter((item: BenchmarkItem) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Prepare chart datasets
  const chartIndividualData = filteredBenchmarks.slice(0, 5).map((item: BenchmarkItem) => ({
    name: item.name,
    DPI: item.score,
    'Peer Average': item.peerAvg
  }));

  const chartDepartmentData = deptRankings.slice(0, 5).map((d: any) => ({
    name: d.name,
    Productivity: d.avgProductivity,
    'Target Average': 75.0 // baseline target index
  }));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        
        {/* Header */}
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Benchmark comparison Center</h2>
            <p className="text-sm text-slate-500">Cross-reference individual and departmental performance metrics against peer thresholds.</p>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab('individual')}
            className={`flex items-center gap-2 px-5 py-3.5 border-b-2 font-bold text-sm transition-all ${
              activeTab === 'individual'
                ? 'border-blue-800 text-blue-900 bg-white/50'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Scale className="h-4 w-4" />
            Officer Peer Comparison
          </button>
          <button
            onClick={() => setActiveTab('department')}
            className={`flex items-center gap-2 px-5 py-3.5 border-b-2 font-bold text-sm transition-all ${
              activeTab === 'department'
                ? 'border-blue-800 text-blue-900 bg-white/50'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <BarChart4 className="h-4 w-4" />
            Departmental Benchmarks
          </button>
        </div>

        {/* Benchmarks Graphic Chart */}
        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col">
          <h3 className="font-bold text-sm text-slate-800 mb-4">
            {activeTab === 'individual' ? 'Top 5 Officer Deviation Analysis' : 'Departmental Average Deviation'}
          </h3>
          <div className="h-64 w-full">
            {isMounted && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={activeTab === 'individual' ? chartIndividualData : chartDepartmentData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" style={{ fontSize: '10px' }} />
                  <YAxis domain={[0, 100]} stroke="#94a3b8" style={{ fontSize: '10px' }} />
                  <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px' }} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar
                    dataKey={activeTab === 'individual' ? 'DPI' : 'Productivity'}
                    fill={activeTab === 'individual' ? '#1e3a8a' : '#0f766e'}
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey={activeTab === 'individual' ? 'Peer Average' : 'Peer Average'}
                    fill="#94a3b8"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Search and Table */}
        {activeTab === 'individual' ? (
          <div className="space-y-4">
            <div className="flex items-center gap-4 bg-white p-4 border border-slate-200 rounded-xl max-w-md">
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
                      <th className="px-6 py-4 text-center">Peer Average</th>
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
                            <p className="font-bold text-slate-800">{item.name}</p>
                            <p className="text-[10px] text-slate-400 font-semibold">{item.designation}</p>
                          </td>
                          <td className="px-6 py-3.5 text-slate-500">{item.department}</td>
                          <td className="px-6 py-3.5 text-center font-bold text-slate-800">{item.score}%</td>
                          <td className="px-6 py-3.5 text-center text-slate-500">{item.peerAvg}%</td>
                          <td className="px-6 py-3.5 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                              item.benchmarkIndex >= 1.0
                                ? 'bg-green-100 text-green-800'
                                : item.benchmarkIndex >= 0.8
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-red-100 text-red-800'
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
        ) : (
          /* Department Tab Table */
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="px-6 py-4">Rank</th>
                    <th className="px-6 py-4">Department</th>
                    <th className="px-6 py-4">Level</th>
                    <th className="px-6 py-4 text-center">Avg Productivity</th>
                    <th className="px-6 py-4 text-center">Reference Target</th>
                    <th className="px-6 py-4 text-right">Backlog Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {deptRankings.map((dept: any, index: number) => {
                    return (
                      <tr key={dept.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-3.5 font-bold font-mono text-slate-400">#{index + 1}</td>
                        <td className="px-6 py-3.5 font-bold text-slate-800">{dept.name}</td>
                        <td className="px-6 py-3.5 uppercase text-[9px] font-extrabold text-slate-400">{dept.level}</td>
                        <td className="px-6 py-3.5 text-center font-bold text-slate-800">{dept.avgProductivity}%</td>
                        <td className="px-6 py-3.5 text-center text-slate-400">75.0%</td>
                        <td className="px-6 py-3.5 text-right">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                            dept.backlog > 4 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
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

      </div>
    </DashboardLayout>
  );
}
