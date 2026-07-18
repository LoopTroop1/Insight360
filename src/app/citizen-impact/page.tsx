'use client';

import React, { useState, useEffect } from 'react';
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
  ArrowLeft,
  RefreshCw,
  Users2,
  Hourglass,
  Percent,
  CheckCircle,
  HelpCircle,
  Activity
} from 'lucide-react';

export default function CitizenImpactPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
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

  const { metrics } = data;

  // Departmental Wait Time & Citizens Served computations
  const deptWaitData = (data.citizenRecords || []).map((r: any) => ({
    name: r.department?.name.replace("Ministry of ", "Mo").replace("Department of ", "Dept ").replace("Department", "Dept").replace("Division", "Div").replace("Center", "Ctr").replace("Task Force", "TF") || `Dept ${r.departmentId}`,
    'Avg Wait Days': r.avgWaitDays,
    'Baseline Wait': r.baselineWaitDays
  }));

  const servedColors = ['#1e3a8a', '#0d9488', '#d97706', '#7c3aed', '#e11d48'];
  const deptServedData = (data.citizenRecords || []).map((r: any, idx: number) => ({
    name: r.department?.name.replace("Ministry of ", "Mo").replace("Department of ", "Dept ").replace("Department", "Dept").replace("Division", "Div").replace("Center", "Ctr").replace("Task Force", "TF") || `Dept ${r.departmentId}`,
    value: r.citizensServed,
    color: servedColors[idx % servedColors.length]
  })).filter((item: any) => item.value > 0);

  // Compile mock historical wait days records for the chart
  const waitTimeHistory = [
    { week: 'Week 1', 'Baseline Wait Days': 8.0, 'Average Wait Days': 7.5 },
    { week: 'Week 3', 'Baseline Wait Days': 8.0, 'Average Wait Days': 6.2 },
    { week: 'Week 5', 'Baseline Wait Days': 8.0, 'Average Wait Days': 5.0 },
    { week: 'Week 7', 'Baseline Wait Days': 8.0, 'Average Wait Days': 4.1 }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        
        {/* Header */}
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Citizen Impact outcomes</h2>
            <p className="text-sm text-slate-500">Track how productivity improvements align with citizens served and turnaround speeds.</p>
          </div>
        </div>

        {/* Highlight Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-blue-900"></div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Citizens Served</span>
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-900">
                <Users2 className="h-4.5 w-4.5" />
              </span>
            </div>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-3xl font-extrabold text-slate-800">{metrics.totalServed.toLocaleString()}</span>
              <span className="text-xs text-slate-400 font-semibold">citizens</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-2.5 font-semibold">Service delivery registry</p>
          </div>

          <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-teal-600"></div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Wait Time Reduction</span>
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-50 text-teal-800">
                <Hourglass className="h-4.5 w-4.5" />
              </span>
            </div>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-3xl font-extrabold text-slate-800">{metrics.daysReduced}</span>
              <span className="text-xs text-slate-400 font-semibold">Days Saved</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-2.5 font-semibold">Average wait time reduction</p>
          </div>

          <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-purple-600"></div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Improvement Rate</span>
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-50 text-purple-800">
                <Percent className="h-4.5 w-4.5" />
              </span>
            </div>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-3xl font-extrabold text-slate-800">{metrics.citizenImprovementPct}%</span>
              <span className="text-xs text-slate-400 font-semibold">faster</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-2.5 font-semibold font-medium">Turnaround delivery acceleration</p>
          </div>
        </div>

        {/* Wait Time Trend Graph */}
        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col">
          <h3 className="font-bold text-sm text-slate-800 mb-4 flex items-center gap-1.5">
            <Activity className="h-4.5 w-4.5 text-blue-900" />
            Wait days reduction ledger trend
          </h3>

          <div className="h-64 w-full">
            {isMounted && (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={waitTimeHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="week" stroke="#94a3b8" style={{ fontSize: '10px' }} />
                  <YAxis domain={[0, 10]} stroke="#94a3b8" style={{ fontSize: '10px' }} />
                  <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px' }} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Line
                    type="monotone"
                    dataKey="Average Wait Days"
                    stroke="#0f766e"
                    strokeWidth={3}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="Baseline Wait Days"
                    stroke="#94a3b8"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Departmental Comparison Visualizations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Departmental Wait Times comparison (Bar Chart) */}
          <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col">
            <h3 className="font-bold text-sm text-slate-800 mb-4 flex items-center gap-1.5">
              <Hourglass className="h-4.5 w-4.5 text-teal-600" />
              Departmental Turnaround Wait Times vs Baselines
            </h3>
            <div className="h-64 w-full">
              {isMounted && deptWaitData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={deptWaitData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" stroke="#94a3b8" style={{ fontSize: '9px' }} />
                    <YAxis domain={[0, 15]} stroke="#94a3b8" style={{ fontSize: '10px' }} />
                    <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px' }} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Bar dataKey="Avg Wait Days" fill="#0f766e" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Baseline Wait" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-xs text-slate-400 py-20">No wait time metrics to display.</div>
              )}
            </div>
          </div>

          {/* Departmental Citizens Served breakdown (Pie Chart) */}
          <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col">
            <h3 className="font-bold text-sm text-slate-800 mb-4 flex items-center gap-1.5">
              <Users2 className="h-4.5 w-4.5 text-blue-900" />
              Citizens Served Share by Department
            </h3>
            <div className="h-64 w-full flex items-center justify-center">
              {isMounted && deptServedData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={deptServedData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {deptServedData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [value ? `${Number(value).toLocaleString()} Citizens` : '', 'Served']} />
                    <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '9px' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-xs text-slate-400 py-20">No citizen statistics to chart.</div>
              )}
            </div>
          </div>
        </div>

        {/* General Disclaimer */}
        <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl text-blue-800 text-xs leading-normal flex items-start gap-2.5">
          <HelpCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
          <p>
            <strong>Analytical Correlation Rule</strong>: Citizen service wait days are dynamically updated based on departmental file resolution rates and backlog parameters. Higher productivity scores (DPI) result in a proportional reduction in civilian wait queues.
          </p>
        </div>

      </div>
    </DashboardLayout>
  );
}
