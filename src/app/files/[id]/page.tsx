'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from '@/context/SessionContext';
import DashboardLayout from '@/components/DashboardLayout';
import { useRouter } from 'next/navigation';
import {
  FileText,
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  Send,
  AlertTriangle,
  XCircle,
  FileClock,
  MessageSquare,
  UserCheck,
  Clock,
  Hash,
  RefreshCw,
  Key
} from 'lucide-react';

interface FileMovement {
  id: number;
  fromUser: { id: number; name: string; designation: string };
  toUser: { id: number; name: string; designation: string };
  note: string;
  timestamp: string;
  digitalSignatureHash: string | null;
}

interface EFile {
  id: number;
  subject: string;
  category: string;
  priority: string;
  status: string;
  createdAt: string;
  slaCategoryDays: number;
  createdById: number;
  createdBy: { name: string; designation: string };
  currentHolderId: number;
  currentHolder: { name: string; designation: string };
  movements: FileMovement[];
}

export default function FileDetailPage({ params }: { params: { id: string } }) {
  const { currentUser, users } = useSession();
  const router = useRouter();
  const fileId = parseInt(params.id);

  const [file, setFile] = useState<EFile | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionNote, setActionNote] = useState('');
  const [selectedRecipientId, setSelectedRecipientId] = useState('');
  
  // Modals and action loading
  const [showSignModal, setShowSignModal] = useState(false);
  const [signerName, setSignerName] = useState('');
  const [actionType, setActionType] = useState<'forward' | 'approve' | 'reject' | null>(null);
  const [submittingAction, setSubmittingAction] = useState(false);

  useEffect(() => {
    fetchFileDetails();
  }, [fileId]);

  async function fetchFileDetails() {
    try {
      const res = await fetch(`/api/files/${fileId}`);
      if (res.ok) {
        const data = await res.json();
        setFile(data);
        // Pre-select first user as recipient who is not the current actor
        if (users.length > 0 && currentUser) {
          const defaultRecipient = users.find(u => u.id !== currentUser.id && u.id !== data.currentHolderId);
          setSelectedRecipientId(defaultRecipient?.id.toString() || '');
        }
      } else {
        router.push('/files');
      }
    } catch (err) {
      console.error(err);
      router.push('/files');
    } finally {
      setLoading(false);
    }
  }

  const handleAction = async (type: 'forward' | 'approve' | 'reject') => {
    if (!currentUser || !file) return;

    setActionType(type);
    
    if (type === 'approve') {
      setShowSignModal(true);
      return;
    }

    executeFileAction(type);
  };

  const executeFileAction = async (type: 'forward' | 'approve' | 'reject', signatureHash?: string) => {
    if (!currentUser || !file) return;
    setSubmittingAction(true);

    try {
      const res = await fetch(`/api/files/${fileId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: type,
          toUserId: type === 'forward' ? parseInt(selectedRecipientId) : null,
          note: actionNote,
          digitalSignatureHash: signatureHash || null,
          actorId: currentUser.id
        })
      });

      if (res.ok) {
        setActionNote('');
        setShowSignModal(false);
        setSignerName('');
        fetchFileDetails();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingAction(false);
      setActionType(null);
    }
  };

  const handleSignConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !signerName) return;

    // Simple mock hash generation
    const mockHash = 'SHA256:' + Array.from(signerName + Date.now().toString())
      .map(char => char.charCodeAt(0).toString(16))
      .join('')
      .slice(0, 48)
      .toUpperCase();

    executeFileAction('approve', mockHash);
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

  if (!file) return null;

  const isCurrentHolder = currentUser?.id === file.currentHolderId;
  const isPending = file.status === 'pending';

  // Find notes (all movements notes where fromUser matches and note is meaningful)
  const notes = file.movements.filter(m => m.note);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Back and Title Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/files')}
            className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="h-4.5 w-4.5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${
                file.priority === 'CRITICAL'
                  ? 'bg-red-100 text-red-800'
                  : file.priority === 'HIGH'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {file.priority}
              </span>
              <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded">
                {file.category}
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-800 mt-1 line-clamp-1">{file.subject}</h2>
          </div>
        </div>

        {/* Info Grid Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-white border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Initiator</span>
            <p className="font-bold text-slate-800 mt-1">{file.createdBy.name}</p>
            <p className="text-[10px] text-slate-500">{file.createdBy.designation}</p>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Current Holder</span>
            <p className="font-bold text-slate-800 mt-1">{file.currentHolder.name}</p>
            <p className="text-[10px] text-slate-500">{file.currentHolder.designation}</p>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">SLA Window</span>
            <p className="font-bold text-slate-800 mt-1">{file.slaCategoryDays} Days Max</p>
            <p className="text-[10px] text-slate-500">Target Resolution Time</p>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">File Status</span>
            <div className="mt-1">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                file.status === 'approved'
                  ? 'bg-green-100 text-green-800 border border-green-200'
                  : file.status === 'rejected'
                  ? 'bg-rose-100 text-rose-800 border border-rose-200'
                  : 'bg-yellow-100 text-yellow-800 border border-yellow-200 animate-pulse'
              }`}>
                {file.status.toUpperCase()}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Ref ID: #{file.id}</p>
          </div>
        </div>

        {/* Main Double Panel (Movement vs NoteSheets) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Note Sheet (Chronological comment thread) */}
          <div className="lg:col-span-2 flex flex-col bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="flex items-center gap-2 px-5 py-4 bg-slate-50 border-b border-slate-200">
              <MessageSquare className="h-4.5 w-4.5 text-blue-900" />
              <h3 className="font-bold text-sm text-slate-800">Green Notesheet comments</h3>
            </div>

            {/* Note Sheet Container */}
            <div className="flex-1 p-5 space-y-4 max-h-[400px] overflow-y-auto bg-green-50/15">
              {notes.map((note, index) => (
                <div key={note.id} className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm relative">
                  {/* Digital Signature Badge if present */}
                  {note.digitalSignatureHash && (
                    <div className="absolute top-3 right-3 flex items-center gap-1 bg-green-50 border border-green-200 text-green-700 px-2 py-0.5 rounded text-[9px] font-bold">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Cryptographically e-Signed
                    </div>
                  )}

                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold text-slate-800">{note.fromUser.name}</span>
                    <span className="text-[10px] text-slate-400">({note.fromUser.designation})</span>
                    <span className="text-[10px] text-slate-400">•</span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(note.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs leading-normal text-slate-700 whitespace-pre-line">{note.note}</p>

                  {note.digitalSignatureHash && (
                    <div className="mt-3 pt-2 border-t border-dashed border-slate-100 flex items-center gap-1.5 text-[9px] text-slate-400 font-mono">
                      <Hash className="h-3 w-3" />
                      <span>Sig Hash: {note.digitalSignatureHash}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Action Panel for Current Holder */}
            {isCurrentHolder && isPending && (
              <div className="p-5 border-t border-slate-200 bg-slate-50 space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="action-note" className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                    Write remarks / notesheet comment
                  </label>
                  <textarea
                    id="action-note"
                    rows={3}
                    placeholder="Enter official remarks to attach to the notesheet..."
                    value={actionNote}
                    onChange={(e) => setActionNote(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-2">
                  {/* Recipient dropdown if forwarding */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                      Dispatch To:
                    </span>
                    <select
                      value={selectedRecipientId}
                      onChange={(e) => setSelectedRecipientId(e.target.value)}
                      className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {users
                        .filter(u => u.id !== currentUser.id)
                        .map(u => (
                          <option key={u.id} value={u.id}>
                            {u.name} ({u.designation})
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex items-center gap-2 self-end">
                    <button
                      onClick={() => handleAction('reject')}
                      disabled={submittingAction}
                      className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold rounded-lg text-xs transition-all"
                    >
                      <XCircle className="h-4 w-4" />
                      Reject / Return
                    </button>

                    <button
                      onClick={() => handleAction('forward')}
                      disabled={submittingAction || !selectedRecipientId}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg text-xs transition-all shadow"
                    >
                      <Send className="h-3.5 w-3.5" />
                      Forward
                    </button>

                    <button
                      onClick={() => handleAction('approve')}
                      disabled={submittingAction}
                      className="flex items-center gap-1.5 px-4.5 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg text-xs transition-all shadow-md"
                    >
                      <ShieldCheck className="h-4 w-4" />
                      Approve & e-Sign
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Vertical Movement Timeline (Right Panel) */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col">
            <div className="flex items-center gap-2 px-5 py-4 bg-slate-50 border-b border-slate-200">
              <FileClock className="h-4.5 w-4.5 text-blue-900" />
              <h3 className="font-bold text-sm text-slate-800">Movement Trail</h3>
            </div>

            <div className="flex-1 p-5 overflow-y-auto space-y-6 max-h-[500px]">
              {file.movements.map((movement, idx) => (
                <div key={movement.id} className="relative pl-6">
                  {/* Timeline connectors */}
                  {idx < file.movements.length - 1 && (
                    <div className="absolute left-2.5 top-5 bottom-[-24px] w-[2px] bg-slate-200 timeline-line"></div>
                  )}

                  {/* Icon indicator */}
                  <div className={`absolute left-0 top-1.5 h-5 w-5 rounded-full flex items-center justify-center border-2 ${
                    movement.digitalSignatureHash
                      ? 'bg-green-100 border-green-600 text-green-700'
                      : idx === file.movements.length - 1 && file.status === 'pending'
                      ? 'bg-yellow-100 border-yellow-500 text-yellow-600'
                      : 'bg-blue-50 border-blue-400 text-blue-700'
                  }`}>
                    {movement.digitalSignatureHash ? (
                      <ShieldCheck className="h-3 w-3" />
                    ) : (
                      <Clock className="h-3 w-3" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-bold text-slate-800">
                        {idx === 0 ? 'File Initiated' : movement.digitalSignatureHash ? 'File Approved' : 'File Forwarded'}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(movement.timestamp).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600 leading-normal space-y-1">
                      <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                        <span>{movement.fromUser.name}</span>
                        <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                        <span>{movement.toUser.name}</span>
                      </div>
                      {movement.note && <p className="italic">"{movement.note}"</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Digital Signature Signing Modal */}
        {showSignModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
                <div className="flex items-center gap-2 text-green-700">
                  <Key className="h-5 w-5" />
                  <span className="font-bold text-base">Cryptographic Aadhaar Sign-off</span>
                </div>
                <button
                  onClick={() => setShowSignModal(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSignConfirm} className="p-6 space-y-4">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-800 text-xs leading-normal">
                  <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                  <p>
                    <strong>Aadhaar e-Sign authentication check</strong>: To simulate the secure digital signature process, please type your full official name below exactly as registered on your account profile (<strong>{currentUser?.name}</strong>).
                  </p>
                </div>

                <div className="space-y-1">
                  <label htmlFor="signer-name" className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                    Full Name (Aadhaar Verification)
                  </label>
                  <input
                    id="signer-name"
                    type="text"
                    required
                    placeholder="Enter name to sign..."
                    value={signerName}
                    onChange={(e) => setSignerName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white font-bold"
                  />
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowSignModal(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={signerName.trim().toLowerCase() !== currentUser?.name.toLowerCase()}
                    className="flex items-center gap-1.5 px-4.5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold shadow-md disabled:opacity-50"
                  >
                    <UserCheck className="h-4.5 w-4.5" />
                    Cryptographic Signature
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
