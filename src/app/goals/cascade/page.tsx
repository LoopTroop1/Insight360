'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from '@/context/SessionContext';
import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';
import {
  Target,
  ArrowLeft,
  ChevronRight,
  TrendingUp,
  Award,
  Clock,
  ArrowRight,
  RefreshCw,
  FolderTree
} from 'lucide-react';

interface Goal {
  id: number;
  title: string;
  level: string; // national, state, department, officer
  parentGoalId: number | null;
  ownerType: string;
  ownerId: number;
  targetMetric: string;
  targetValue: number;
  currentValue: number;
  status: string;
  successParameter: string;
  ownerName: string;
}

export default function GoalCascadePage() {
  const { currentUser } = useSession();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGoals();
  }, [currentUser]);

  async function fetchGoals() {
    if (!currentUser) return;
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

  // Render a single goal card node in the tree
  const renderGoalNode = (goal: Goal) => {
    const progress = goal.targetValue > 0 ? (goal.currentValue / goal.targetValue) * 100 : 0;
    const progressFormatted = parseFloat(Math.min(100, progress).toFixed(1));

    let statusColors = 'border-slate-200 bg-white hover:border-slate-300';
    if (goal.status === 'on_track') statusColors = 'border-blue-200 bg-blue-50/10 hover:border-blue-300';
    else if (goal.status === 'at_risk') statusColors = 'border-red-200 bg-red-50/10 hover:border-red-300 animate-pulse';
    else if (goal.status === 'completed') statusColors = 'border-green-200 bg-green-50/10 hover:border-green-300';

    return (
      <div key={goal.id} className={`p-4 rounded-xl border-2 shadow-sm transition-all flex flex-col gap-2.5 max-w-sm w-80 shrink-0 ${statusColors}`}>
        <div>
          <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase ${
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
          <h4 className="text-xs font-bold text-slate-800 mt-1 line-clamp-2">{goal.title}</h4>
        </div>

        <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold border-t border-slate-100 pt-2">
          <span>Owner: {goal.ownerName}</span>
          <span className="font-bold text-slate-700">{goal.currentValue}/{goal.targetValue} {goal.targetMetric}</span>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[9px] font-bold text-slate-500">
            <span>Rollup Progress</span>
            <span>{progressFormatted}%</span>
          </div>
          <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${
                goal.status === 'at_risk' ? 'bg-red-500' : 'bg-blue-900'
              }`}
              style={{ width: `${progressFormatted}%` }}
            ></div>
          </div>
        </div>
      </div>
    );
  };

  // Find child goals recursively
  const getChildren = (parentId: number) => {
    return goals.filter(g => g.parentGoalId === parentId);
  };

  // Get root-level goals (national level or parentGoalId is null)
  const rootGoals = goals.filter(g => g.level === 'national' || !g.parentGoalId);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link
            href="/goals"
            className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="h-4.5 w-4.5" />
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Goal Cascade Ledger</h2>
            <p className="text-sm text-slate-500">Mathematical alignment from individual work tasks to national targets.</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-40">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-900" />
          </div>
        ) : rootGoals.length === 0 ? (
          <div className="text-center text-slate-400 py-20 bg-white border border-slate-200 rounded-2xl">
            <FolderTree className="h-10 w-10 mx-auto text-slate-300 mb-2" />
            <p className="font-semibold text-sm">No cascading goal structures found.</p>
            <p className="text-xs">Create goals with parent references in Goal Management to construct the tree.</p>
          </div>
        ) : (
          /* Tree Visual Container */
          <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-x-auto min-h-[500px]">
            {rootGoals.map((root) => {
              const stateChildren = getChildren(root.id);

              return (
                <div key={root.id} className="space-y-12 mb-16 last:mb-0">
                  {/* Layer 1: National (Root) */}
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Layer 1: Strategic Vision</span>
                    {renderGoalNode(root)}
                  </div>

                  {stateChildren.length > 0 && (
                    <div className="space-y-12">
                      {/* Connection arrows divider */}
                      <div className="flex justify-center h-4 relative">
                        <div className="w-[2px] bg-slate-200 absolute top-[-48px] bottom-0"></div>
                      </div>

                      {/* Layer 2: State Objectives */}
                      <div className="flex justify-center gap-12 flex-wrap relative">
                        {/* Horizontal connecting bridge */}
                        <div className="absolute top-[-24px] left-[15%] right-[15%] h-[2px] bg-slate-200"></div>

                        {stateChildren.map((stateGoal) => {
                          const deptChildren = getChildren(stateGoal.id);

                          return (
                            <div key={stateGoal.id} className="flex flex-col items-center gap-12">
                              {/* Vertical connector to bridge */}
                              <div className="w-[2px] h-6 bg-slate-200 top-[-24px] relative"></div>
                              
                              <div className="flex flex-col items-center">
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Layer 2: State Objective</span>
                                {renderGoalNode(stateGoal)}
                              </div>

                              {deptChildren.length > 0 && (
                                <div className="space-y-12">
                                  {/* Connector to dept level */}
                                  <div className="flex justify-center h-4 relative">
                                    <div className="w-[2px] bg-slate-200 absolute top-[-48px] bottom-0"></div>
                                  </div>

                                  {/* Layer 3: Department Objectives */}
                                  <div className="flex justify-center gap-8 flex-wrap relative">
                                    {/* Bridge */}
                                    <div className="absolute top-[-24px] left-[20%] right-[20%] h-[2px] bg-slate-200"></div>

                                    {deptChildren.map((deptGoal) => {
                                      const officerChildren = getChildren(deptGoal.id);

                                      return (
                                        <div key={deptGoal.id} className="flex flex-col items-center gap-12">
                                          {/* Connector */}
                                          <div className="w-[2px] h-6 bg-slate-200 top-[-24px] relative"></div>

                                          <div className="flex flex-col items-center">
                                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Layer 3: Division Target</span>
                                            {renderGoalNode(deptGoal)}
                                          </div>

                                          {officerChildren.length > 0 && (
                                            <div className="space-y-12">
                                              {/* Connector to officer level */}
                                              <div className="flex justify-center h-4 relative">
                                                <div className="w-[2px] bg-slate-200 absolute top-[-48px] bottom-0"></div>
                                              </div>

                                              {/* Layer 4: Officer Objectives */}
                                              <div className="flex justify-center gap-6 flex-wrap relative">
                                                <div className="absolute top-[-24px] left-[25%] right-[25%] h-[2px] bg-slate-200"></div>

                                                {officerChildren.map((offGoal) => (
                                                  <div key={offGoal.id} className="flex flex-col items-center">
                                                    <div className="w-[2px] h-6 bg-slate-200 top-[-24px] relative"></div>
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Layer 4: Action Target</span>
                                                    {renderGoalNode(offGoal)}
                                                  </div>
                                                ))}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
