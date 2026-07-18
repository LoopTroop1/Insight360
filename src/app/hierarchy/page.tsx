'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';
import {
  ArrowLeft,
  ChevronRight,
  ChevronDown,
  Building2,
  FolderOpen,
  Users2,
  RefreshCw,
  AlertTriangle,
  FolderTree,
  Activity,
  Heart
} from 'lucide-react';

interface DeptNode {
  id: number;
  name: string;
  level: string;
  parentDepartmentId: number | null;
  avgProductivity: number;
  backlog: number;
  status: string;
}

export default function HierarchyPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expandedNodes, setExpandedNodes] = useState<Record<number, boolean>>({});

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const res = await fetch('/api/admin-dashboard');
      if (res.ok) {
        const payload = await res.json();
        setData(payload);
        // Pre-expand all root and parent nodes
        const initialExpanded: Record<number, boolean> = {};
        payload.departments.forEach((d: any) => {
          if (d.level === 'national' || d.level === 'state') {
            initialExpanded[d.id] = true;
          }
        });
        setExpandedNodes(initialExpanded);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const toggleExpand = (id: number) => {
    setExpandedNodes(prev => ({ ...prev, [id]: !prev[id] }));
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

  const { deptRankings, departments } = data;

  // Construct Tree nodes
  const getChildren = (parentId: number | null) => {
    return departments.filter((d: any) => d.parentDepartmentId === parentId);
  };

  const ministries = departments.filter((d: any) => d.level === 'national');

  const renderTreeItem = (node: any) => {
    const isExpanded = expandedNodes[node.id] || false;
    const children = getChildren(node.id);
    const hasChildren = children.length > 0;

    // Find performance score from rankings payload
    const rankInfo = deptRankings.find((r: any) => r.id === node.id) || {
      avgProductivity: 72.5,
      backlog: 2,
      status: 'Healthy'
    };

    const isRisk = rankInfo.status !== 'Healthy';

    return (
      <div key={node.id} className="ml-6 border-l border-slate-200 pl-4 py-2 relative">
        <div className="absolute left-[-17px] top-[18px] w-4 h-[2px] bg-slate-200"></div>

        <div className={`p-3 bg-white rounded-xl border flex items-center justify-between gap-4 max-w-2xl ${
          isRisk ? 'border-red-200 bg-red-50/5 hover:bg-red-50/10' : 'border-slate-200 hover:bg-slate-50'
        } shadow-sm transition-all`}>
          
          <div className="flex items-center gap-2">
            {hasChildren && (
              <button
                onClick={() => toggleExpand(node.id)}
                className="p-1 hover:bg-slate-100 rounded text-slate-500"
              >
                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
            )}
            {!hasChildren && <div className="w-6"></div>}

            <Building2 className={`h-4.5 w-4.5 shrink-0 ${isRisk ? 'text-red-500 animate-pulse' : 'text-slate-400'}`} />
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{node.level}</span>
              <span className="text-xs font-bold text-slate-800 leading-normal">{node.name}</span>
            </div>
          </div>

          <div className="flex items-center gap-6 shrink-0 font-semibold text-xs text-slate-600">
            <div className="text-center">
              <span className="text-[9px] text-slate-400 font-bold block">AVG DPI</span>
              <span className={`font-extrabold ${isRisk ? 'text-red-600 font-extrabold' : 'text-blue-900'}`}>{rankInfo.avgProductivity}%</span>
            </div>
            <div className="text-center">
              <span className="text-[9px] text-slate-400 font-bold block">BACKLOG</span>
              <span className="font-extrabold text-slate-700">{rankInfo.backlog} files</span>
            </div>
            <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold ${
              isRisk ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
            }`}>
              {rankInfo.status.toUpperCase()}
            </span>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="mt-1 space-y-1">
            {children.map((child: any) => renderTreeItem(child))}
          </div>
        )}
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        
        {/* Header */}
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Hierarchical Office Explorer</h2>
            <p className="text-sm text-slate-500">Drill down through e-Office organizational blocks to pinpoint operational bottlenecks.</p>
          </div>
        </div>

        {/* Tree Display */}
        <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-x-auto min-h-[500px]">
          <div className="space-y-4">
            {ministries.map((ministry: any) => {
              const isExpanded = expandedNodes[ministry.id] || false;
              const children = getChildren(ministry.id);
              const rankInfo = deptRankings.find((r: any) => r.id === ministry.id) || {
                avgProductivity: 72.5,
                backlog: 2,
                status: 'Healthy'
              };

              return (
                <div key={ministry.id} className="space-y-2">
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-4 max-w-2xl hover:bg-slate-100/70 transition-all shadow-sm">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleExpand(ministry.id)}
                        className="p-1 hover:bg-slate-200 rounded text-slate-500"
                      >
                        {isExpanded ? <ChevronDown className="h-4.5 w-4.5" /> : <ChevronRight className="h-4.5 w-4.5" />}
                      </button>
                      <Building2 className="h-5 w-5 text-blue-900 shrink-0" />
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Cabinet Ministry Level</span>
                        <span className="text-sm font-bold text-slate-800">{ministry.name}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 shrink-0 font-semibold text-xs text-slate-600">
                      <div className="text-center">
                        <span className="text-[9px] text-slate-400 font-bold block">AVG DPI</span>
                        <span className="font-extrabold text-blue-900">{rankInfo.avgProductivity}%</span>
                      </div>
                      <div className="text-center">
                        <span className="text-[9px] text-slate-400 font-bold block">BACKLOG</span>
                        <span className="font-extrabold text-slate-700">{rankInfo.backlog} files</span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[9px] font-extrabold bg-green-100 text-green-800">
                        {rankInfo.status.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {isExpanded && children.map((child: any) => renderTreeItem(child))}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
