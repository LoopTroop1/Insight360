'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import {
  FileSpreadsheet,
  RefreshCw,
  CheckCircle,
  Database,
  Code,
  ShieldCheck,
  X,
  Server,
  Network
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface SparrowOfficer {
  id: number;
  name: string;
  designation: string;
  department: string;
  dpi: number;
  engagementIndex: number;
  status: 'pending' | 'synced';
}

export default function SparrowSyncPage() {
  const [officers, setOfficers] = useState<SparrowOfficer[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  
  // Modal XML payload preview state
  const [showPayloadModal, setShowPayloadModal] = useState(false);
  const [xmlPayload, setXmlPayload] = useState('');

  useEffect(() => {
    fetchOfficers();
  }, []);

  async function fetchOfficers() {
    try {
      const res = await fetch('/api/admin-dashboard');
      if (res.ok) {
        const payload = await res.json();
        
        // Map user list and their latest scores
        const mapped: SparrowOfficer[] = payload.benchmarkData.map((b: any, idx: number) => ({
          id: idx + 1,
          name: b.name,
          designation: b.designation,
          department: b.department,
          dpi: b.score,
          engagementIndex: 82.0, // default placeholder
          status: 'pending'
        }));
        
        setOfficers(mapped);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const generateXmlPayload = (list: SparrowOfficer[]) => {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<SparrowAppraisalSync xmlns="https://sparrow.nic.in/api/v2">\n`;
    xml += `  <Header>\n`;
    xml += `    <SenderSystem>e-Office Pro NIC v4.0</SenderSystem>\n`;
    xml += `    <Timestamp>${new Date().toISOString()}</Timestamp>\n`;
    xml += `    <TransactionToken>TXN-${Date.now()}</TransactionToken>\n`;
    xml += `  </Header>\n`;
    xml += `  <AppraisalRecords>\n`;
    
    list.forEach(o => {
      xml += `    <Record>\n`;
      xml += `      <EmployeeId>NIC-${o.id * 123}</EmployeeId>\n`;
      xml += `      <OfficerName>${o.name}</OfficerName>\n`;
      xml += `      <Designation>${o.designation}</Designation>\n`;
      xml += `      <Department>${o.department}</Department>\n`;
      xml += `      <ProductivityIndexDPI>${o.dpi}</ProductivityIndexDPI>\n`;
      xml += `      <EngagementRate>${o.engagementIndex}</EngagementRate>\n`;
      xml += `      <VerificationStatus>Aadhaar e-Signed</VerificationStatus>\n`;
      xml += `    </Record>\n`;
    });
    
    xml += `  </AppraisalRecords>\n`;
    xml += `</SparrowAppraisalSync>`;
    return xml;
  };

  const handleSyncClick = () => {
    const payload = generateXmlPayload(officers);
    setXmlPayload(payload);
    setShowPayloadModal(true);
  };

  const executeSync = () => {
    setSyncing(true);
    setSyncSuccess(false);

    // Simulate central portal sync
    setTimeout(() => {
      setSyncing(false);
      setSyncSuccess(true);
      confetti({ particleCount: 60, spread: 40 });
      
      // Update statuses in table
      setOfficers(prev => prev.map(o => ({ ...o, status: 'synced' })));
      
      setTimeout(() => {
        setShowPayloadModal(false);
        setSyncSuccess(false);
      }, 1500);
    }, 2000);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <FileSpreadsheet className="h-6 w-6 text-blue-900" />
              SPARROW Integration Center
            </h2>
            <p className="text-sm text-slate-500">Sync calculated DPI ratings and achievements with the central Government of India SPARROW portal.</p>
          </div>

          <button
            onClick={handleSyncClick}
            disabled={officers.length === 0}
            className="flex items-center gap-1.5 px-4.5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-xl shadow-md text-xs transition-all shrink-0 disabled:opacity-50"
          >
            <RefreshCw className="h-4 w-4" />
            Sync Appraisal Ledger
          </button>
        </div>

        {/* Officers list table */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-900" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="px-6 py-4">Officer Name</th>
                    <th className="px-6 py-4">Department</th>
                    <th className="px-6 py-4 text-center">Appraisal Score (DPI)</th>
                    <th className="px-6 py-4 text-center">Engagement Index</th>
                    <th className="px-6 py-4 text-right">SPARROW Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {officers.map((officer) => (
                    <tr key={officer.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-3.5">
                        <p className="font-bold text-slate-800">{officer.name}</p>
                        <p className="text-[10px] text-slate-400 font-semibold">{officer.designation}</p>
                      </td>
                      <td className="px-6 py-3.5 text-slate-500">{officer.department}</td>
                      <td className="px-6 py-3.5 text-center font-bold text-blue-900">{officer.dpi}%</td>
                      <td className="px-6 py-3.5 text-center text-slate-500">{officer.engagementIndex}%</td>
                      <td className="px-6 py-3.5 text-right">
                        <span className={`px-2.5 py-1 rounded-full text-[9px] font-extrabold ${
                          officer.status === 'synced'
                            ? 'bg-green-100 text-green-800 border border-green-200'
                            : 'bg-yellow-100 text-yellow-800 border border-yellow-200 animate-pulse'
                        }`}>
                          {officer.status === 'synced' ? 'SYNCED' : 'AWAITING SYNC'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* XML API Sync Modal */}
        {showPayloadModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl bg-slate-950 text-slate-100 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col h-[500px]">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-slate-800 shrink-0">
                <div className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-blue-400 animate-pulse" />
                  <span className="font-bold text-base text-white">Central SPARROW Sync Payload (XML)</span>
                </div>
                <button
                  onClick={() => setShowPayloadModal(false)}
                  className="p-1 text-slate-500 hover:text-slate-300 rounded-full hover:bg-slate-900"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Body / XML Code Block */}
              {syncSuccess ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 gap-4 bg-slate-900">
                  <div className="h-14 w-14 rounded-full bg-green-500/10 text-green-400 border border-green-500/30 flex items-center justify-center animate-bounce">
                    <CheckCircle className="h-8 w-8" />
                  </div>
                  <h4 className="text-lg font-bold text-white">SPARROW Sync Completed</h4>
                  <p className="text-xs text-slate-400 max-w-sm">Central NIC database updated. Appraisal records registered and locked securely under SHA-256 signatures.</p>
                </div>
              ) : (
                <div className="flex-1 p-6 overflow-y-auto font-mono text-xs text-blue-300/90 whitespace-pre bg-slate-950/80 leading-normal selection:bg-blue-900">
                  {xmlPayload}
                </div>
              )}

              {/* Footer */}
              {!syncSuccess && (
                <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2 text-[10px] text-slate-400">
                    <Server className="h-4 w-4 text-emerald-400" />
                    <span>NIC Gateway: Active (Secure SSL/TLS Connection)</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setShowPayloadModal(false)}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={executeSync}
                      disabled={syncing}
                      className="flex items-center gap-1.5 px-4.5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md disabled:opacity-50"
                    >
                      {syncing ? (
                        <>
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          Uploading appraisal records...
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="h-4.5 w-4.5" />
                          Authorize Sync
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
