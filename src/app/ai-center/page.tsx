'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from '@/context/SessionContext';
import DashboardLayout from '@/components/DashboardLayout';
import {
  Cpu,
  AlertTriangle,
  RefreshCw,
  Sliders,
  Play,
  CheckCircle,
  HelpCircle,
  TrendingUp,
  TrendingDown,
  User,
  ArrowRight,
  ShieldAlert,
  Flame,
  Award,
  Clock,
  Sparkles,
  Users2,
  HeartHandshake
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900 text-white p-4 rounded-xl shadow-xl border border-slate-700 max-w-sm text-xs leading-normal">
        <p className="font-bold text-amber-400">{data.subject}</p>
        <p className="mt-1 font-semibold">Days Delayed: <span className="text-red-400">{data.daysPending} days</span></p>
        <p className="text-slate-400">Date Received: {data.date}</p>
        <div className="mt-2 border-t border-slate-800 pt-2 space-y-1">
          <p className="text-slate-300 font-semibold">Reason for Delay:</p>
          <p className="italic text-slate-400">"{data.reason}"</p>
          {data.employeeReason && data.employeeReason !== 'Routine review queue.' && (
            <p className="text-slate-500 text-[10px]">Justification: "{data.employeeReason}"</p>
          )}
        </div>
      </div>
    );
  }
  return null;
};

interface DelayPrediction {
  id: number;
  subject: string;
  priority: string;
  holderName: string;
  holderDesignation: string;
  departmentName: string;
  daysPending: number;
  slaDays: number;
  riskScore: number;
  riskLevel: string;
  reason: string;
  employeeReason: string;
}

interface SimOfficer {
  id: number;
  name: string;
  designation: string;
  departmentName: string;
  currentDpi: number;
  currentBacklog: number;
  pendingCount: number;
}

export default function AiDecisionCenter() {
  const { currentUser } = useSession();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Government Dashboard Telemetry States
  const [throughputData, setThroughputData] = useState<any[]>([]);
  const [radarData, setRadarData] = useState<any[]>([]);
  const [systemLogs, setSystemLogs] = useState<string[]>([]);

  useEffect(() => {
    // Generate initial files dispatched and received data for 12 hours
    const tempData = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const timeLabel = new Date(now.getTime() - i * 60 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      tempData.push({
        time: timeLabel,
        dispatched: Math.floor(250 + Math.random() * 200),
        received: Math.floor(200 + Math.random() * 200)
      });
    }
    setThroughputData(tempData);

    setRadarData([
      { subject: 'File Clearance', A: 88, fullMark: 100 },
      { subject: 'SLA Timeliness', A: 92, fullMark: 100 },
      { subject: 'Citizen Grievance', A: 85, fullMark: 100 },
      { subject: 'Goal Completion', A: 78, fullMark: 100 },
      { subject: 'Cabinet Audits', A: 95, fullMark: 100 },
    ]);

    setSystemLogs([
      `[${new Date().toLocaleTimeString()}] Secure Aadhaar e-Sign HSM handshake established for SPARROW.`,
      `[${new Date(Date.now() - 4000).toLocaleTimeString()}] Audit Vault chain verified. Block height hash: 0x4fa8...9b3e`,
      `[${new Date(Date.now() - 15000).toLocaleTimeString()}] e-Office File #1042 dispatched to Ministry of Electronics & IT.`,
      `[${new Date(Date.now() - 35000).toLocaleTimeString()}] Burnout Shield: Workload balanced. Reassigned 3 critical files from overloaded Desk Officer.`,
    ]);

    // Live update simulator for real-time telemetry log effect
    const interval = setInterval(() => {
      setThroughputData(prev => {
        const nextTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const newArr = prev.slice(1);
        newArr.push({
          time: nextTime,
          dispatched: Math.floor(250 + Math.random() * 200),
          received: Math.floor(200 + Math.random() * 200)
        });
        return newArr;
      });

      setSystemLogs(prev => {
        const newLog = `[${new Date().toLocaleTimeString()}] System Telemetry: SLA Compliance ${Math.floor(88 + Math.random() * 10)}% | Dispatch Speed ${parseFloat((1.5 + Math.random() * 0.8).toFixed(1))} Days`;
        return [newLog, ...prev.slice(0, 5)];
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Digital Twin Simulator State
  const [simulationMode, setSimulationMode] = useState<'auto' | 'manual'>('auto');
  const [sourceId, setSourceId] = useState('');
  const [targetId, setTargetId] = useState('');
  const [redirectCount, setRedirectCount] = useState(2);
  const [simulating, setSimulating] = useState(false);
  const [simExecuted, setSimExecuted] = useState(false);

  // Active shield events loading state
  const [actingEventId, setActingEventId] = useState<number | null>(null);

  useEffect(() => {
    fetchData();
  }, [currentUser]);

  // Restrict and auto-select matching coworker targets
  useEffect(() => {
    if (!data?.simulatorOfficers) return;
    const simulatorOfficers = data.simulatorOfficers;
    const sourceOfficer = simulatorOfficers.find((o: any) => o.id.toString() === sourceId);
    if (!sourceOfficer) return;

    const matched = simulatorOfficers.filter((o: any) => 
      o.id.toString() !== sourceId && 
      o.departmentName === sourceOfficer.departmentName && 
      o.designation === sourceOfficer.designation
    );

    if (matched.length > 0) {
      if (!matched.some((o: any) => o.id.toString() === targetId)) {
        setTargetId(matched[0].id.toString());
      }
    } else {
      setTargetId('');
    }
  }, [sourceId, data, targetId]);

  // Find the most imbalanced peer pair in the system
  const getMostImbalancedPair = () => {
    if (!data?.simulatorOfficers) return null;
    const officers = data.simulatorOfficers;
    const pairs: Array<{ source: any; target: any; diff: number; recommendedTransfer: number }> = [];

    officers.forEach((o1: any) => {
      officers.forEach((o2: any) => {
        if (
          o1.id !== o2.id &&
          o1.departmentName === o2.departmentName &&
          o1.designation === o2.designation &&
          o1.currentBacklog > o2.currentBacklog
        ) {
          const diff = o1.currentBacklog - o2.currentBacklog;
          const recommendedTransfer = Math.floor(diff / 2);
          if (recommendedTransfer > 0) {
            pairs.push({
              source: o1,
              target: o2,
              diff,
              recommendedTransfer
            });
          }
        }
      });
    });

    // Sort by largest backlog difference first
    pairs.sort((a, b) => b.diff - a.diff);
    return pairs[0] || null;
  };

  // Automatically pick the most imbalanced pair if in auto mode
  useEffect(() => {
    if (simulationMode === 'auto' && data?.simulatorOfficers) {
      const pair = getMostImbalancedPair();
      if (pair) {
        setSourceId(pair.source.id.toString());
        setTargetId(pair.target.id.toString());
        setRedirectCount(pair.recommendedTransfer);
      }
    }
  }, [data, simulationMode]);

  async function fetchData() {
    try {
      const res = await fetch('/api/ai-center');
      if (res.ok) {
        const payload = await res.json();
        setData(payload);
        
        // Default select first two officers if available
        if (payload.simulatorOfficers && payload.simulatorOfficers.length >= 2) {
          // Select Vikram (usually has high backlog) and another officer
          const vikram = payload.simulatorOfficers.find((o: any) => o.name.toLowerCase().includes('vikram'));
          const rajesh = payload.simulatorOfficers.find((o: any) => o.name.toLowerCase().includes('rajesh'));
          
          setSourceId(vikram ? vikram.id.toString() : payload.simulatorOfficers[0].id.toString());
          setTargetId(rajesh ? rajesh.id.toString() : payload.simulatorOfficers[1].id.toString());
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // Handle burnout shield approve
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
        confetti({ particleCount: 50, spread: 40 });
        fetchData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActingEventId(null);
    }
  };

  // Run Simulator Reassignment (Force Transfer - Admin Only)
  const handleExecuteSimReassignment = async () => {
    if (!currentUser || !sourceId || !targetId || redirectCount <= 0) return;
    setSimulating(true);

    try {
      const res = await fetch('/api/burnout-shield/reassign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceUserId: parseInt(sourceId),
          targetUserId: parseInt(targetId),
          filesCount: redirectCount,
          actorId: currentUser.id,
          forceTransfer: true // Force Direct reassignment
        })
      });

      if (res.ok) {
        confetti({
          particleCount: 100,
          spread: 60,
          origin: { y: 0.7 }
        });
        setSimExecuted(true);
        setTimeout(() => {
          setSimExecuted(false);
          fetchData();
        }, 2000);
      } else {
        const errorData = await res.json();
        alert(errorData.error || 'Failed to transfer simulated workload.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSimulating(false);
    }
  };

  // Trigger Collaborative workload request flow
  const handleSendWorkloadRequests = async () => {
    if (!currentUser || !sourceId || redirectCount <= 0) return;
    setSimulating(true);

    try {
      const res = await fetch('/api/burnout-shield/reassign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceUserId: parseInt(sourceId),
          filesCount: redirectCount,
          actorId: currentUser.id,
          forceTransfer: false // Collaborative request flow
        })
      });

      if (res.ok) {
        confetti({
          particleCount: 100,
          spread: 60,
          origin: { y: 0.7 }
        });
        setSimExecuted(true);
        setTimeout(() => {
          setSimExecuted(false);
          fetchData();
        }, 2000);
      } else {
        const errorData = await res.json();
        alert(errorData.error || 'Failed to dispatch collaborative requests.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSimulating(false);
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

  const { fileDelayPredictions, simulatorOfficers, proposedReassignments } = data;

  const sourceOfficer = simulatorOfficers.find((o: any) => o.id.toString() === sourceId);
  const targetOfficer = simulatorOfficers.find((o: any) => o.id.toString() === targetId);

  // Digital Twin Simulation Math
  // Source relieves backlog: DPI rises!
  const currentSourceDpi = sourceOfficer ? sourceOfficer.currentDpi : 70.0;
  const sourceBacklog = sourceOfficer ? sourceOfficer.currentBacklog : 0;
  const sourceProjectedBacklog = Math.max(0, sourceBacklog - redirectCount);
  
  // DPI formula simulated: backlog reduction gives +1.8% DPI per file reassigned
  const sourceProjectedDpi = sourceOfficer 
    ? parseFloat(Math.min(100, currentSourceDpi + (redirectCount * 2.2)).toFixed(1))
    : 70.0;

  // Target receives backlog: DPI might slide if overloaded!
  const currentTargetDpi = targetOfficer ? targetOfficer.currentDpi : 70.0;
  const targetBacklog = targetOfficer ? targetOfficer.currentBacklog : 0;
  const targetProjectedBacklog = targetBacklog + redirectCount;
  
  // Overload penalty: if target backlog exceeds 5 files, they incur delay penalty
  const targetDpiPenalty = targetProjectedBacklog > 5 ? (targetProjectedBacklog - 5) * 1.5 : 0;
  const targetProjectedDpi = targetOfficer
    ? parseFloat(Math.max(30, currentTargetDpi - targetDpiPenalty).toFixed(1))
    : 70.0;

  const isTargetOverloaded = targetProjectedBacklog > 6;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        
        {/* Title */}
        <div>
          <h2 className="text-2xl font-bold text-slate-800 font-extrabold flex items-center gap-2">
            <Cpu className="h-6 w-6 text-blue-900" />
            AI Decision Center
          </h2>
          <p className="text-sm text-slate-500">Delay predictions, explainable machine intelligence reasoning, and workload balancing simulation.</p>
        </div>

        {/* AI Workload Redistribution Engine (Top Section) */}
        <div className="p-6 bg-gradient-to-br from-blue-950 via-slate-900 to-slate-950 rounded-2xl shadow-xl text-slate-100 border border-slate-800 space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3.5">
            <Sparkles className="h-5 w-5 text-blue-400 animate-pulse" />
            <div>
              <h3 className="font-bold text-sm text-white">AI Workload Redistribution Engine</h3>
              <p className="text-[10px] text-slate-400">Collaborative queue redistribution simulation and peer-to-peer delegation routing.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Input selectors */}
            <div className="space-y-4 bg-slate-950/40 p-4 rounded-xl border border-slate-800/80">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Engine Controls</span>
                <span className="text-[9px] bg-blue-900/50 border border-blue-700/50 text-blue-300 font-extrabold px-1.5 py-0.5 rounded uppercase">
                  {simulationMode === 'auto' ? 'AI Auto' : 'Manual'}
                </span>
              </div>

              {/* Mode Selector Toggle */}
              <div className="grid grid-cols-2 p-1 bg-slate-900 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => setSimulationMode('auto')}
                  className={`py-1.5 text-[10px] font-bold rounded-md transition-all ${
                    simulationMode === 'auto'
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  AI Recommendations
                </button>
                <button
                  type="button"
                  onClick={() => setSimulationMode('manual')}
                  className={`py-1.5 text-[10px] font-bold rounded-md transition-all ${
                    simulationMode === 'manual'
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Manual Override
                </button>
              </div>
              
              {/* Source selection */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase block">Relieve Overloaded Officer</label>
                <select
                  value={sourceId}
                  disabled={simulationMode === 'auto'}
                  onChange={(e) => {
                    setSourceId(e.target.value);
                    setRedirectCount(1);
                  }}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs font-bold text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                >
                  {simulatorOfficers.map((o: SimOfficer) => (
                    <option key={o.id} value={o.id}>
                      {o.name} ({o.currentBacklog} files held - DPI: {o.currentDpi})
                    </option>
                  ))}
                </select>
              </div>

              {/* Slider for count */}
              {sourceOfficer && sourceOfficer.currentBacklog > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span className="font-bold">Files to Transfer</span>
                    <span className="font-mono font-bold text-blue-400">{redirectCount} / {sourceOfficer.currentBacklog}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max={sourceOfficer.currentBacklog}
                    step="1"
                    value={redirectCount}
                    disabled={simulationMode === 'auto'}
                    onChange={(e) => setRedirectCount(parseInt(e.target.value))}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500 disabled:opacity-50"
                  />
                </div>
              )}

              {/* Target selection */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase block">Target Recipient Officer</label>
                <select
                  value={targetId}
                  onChange={(e) => setTargetId(e.target.value)}
                  disabled={simulationMode === 'auto' || !targetId}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs font-bold text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                >
                  {simulatorOfficers.filter((o: SimOfficer) => 
                    o.id.toString() !== sourceId &&
                    o.departmentName === sourceOfficer?.departmentName &&
                    o.designation === sourceOfficer?.designation
                  ).length === 0 ? (
                    <option value="">No matching coworkers in same dept/designation</option>
                  ) : (
                    simulatorOfficers
                      .filter((o: SimOfficer) => 
                        o.id.toString() !== sourceId &&
                        o.departmentName === sourceOfficer?.departmentName &&
                        o.designation === sourceOfficer?.designation
                      )
                      .map((o: SimOfficer) => (
                        <option key={o.id} value={o.id}>
                          {o.name} ({o.currentBacklog} files held - DPI: {o.currentDpi})
                        </option>
                      ))
                  )}
                </select>
              </div>

              {/* Suggested Peers & Match Scores */}
              {sourceOfficer && (
                <div className="space-y-1.5 pt-2.5 border-t border-slate-800">
                  <span className="text-[9px] font-bold text-blue-400 uppercase block tracking-wider">Suggested Peers & Match Scores</span>
                  <div className="space-y-1 text-[10px] font-semibold font-mono text-slate-300">
                    {simulatorOfficers.filter((o: SimOfficer) =>
                      o.id.toString() !== sourceId &&
                      o.departmentName === sourceOfficer?.departmentName
                    ).slice(0, 3).map((o: SimOfficer, idx: number) => (
                      <div key={o.id} className="flex justify-between p-1 bg-slate-900/60 rounded border border-slate-800/50">
                        <span>{idx + 1}. {o.name}</span>
                        <span className="text-amber-400">{idx === 0 ? '97.2%' : idx === 1 ? '94.0%' : '88.5%'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Twin Visualization Results */}
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Source projected state */}
              {sourceOfficer && (
                <div className="p-4 bg-slate-950/20 border border-slate-800 rounded-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">{sourceOfficer.name} (Source)</span>
                    <span className="text-[9px] bg-green-500/10 text-green-400 px-2 py-0.5 rounded font-bold">Relieving Load</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-center py-2 border-y border-slate-800 bg-slate-950/20 rounded">
                    <div>
                      <span className="text-[9px] text-slate-500 block">BACKLOG FILES</span>
                      <div className="flex items-center justify-center gap-1.5 mt-0.5">
                        <span className="text-slate-400 line-through text-xs">{sourceBacklog}</span>
                        <ArrowRight className="h-3 w-3 text-slate-400" />
                        <span className="font-bold text-green-400 text-sm">{sourceProjectedBacklog}</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[9px] text-slate-500 block">PROJECTED DPI</span>
                      <div className="flex items-center justify-center gap-1.5 mt-0.5">
                        <span className="text-slate-400 line-through text-xs">{currentSourceDpi}%</span>
                        <ArrowRight className="h-3 w-3 text-slate-400" />
                        <span className="font-bold text-green-400 text-sm">{sourceProjectedDpi}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Target projected state */}
              {targetOfficer && (
                <div className={`p-4 bg-slate-950/20 border rounded-xl space-y-4 ${
                  isTargetOverloaded ? 'border-red-800/80 bg-red-950/5' : 'border-slate-800'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">{targetOfficer.name} (Target)</span>
                    <span className={`text-[9px] px-2 py-0.5 rounded font-bold ${
                      isTargetOverloaded ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-blue-500/10 text-blue-400'
                    }`}>
                      {isTargetOverloaded ? 'Queue Alert!' : 'Receiving Load'}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-center py-2 border-y border-slate-800 bg-slate-950/20 rounded">
                    <div>
                      <span className="text-[9px] text-slate-500 block">BACKLOG FILES</span>
                      <div className="flex items-center justify-center gap-1.5 mt-0.5">
                        <span className="text-slate-400 line-through text-xs">{targetBacklog}</span>
                        <ArrowRight className="h-3 w-3 text-slate-400" />
                        <span className={`font-bold text-sm ${isTargetOverloaded ? 'text-rose-400' : 'text-slate-200'}`}>
                          {targetProjectedBacklog}
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[9px] text-slate-500 block">PROJECTED DPI</span>
                      <div className="flex items-center justify-center gap-1.5 mt-0.5">
                        <span className="text-slate-400 line-through text-xs">{currentTargetDpi}%</span>
                        <ArrowRight className="h-3 w-3 text-slate-400" />
                        <span className={`font-bold text-sm ${isTargetOverloaded ? 'text-rose-400' : 'text-slate-200'}`}>
                          {targetProjectedDpi}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {isTargetOverloaded && (
                    <div className="text-[9px] text-rose-300 leading-normal flex items-start gap-1 p-1.5 bg-red-950/30 rounded border border-red-900/50">
                      <AlertTriangle className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                      <span>Warning: Transfer shifts target backlog above department limits, risking SLA delay.</span>
                    </div>
                  )}
                </div>
              )}
              {!targetOfficer && (
                <div className="p-6 bg-slate-950/10 border border-dashed border-slate-800 rounded-xl flex flex-col items-center justify-center text-center text-slate-500 py-12">
                  <Users2 className="h-8 w-8 text-slate-700 mb-2" />
                  <span className="text-[10px] font-bold uppercase tracking-wider block text-slate-400">No Target Peer Selected</span>
                  <span className="text-[9px] text-slate-500 mt-1 max-w-[200px]">The recipient must belong to the same department and hold the same designation as the source officer.</span>
                </div>
              )}

              {/* Redistribution Impact Metrics Forecast */}
              <div className="p-4 bg-slate-950/40 border border-slate-800 rounded-xl space-y-3.5 lg:col-span-2">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-blue-400 animate-pulse" />
                  <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Redistribution Impact Forecast</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 text-center">
                  <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg">
                    <span className="text-[8px] text-slate-500 block uppercase font-bold">DPI Improvement</span>
                    <span className="text-xs font-extrabold text-emerald-400">+{sourceOfficer ? (redirectCount * 2.2).toFixed(1) : '0.0'}% DPI</span>
                  </div>
                  <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg">
                    <span className="text-[8px] text-slate-500 block uppercase font-bold">Backlog Reduction</span>
                    <span className="text-xs font-extrabold text-blue-400">-{sourceOfficer ? Math.min(100, Math.floor((redirectCount / (sourceBacklog || 1)) * 100)) : '0'}% Backlog</span>
                  </div>
                  <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg">
                    <span className="text-[8px] text-slate-500 block uppercase font-bold">Delay Reduction</span>
                    <span className="text-xs font-extrabold text-amber-400">-2 Days waiting</span>
                  </div>
                  <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg">
                    <span className="text-[8px] text-slate-500 block uppercase font-bold">AI Match Match</span>
                    <span className="text-xs font-extrabold text-purple-400">97.2% Match</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between border-t border-slate-800/80 pt-4 gap-4">
            <div className="text-[10px] text-slate-400 leading-relaxed max-w-xl">
              * AI Redistribution Engine simulates clearing backlogs across coworkers. Pushing "Send Requests" fires collaborative alerts sequentially. "Force Transfer" directly bypasses acceptance logic.
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleSendWorkloadRequests}
                disabled={simulating || simExecuted || sourceBacklog === 0}
                className="flex items-center gap-1.5 px-4.5 py-2.5 bg-blue-600 hover:bg-blue-750 text-white font-bold rounded-xl text-xs transition-all shadow-md disabled:opacity-40"
              >
                {simulating ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    Sending Requests...
                  </>
                ) : simExecuted ? (
                  <>
                    <CheckCircle className="h-3.5 w-3.5 text-green-300" />
                    Requests Dispatched!
                  </>
                ) : (
                  <>
                    <HeartHandshake className="h-4 w-4" />
                    Send Workload Requests
                  </>
                )}
              </button>

              <button
                onClick={handleExecuteSimReassignment}
                disabled={simulating || simExecuted || sourceBacklog === 0 || !targetId}
                className="flex items-center gap-1.5 px-4.5 py-2.5 bg-red-800/80 hover:bg-red-750 text-white font-bold rounded-xl text-xs transition-all shadow-md disabled:opacity-40 border border-red-700/50"
              >
                Force Transfer (Admin Only)
              </button>
            </div>
          </div>
        </div>

        {/* Burnout Shield proposals (Root Administrator list) */}
        {proposedReassignments.length > 0 && (
          <div className="p-5 bg-gradient-to-r from-red-50/45 to-amber-50/15 border border-red-200 rounded-2xl shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
              <ShieldAlert className="h-5 w-5 text-red-600 animate-pulse" />
              Urgent Workload balancing actions (Burnout Shield)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {proposedReassignments.map((prop: any) => (
                <div key={prop.id} className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm space-y-3 relative overflow-hidden flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2 text-xs">
                      <span className="font-bold text-slate-800">Relieve: {prop.officer.name}</span>
                      <span className="font-semibold text-slate-400">Dept: {prop.officer.department?.name}</span>
                    </div>

                    <div className="text-xs text-slate-600 space-y-2 mt-2 leading-relaxed">
                      <p>
                        Transfer <strong>{prop.filesReassigned.split(',').length} files</strong> to <strong>{prop.reassignedTo?.name || 'Matched Colleague (Pending)'}</strong>.
                      </p>
                      <p className="italic bg-slate-50 p-2 rounded text-[11px]">
                        "{prop.triggerReason}"
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 mt-2 shrink-0">
                    <button
                      onClick={() => handleApproveShield(prop.id)}
                      disabled={actingEventId === prop.id}
                      className="flex items-center gap-1 px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-xs transition-all shadow"
                    >
                      {actingEventId === prop.id ? <RefreshCw className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
                      Approve balancing proposal
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Delay Analytics Chart Visualization */}
        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2.5">
              <TrendingUp className="h-5 w-5 text-blue-900" />
              Organizational Delay & Backlog Timeline
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Visual ledger plotting file age and pending delays. Hover over any node to inspect delay rationale and metrics.
            </p>
          </div>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={fileDelayPredictions.map((pred: any) => ({
                  id: pred.id,
                  subject: pred.subject,
                  daysPending: pred.daysPending,
                  reason: pred.reason,
                  employeeReason: pred.employeeReason,
                  date: new Date(Date.now() - (pred.daysPending * 24 * 60 * 60 * 1000)).toLocaleDateString(),
                })).sort((a: any, b: any) => a.daysPending - b.daysPending)}
                margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 10, fill: '#64748b' }} 
                  stroke="#cbd5e1"
                />
                <YAxis 
                  label={{ value: 'Days Delayed', angle: -90, position: 'insideLeft', style: { fontSize: 10, fill: '#64748b', fontWeight: 'bold' } }}
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  stroke="#cbd5e1"
                />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="daysPending" 
                  stroke="#1e3a8a" 
                  strokeWidth={3}
                  activeDot={{ r: 6 }} 
                  dot={{ r: 4, fill: '#1e3a8a', stroke: '#fff', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* e-Office Workflow Telemetry Center */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl space-y-6 text-white">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <Sliders className="h-5 w-5 text-blue-400" />
                <h3 className="font-extrabold text-base tracking-wide">National e-Office & Administrative Telemetry</h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Real-time e-Office file clearance performance, departmental SLA compliance, citizen grievance resolution, and e-Sign sync telemetry.
              </p>
            </div>
            <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-full border border-slate-700/50 text-[10px] font-bold self-start md:self-auto">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-green-400">WORKFLOW TELEMETRY: ACTIVE</span>
            </div>
          </div>

          {/* Infrastructure KPI Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-950/40 border border-slate-800 rounded-2xl flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">File Turnaround Speed</span>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-2xl font-extrabold text-blue-400">1.8 Days</span>
                <span className="text-[9px] text-green-400 font-semibold">SLA Compliant</span>
              </div>
              <div className="w-full bg-slate-800 h-1 rounded-full mt-3 overflow-hidden">
                <div className="bg-blue-500 h-1 rounded-full w-[82%]"></div>
              </div>
            </div>
            
            <div className="p-4 bg-slate-950/40 border border-slate-800 rounded-2xl flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">SLA Compliance Rate</span>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-2xl font-extrabold text-amber-400">92.4%</span>
                <span className="text-[9px] text-slate-400 font-semibold">Target Exceeded</span>
              </div>
              <div className="w-full bg-slate-800 h-1 rounded-full mt-3 overflow-hidden">
                <div className="bg-amber-500 h-1 rounded-full w-[92%]"></div>
              </div>
            </div>

            <div className="p-4 bg-slate-950/40 border border-slate-800 rounded-2xl flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Grievance Clearance</span>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-2xl font-extrabold text-purple-400">88.2%</span>
                <span className="text-[9px] text-slate-400 font-semibold">1,245 cases resolved</span>
              </div>
              <div className="w-full bg-slate-800 h-1 rounded-full mt-3 overflow-hidden">
                <div className="bg-purple-500 h-1 rounded-full w-[88%]"></div>
              </div>
            </div>

            <div className="p-4 bg-slate-950/40 border border-slate-800 rounded-2xl flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">SPARROW Aadhaar e-Signs</span>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-2xl font-extrabold text-emerald-400">Synced</span>
                <span className="text-[9px] text-emerald-400 font-semibold">HSM Secure</span>
              </div>
              <div className="w-full bg-slate-800 h-1 rounded-full mt-3 overflow-hidden">
                <div className="bg-emerald-500 h-1 rounded-full w-[100%]"></div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart 1: Latency & Throughput over time */}
            <div className="lg:col-span-2 p-5 bg-slate-950/20 border border-slate-800 rounded-2xl flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-slate-300 block">Ministerial File Clearance & Dispatch Volume</span>
                <span className="text-[10px] text-slate-500">Compares daily files received against files successfully signed and dispatched</span>
              </div>
              <div className="h-56 w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={throughputData}>
                    <defs>
                      <linearGradient id="colorThroughput" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="time" tick={{ fontSize: 9, fill: '#64748b' }} stroke="#334155" />
                    <YAxis tick={{ fontSize: 9, fill: '#64748b' }} stroke="#334155" />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', fontSize: 11 }} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <Area type="monotone" dataKey="dispatched" name="Files Dispatched" stroke="#3b82f6" fillOpacity={1} fill="url(#colorThroughput)" strokeWidth={2} />
                    <Area type="monotone" dataKey="received" name="Files Received" stroke="#f59e0b" fillOpacity={1} fill="url(#colorLatency)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: System Health Radar */}
            <div className="p-5 bg-slate-950/20 border border-slate-800 rounded-2xl flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-slate-300 block">Ministerial DPI Indicators</span>
                <span className="text-[10px] text-slate-500">Balance of key departmental indicators across the ministry</span>
              </div>
              <div className="h-56 w-full mt-4 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                    <PolarGrid stroke="#334155" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9, fill: '#94a3b8' }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 8, fill: '#475569' }} />
                    <Radar name="Performance Score" dataKey="A" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.4} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', fontSize: 11 }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Live System Logs Console */}
          <div className="p-4 bg-black/60 border border-slate-800 rounded-2xl font-mono text-[10px] text-slate-300 space-y-1.5 max-h-[120px] overflow-y-auto">
            <span className="text-[9px] font-bold text-blue-400 block tracking-wider uppercase mb-1">Live Administrative Event Stream</span>
            {systemLogs.map((log, index) => (
              <div key={index} className="flex gap-2">
                <span className="text-slate-500">{">>>"}</span>
                <span className={log.includes('Failed') || log.includes('Warning') ? 'text-red-400' : log.includes('handshake') || log.includes('verified') || log.includes('dispatched') ? 'text-green-400' : 'text-slate-300'}>
                  {log}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Explainable Delay Risk List */}
        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <h3 className="font-bold text-sm text-slate-800 mb-4 flex items-center gap-1.5 border-b border-slate-100 pb-2.5">
            <Flame className="h-5 w-5 text-red-600" />
            Explainable delay risk predictions
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">File Subject</th>
                  <th className="px-6 py-4">Current Holder</th>
                  <th className="px-6 py-4 text-center">Days Pending</th>
                  <th className="px-6 py-4 text-center">SLA Limit</th>
                  <th className="px-6 py-4 text-center">Delay Risk</th>
                  <th className="px-6 py-4">AI Explainability reason</th>
                  <th className="px-6 py-4">Employee Justification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {fileDelayPredictions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center text-slate-400 py-12">No active pending files found in system.</td>
                  </tr>
                ) : (
                  fileDelayPredictions.map((pred: DelayPrediction) => (
                    <tr key={pred.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-3.5">
                        <span className="font-bold text-slate-800 block">{pred.subject}</span>
                        <span className="text-[10px] text-slate-400">Ref ID: #{pred.id} | Priority: {pred.priority}</span>
                      </td>
                      <td className="px-6 py-3.5">
                        <p className="font-bold">{pred.holderName}</p>
                        <p className="text-[9px] text-slate-400 font-semibold">{pred.holderDesignation} ({pred.departmentName})</p>
                      </td>
                      <td className="px-6 py-3.5 text-center font-bold">{pred.daysPending} days</td>
                      <td className="px-6 py-3.5 text-center text-slate-400">{pred.slaDays} days</td>
                      <td className="px-6 py-3.5 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                          pred.riskLevel === 'HIGH'
                            ? 'bg-rose-100 text-rose-800'
                            : pred.riskLevel === 'MEDIUM'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {(pred.riskScore * 100).toFixed(0)}%
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-xs text-slate-500 italic max-w-sm">
                        "{pred.reason}"
                      </td>
                      <td className="px-6 py-3.5 text-xs text-slate-600 max-w-sm">
                        {pred.employeeReason}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
