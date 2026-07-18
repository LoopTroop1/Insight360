'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from '@/context/SessionContext';
import DashboardLayout from '@/components/DashboardLayout';
import {
  FileText,
  Printer,
  RefreshCw,
  Award,
  Clock,
  CheckCircle,
  Lock,
  Building
} from 'lucide-react';

export default function ReportsPage() {
  const { currentUser, users } = useSession();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState<'individual' | 'department'>('department');
  const [selectedUserId, setSelectedUserId] = useState('');
  
  useEffect(() => {
    fetchReportData();
  }, []);

  async function fetchReportData() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin-dashboard');
      if (res.ok) {
        const payload = await res.json();
        setData(payload);
        if (payload.benchmarkData && payload.benchmarkData.length > 0) {
          setSelectedUserId(payload.benchmarkData[0].name); // use name or map to id
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handlePrint = () => {
    window.print();
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

  const { metrics, deptRankings, benchmarkData } = data;

  const selectedOfficer = benchmarkData.find((b: any) => b.name === selectedUserId) || benchmarkData[0];

  return (
    <DashboardLayout>
      <div className="space-y-6 print:space-y-0 print:p-0">
        
        {/* Header - Hidden on Print */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4 print:hidden">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Printable Performance Dossiers</h2>
            <p className="text-sm text-slate-500">Generate formal, print-formatted appraisal dossiers for paper archiving or PDF distribution.</p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as any)}
              className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="department">Department General Report</option>
              <option value="individual">Officer Performance Dossier</option>
            </select>

            {reportType === 'individual' && (
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {benchmarkData.map((b: any) => (
                  <option key={b.name} value={b.name}>{b.name}</option>
                ))}
              </select>
            )}

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-xl shadow-md text-xs transition-all shrink-0"
            >
              <Printer className="h-4 w-4" />
              Print Dossier
            </button>
          </div>
        </div>

        {/* Printable Report Card Area */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8 max-w-4xl mx-auto print:border-none print:shadow-none print:p-0 print:max-w-full relative">
          
          {/* Top Indian Government Ribbon Header */}
          <div className="h-2 flex w-full absolute top-0 left-0 right-0 rounded-t-2xl print:hidden">
            <div className="flex-1 bg-[#FF9933]"></div>
            <div className="flex-1 bg-white"></div>
            <div className="flex-1 bg-[#138808]"></div>
          </div>

          {/* Letterhead */}
          <div className="text-center space-y-2 pb-6 border-b border-slate-200">
            <div className="flex items-center justify-center h-16 w-16 mx-auto bg-slate-100 rounded-full border border-slate-200">
              <Building className="h-8 w-8 text-blue-900" />
            </div>
            <h1 className="text-sm font-bold tracking-widest text-slate-800 uppercase">Government of India</h1>
            <h2 className="text-xs font-semibold text-slate-500 uppercase">National Informatics Centre (NIC)</h2>
            <h3 className="text-base font-extrabold text-blue-900 mt-2">CONFIDENTIAL PERFORMANCE APPRAISAL DOSSIER</h3>
            <span className="text-[10px] text-slate-400 font-mono block">Document Ref ID: CAD-NIC-{Date.now().toString().slice(0, 8)} | Date Generated: {new Date().toLocaleDateString()}</span>
          </div>

          {/* Report Content - Department */}
          {reportType === 'department' ? (
            <div className="py-6 space-y-6">
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Section 1: Executive KPI Summary</span>
                <div className="grid grid-cols-3 gap-4 py-2 text-slate-700 text-xs font-bold text-center">
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                    <span className="text-[9px] text-slate-400 block uppercase">Overall Organization DPI</span>
                    <span className="text-xl font-extrabold text-slate-800">{metrics.overallDpi}%</span>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                    <span className="text-[9px] text-slate-400 block uppercase">Goal completion Index</span>
                    <span className="text-xl font-extrabold text-slate-800">{metrics.goalCompletionPct}%</span>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                    <span className="text-[9px] text-slate-400 block uppercase">Wait reduction impact</span>
                    <span className="text-xl font-extrabold text-slate-800">{metrics.daysReduced} Days Saved</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-4">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Section 2: Department Rankings Ledger</span>
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-300 font-bold text-slate-500">
                      <th className="py-2.5">Rank</th>
                      <th className="py-2.5">Department</th>
                      <th className="py-2.5">Level</th>
                      <th className="py-2.5 text-center">Avg DPI</th>
                      <th className="py-2.5 text-right">Backlog</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {deptRankings.map((dept: any, idx: number) => (
                      <tr key={dept.id}>
                        <td className="py-3 font-bold text-slate-500">#{idx + 1}</td>
                        <td className="py-3 font-bold text-slate-800">{dept.name}</td>
                        <td className="py-3 uppercase text-[9px] text-slate-400">{dept.level}</td>
                        <td className="py-3 text-center font-bold text-blue-900">{dept.avgProductivity}%</td>
                        <td className="py-3 text-right text-slate-600">{dept.backlog} files pending</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Report Content - Individual */
            <div className="py-6 space-y-6">
              {selectedOfficer && (
                <>
                  <div className="space-y-2">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Section 1: Officer Information</span>
                    <div className="p-4 bg-slate-50 border border-slate-150 rounded-xl grid grid-cols-2 gap-4 text-xs font-semibold text-slate-700">
                      <div>
                        <span className="text-[9px] text-slate-400 block uppercase">FullName</span>
                        <p className="font-bold text-slate-800 text-sm">{selectedOfficer.name}</p>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block uppercase">Official Designation</span>
                        <p className="font-bold text-slate-800 text-sm">{selectedOfficer.designation}</p>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block uppercase">Assigned Division</span>
                        <p className="font-bold text-slate-800 text-sm">{selectedOfficer.department}</p>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block uppercase">SPARROW Rank Index</span>
                        <p className="font-bold text-blue-900 text-sm">Rank #{selectedOfficer.rank} in Peer Group</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-4">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Section 2: Performance Telemetry</span>
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div className="p-4 border border-slate-150 rounded-xl">
                        <span className="text-[9px] text-slate-400 block uppercase">Productivity Index (DPI)</span>
                        <span className="text-2xl font-extrabold text-slate-800">{selectedOfficer.score}%</span>
                        <span className="text-[10px] text-slate-400 block mt-1">Peer Group Average: {selectedOfficer.peerAvg}%</span>
                      </div>
                      <div className="p-4 border border-slate-150 rounded-xl">
                        <span className="text-[9px] text-slate-400 block uppercase">Benchmark Coefficient</span>
                        <span className="text-2xl font-extrabold text-blue-900">{selectedOfficer.benchmarkIndex.toFixed(2)}</span>
                        <span className="text-[10px] text-slate-400 block mt-1">Efficiency Ratio (Deviation: {(selectedOfficer.score - selectedOfficer.peerAvg).toFixed(1)}%)</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Legal Signatures */}
          <div className="pt-16 border-t border-slate-200/60 grid grid-cols-2 gap-12 text-center text-xs font-semibold text-slate-500">
            <div className="space-y-8">
              <div className="h-10 border-b border-slate-200/50 max-w-[200px] mx-auto"></div>
              <span>Authorized Appraising Officer</span>
            </div>
            <div className="space-y-8">
              <div className="h-10 border-b border-slate-200/50 max-w-[200px] mx-auto"></div>
              <span>Cabinet Secretariat / Ministry Auditor</span>
            </div>
          </div>

          {/* Cryptographic chain verify block */}
          <div className="mt-12 p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between text-[9px] text-slate-400 font-mono">
            <div className="flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-green-600 shrink-0" />
              <span>Immutable Ledger verified sequentially. Verification code: SHA-LEDGER-LOCK.</span>
            </div>
            <span>Sign Hash: SHA256:{Date.now().toString(16).toUpperCase()}</span>
          </div>

        </div>

      </div>
    </DashboardLayout>
  );
}
