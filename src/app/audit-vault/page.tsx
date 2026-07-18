'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import {
  Lock,
  ShieldCheck,
  ShieldAlert,
  Hash,
  User,
  Clock,
  RefreshCw,
  Search,
  Eye,
  CheckCircle2,
  FileCheck2
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface AuditLog {
  id: number;
  actorId: number;
  actionType: string;
  entityId: number;
  entityType: string;
  details: string;
  timestamp: string;
  previousHash: string;
  currentHash: string;
  actor: {
    name: string;
    designation: string;
    department: { name: string } | null;
  } | null;
}

export default function AuditVaultPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Integrity Check State
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);

  useEffect(() => {
    fetchLogs();
  }, []);

  async function fetchLogs() {
    try {
      const res = await fetch('/api/audit-vault');
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleVerifyLedger = async () => {
    setVerifying(true);
    setVerificationResult(null);
    try {
      const res = await fetch('/api/audit-vault/verify');
      if (res.ok) {
        const data = await res.json();
        setVerificationResult(data);
        if (data.success) {
          // Success confetti!
          confetti({
            particleCount: 100,
            spread: 60,
            origin: { y: 0.8 }
          });
        }
      }
    } catch (err) {
      console.error(err);
      setVerificationResult({
        success: false,
        error: 'Network error during validation check.'
      });
    } finally {
      setVerifying(false);
    }
  };

  const filteredLogs = logs.filter(log =>
    log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.actionType.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (log.actor && log.actor.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Lock className="h-6 w-6 text-blue-900" />
              Chained Security Audit Vault
            </h2>
            <p className="text-sm text-slate-500">Tamper-evident, cryptographically chained transactional records of all goals, tasks, and file operations.</p>
          </div>

          <button
            onClick={handleVerifyLedger}
            disabled={verifying}
            className="flex items-center gap-1.5 px-4.5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-xl shadow-md text-xs transition-all shrink-0 disabled:opacity-75 animate-pulse"
          >
            {verifying ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Computing Ledger Hashes...
              </>
            ) : (
              <>
                <ShieldCheck className="h-4.5 w-4.5" />
                Verify Ledger Integrity
              </>
            )}
          </button>
        </div>

        {/* Verification Result Card */}
        {verificationResult && (
          <div className={`p-5 rounded-2xl border shadow-sm animate-in fade-in slide-in-from-top duration-150 flex items-start gap-3.5 ${
            verificationResult.success
              ? 'bg-green-50/50 border-green-200 text-green-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}>
            {verificationResult.success ? (
              <FileCheck2 className="h-6 w-6 text-green-600 shrink-0 mt-0.5" />
            ) : (
              <ShieldAlert className="h-6 w-6 text-red-600 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1.5">
              <h4 className="text-sm font-bold">
                {verificationResult.success ? 'Immutable Ledger Verified Secure' : 'Ledger Integrity Mismatch Detected!'}
              </h4>
              <p className="text-xs text-slate-600 leading-normal">{verificationResult.message || verificationResult.error}</p>
              {verificationResult.success && (
                <div className="flex gap-4 text-[10px] text-slate-400 font-semibold pt-1">
                  <span>Checked nodes: {verificationResult.nodesChecked}</span>
                  <span>Anomalies: 0</span>
                  <span>Status: Immutable</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Search */}
        <div className="flex items-center gap-4 bg-white p-4 border border-slate-200 rounded-xl max-w-md">
          <Search className="h-4.5 w-4.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search audit trail logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-sm focus:outline-none text-slate-700 font-semibold"
          />
        </div>

        {/* Audit Log Table */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-900" />
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center text-slate-400 py-20">No audit logs found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[11px] font-medium">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="px-6 py-4">Timestamp</th>
                    <th className="px-6 py-4">Authorized Actor</th>
                    <th className="px-6 py-4">Action Type</th>
                    <th className="px-6 py-4">Target Entity</th>
                    <th className="px-6 py-4">Details</th>
                    <th className="px-6 py-4">Chained Signatures</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-mono">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 text-slate-500 font-sans whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 font-sans">
                        <p className="font-bold text-slate-800">{log.actor?.name || `System (ID: ${log.actorId})`}</p>
                        <p className="text-[9px] text-slate-400 font-semibold">{log.actor?.designation} ({log.actor?.department?.name})</p>
                      </td>
                      <td className="px-6 py-4 text-slate-800 font-sans font-bold">
                        <span className="px-2 py-0.5 rounded text-[8px] bg-slate-100 text-slate-600 border border-slate-200">
                          {log.actionType.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 font-sans">
                        {log.entityType} (ID: {log.entityId})
                      </td>
                      <td className="px-6 py-4 font-sans text-xs text-slate-600 leading-normal max-w-xs">
                        {log.details}
                      </td>
                      <td className="px-6 py-4 text-[9px] space-y-1 select-all font-mono leading-none">
                        <div>
                          <span className="text-slate-400 mr-1 font-bold">PREV:</span>
                          <span className="text-slate-500">{log.previousHash.slice(0, 16)}...</span>
                        </div>
                        <div>
                          <span className="text-blue-900 mr-1 font-bold">CURR:</span>
                          <span className="text-blue-950 font-bold">{log.currentHash.slice(0, 16)}...</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </DashboardLayout>
  );
}
