'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from '@/context/SessionContext';
import { useRouter } from 'next/navigation';
import { ShieldAlert, Fingerprint, Lock, ShieldCheck, RefreshCw } from 'lucide-react';

export default function LoginPage() {
  const { users, switchUser, loading } = useSession();
  const router = useRouter();
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [useDSC, setUseDSC] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (users.length > 0 && !selectedUserId) {
      setSelectedUserId(users[0].id.toString());
    }
  }, [users, selectedUserId]);

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return;

    setSigningIn(true);
    // Mock authentication delay
    setTimeout(() => {
      const user = users.find(u => u.id === parseInt(selectedUserId));
      if (user) {
        // Update active session user
        switchUser(user.id);
        setSuccess(true);
        setSigningIn(false);

        // Redirect based on persona type
        setTimeout(() => {
          if (user.personaType === 'secretary') {
            router.push('/secretary');
          } else if (user.personaType === 'teamlead') {
            router.push('/teamlead');
          } else {
            router.push('/officer');
          }
        }, 800);
      }
    }, 1200);
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-100">
        <div className="flex flex-col items-center gap-2">
          <RefreshCw className="h-10 w-10 animate-spin text-blue-900" />
          <p className="text-sm font-medium text-slate-600">Initializing Security Gateway...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-slate-50 relative overflow-hidden">
      {/* Top Tri-Color stripe decoration */}
      <div className="absolute top-0 left-0 right-0 h-2 flex">
        <div className="flex-1 bg-[#FF9933]"></div>
        <div className="flex-1 bg-white"></div>
        <div className="flex-1 bg-[#138808]"></div>
      </div>

      {/* Background Graphic elements */}
      <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-blue-50/60 blur-3xl"></div>
      <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-amber-50/60 blur-3xl"></div>

      <div className="w-full max-w-md p-8 bg-white border border-slate-200 shadow-2xl rounded-2xl relative z-10 hover-scale">
        <div className="flex flex-col items-center text-center gap-1 mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-900 mb-2 shadow-md">
            <Fingerprint className="h-6 w-6 text-amber-400" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800">e-Office Pro Gateway</h2>
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Smart India Hackathon 2026</p>
          <div className="h-[2px] w-12 bg-amber-500 mt-2"></div>
        </div>

        {success ? (
          <div className="flex flex-col items-center text-center gap-4 py-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-green-600 border border-green-200 animate-bounce">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Authentication Verified</h3>
              <p className="text-sm text-slate-500 mt-1">Redirecting to National Performance Ledger...</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSignIn} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="user-select" className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                Select Persona Account
              </label>
              <select
                id="user-select"
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full bg-slate-50 text-sm font-semibold text-slate-800 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} — {u.designation} ({u.personaType.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="dsc-checkbox"
                  checked={useDSC}
                  onChange={(e) => setUseDSC(e.target.checked)}
                  className="h-4 w-4 rounded text-blue-900 border-slate-300 focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="dsc-checkbox" className="text-xs font-semibold text-slate-700 cursor-pointer select-none">
                  Enable Mock Digital Signature Certificate (DSC) 2FA
                </label>
              </div>
              <p className="text-[10px] text-slate-400 leading-normal">
                Enabling DSC verifies cryptographic notesheet commenting and approval signatures in files.
              </p>
            </div>

            <button
              type="submit"
              disabled={signingIn}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-sm font-bold shadow-lg transition-all disabled:opacity-75 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {signingIn ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Authenticating DSC Token...
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  Secure Sign In
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-2 text-slate-400 text-[10px] mt-4">
              <ShieldAlert className="h-3 w-3 text-amber-500" />
              <span>Restricted Government Access System</span>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
