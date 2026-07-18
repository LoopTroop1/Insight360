'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from '@/context/SessionContext';
import DashboardLayout from '@/components/DashboardLayout';
import {
  Users2,
  TrendingUp,
  AlertTriangle,
  FileText,
  ShieldAlert,
  ArrowRight,
  ShieldCheck,
  Target,
  RefreshCw,
  Clock,
  Sparkles,
  ChevronRight,
  Heart
} from 'lucide-react';

export default function TeamLeaderPage() {
  const { currentUser } = useSession();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actingEventId, setActingEventId] = useState<number | null>(null);

  useEffect(() => {
    fetchTeamData();
  }, [currentUser]);

  async function fetchTeamData() {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/teamlead-dashboard?leaderId=${currentUser.id}`);
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

  const handleApproveShield = async (eventId: number) => {
    if (!currentUser) return;
    setActingEventId(eventId);
    try {
      const res = await fetch('/api/burnout-shield/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          actorId: currentUser.id
        })
      });

      if (res.ok) {
        fetchTeamData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActingEventId(null);
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

  const { department, deptAvgDpi, deptAvgPending, teamMembers, proposedReassignments, deptGoals } = data;

  const pendingShieldCount = proposedReassignments.length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Section Officer Workspace</h2>
          <p className="text-sm text-slate-500">Department: {department?.name} • Team Performance & Burnout Shield Portal</p>
        </div>

        {/* Core summary metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-blue-900"></div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Team Avg DPI</span>
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-900">
                <TrendingUp className="h-4.5 w-4.5" />
              </span>
            </div>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-3xl font-extrabold text-slate-800">{deptAvgDpi}</span>
              <span className="text-xs text-slate-400 font-semibold">%</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-2.5 font-semibold">Average departmental efficiency</p>
          </div>

          <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500"></div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avg Pending Files</span>
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-800">
                <FileText className="h-4.5 w-4.5" />
              </span>
            </div>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-3xl font-extrabold text-slate-800">{deptAvgPending}</span>
              <span className="text-xs text-slate-400 font-semibold">files / officer</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-2.5 font-semibold">Active workload backlog density</p>
          </div>

          <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-600"></div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Department Goals</span>
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800">
                <Target className="h-4.5 w-4.5" />
              </span>
            </div>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-3xl font-extrabold text-slate-800">{deptGoals.length}</span>
              <span className="text-xs text-slate-400 font-semibold">active</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-2.5 font-semibold">Strategic targets for this unit</p>
          </div>

          <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-red-500"></div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Burnout Shield Alerts</span>
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-50 text-red-700 animate-pulse">
                <ShieldAlert className="h-4.5 w-4.5" />
              </span>
            </div>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-3xl font-extrabold text-slate-800">{pendingShieldCount}</span>
              <span className="text-xs text-slate-400 font-semibold">proposals</span>
            </div>
            <p className="text-[10px] text-red-600 mt-2.5 font-bold">Workload balance action required</p>
          </div>
        </div>

        {/* Burnout Shield Proposals Widget */}
        {pendingShieldCount > 0 && (
          <div className="p-5 bg-gradient-to-r from-red-50/45 to-amber-50/15 border border-red-200 rounded-2xl shadow-md space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-red-600 animate-bounce" />
              <h3 className="font-bold text-sm text-slate-800">Workload Shield: AI-driven Reassignment proposals</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {proposedReassignments.map((prop: any) => (
                <div key={prop.id} className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm space-y-3 relative overflow-hidden">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2 text-xs">
                    <span className="font-bold text-slate-800 flex items-center gap-1">
                      <Heart className="h-4 w-4 text-red-500 animate-pulse fill-red-500" />
                      Relieve: {prop.officer.name}
                    </span>
                    <span className="font-mono text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500">
                      Shield proposal #{prop.id}
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
                    <p>
                      <strong>Recommendation</strong>: Reassign <strong>{prop.filesReassigned.split(',').length} pending files</strong> to <strong>{prop.reassignedTo.name}</strong>.
                    </p>
                    <p className="italic bg-slate-50 p-2 rounded text-[11px]">
                      "{prop.triggerReason}"
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => handleApproveShield(prop.id)}
                      disabled={actingEventId === prop.id}
                      className="flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-xs transition-all shadow"
                    >
                      <ShieldCheck className="h-4.5 w-4.5" />
                      Execute Balancing
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Team Members List */}
        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <h3 className="font-bold text-sm text-slate-800 mb-4 flex items-center gap-1.5 border-b border-slate-100 pb-2.5">
            <Users2 className="h-5 w-5 text-blue-900" />
            Your Officer Workforce Directory
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teamMembers.map((member: any) => {
              const risk = member.burnoutRiskLevel;
              return (
                <div key={member.id} className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 shadow-sm transition-all bg-white relative flex flex-col justify-between gap-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={member.avatarUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"}
                        alt={member.name}
                        className="h-10 w-10 rounded-full object-cover border border-slate-200"
                      />
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">{member.name}</h4>
                        <p className="text-[10px] text-slate-400 font-semibold">{member.designation}</p>
                      </div>
                    </div>

                    <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase ${
                      risk === 'HIGH'
                        ? 'bg-rose-100 text-rose-800 border border-rose-200 animate-pulse'
                        : risk === 'MEDIUM'
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : 'bg-green-100 text-green-800 border border-green-200'
                    }`}>
                      {risk} Risk
                    </span>
                  </div>

                  {/* Core indicators */}
                  <div className="grid grid-cols-3 gap-2 text-center text-xs py-2 border-y border-slate-50 font-semibold text-slate-600 bg-slate-50/50 rounded-lg">
                    <div>
                      <span className="text-[9px] text-slate-400 block font-bold">DPI SCORE</span>
                      <span className="font-extrabold text-slate-800">{member.dpi}%</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 block font-bold">PENDING FILES</span>
                      <span className="font-extrabold text-slate-800">{member.pendingFiles}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 block font-bold">OVERDUE</span>
                      <span className="font-extrabold text-slate-800">{member.overdueTasks} tasks</span>
                    </div>
                  </div>

                  {/* Burnout Explainability text */}
                  {risk !== 'LOW' && (
                    <div className="text-[10px] text-slate-500 leading-normal flex items-start gap-1 p-2 rounded bg-amber-50/40 border border-amber-100/50">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <span>{member.burnoutReason}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-end text-[10px] font-bold text-blue-600 hover:text-blue-900 border-t border-slate-50 pt-2">
                    <span className="flex items-center gap-0.5">
                      Review detailed logs
                      <ChevronRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
