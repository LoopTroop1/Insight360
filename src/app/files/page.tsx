'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from '@/context/SessionContext';
import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';
import {
  FileText,
  Search,
  Plus,
  Filter,
  ArrowUpDown,
  Archive,
  ChevronRight,
  ShieldCheck,
  Calendar,
  X,
  RefreshCw,
  FolderOpen,
  Send,
  Cpu,
  AlertTriangle
} from 'lucide-react';

interface FileMovement {
  id: number;
  fromUser: { name: string; designation: string };
  toUser: { name: string; designation: string };
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
  createdBy: { name: string; designation: string };
  currentHolder: { name: string; designation: string };
  movements: FileMovement[];
}

export default function FilesPage() {
  const { currentUser, users } = useSession();
  const [activeTab, setActiveTab] = useState<'inbox' | 'sent' | 'all' | 'archive'>('inbox');
  const [files, setFiles] = useState<EFile[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters and search
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'priority'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Create file modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newCategory, setNewCategory] = useState('e-Governance');
  const [newPriority, setNewPriority] = useState('MEDIUM');
  const [newHolderId, setNewHolderId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const isExecutive = currentUser?.personaType === 'secretary' || currentUser?.role === 'secretary' || currentUser?.personaType === 'teamlead';

  // Automatically pick a valid default recipient if newHolderId is empty
  useEffect(() => {
    if (users.length > 0 && !newHolderId && currentUser) {
      const defaultHolder = users.find(u => u.id !== currentUser.id) || users[0];
      setNewHolderId(defaultHolder?.id.toString() || '');
    }
  }, [users, currentUser, newHolderId]);

  const categories = ["e-Governance", "Budget Allocation", "Security Audit", "Infrastructure", "Policy Draft", "Public Grievance"];

  useEffect(() => {
    fetchFiles();
  }, [currentUser, activeTab]);

  async function fetchFiles() {
    if (!currentUser) return;
    setLoading(true);
    try {
      let url = '/api/files';
      if (activeTab === 'inbox') {
        url += `?userId=${currentUser.id}&status=pending`;
      } else if (activeTab === 'sent') {
        url += `?createdById=${currentUser.id}`;
      } else if (activeTab === 'all') {
        url += `?all=true`;
      } else {
        url += `?status=approved`; // completed archive
      }
      
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setFiles(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // Handle file creation
  const handleCreateFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject || !newHolderId || !currentUser) {
      setErrorMsg('Subject and recipient are required.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: newSubject,
          category: newCategory,
          priority: newPriority,
          initialHolderId: newHolderId,
          createdById: currentUser.id
        })
      });

      if (res.ok) {
        // Reset and close modal
        setNewSubject('');
        setNewCategory('e-Governance');
        setNewPriority('MEDIUM');
        setErrorMsg('');
        setIsModalOpen(false);
        // Switch to 'sent' tab so they immediately see the new file
        setActiveTab('sent');
      } else {
        const data = await res.json();
        setErrorMsg(data.error || 'Failed to create file');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'A network error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter and sort logic
  const filteredFiles = files
    .filter(file => {
      const matchesSearch = file.subject.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            file.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPriority = priorityFilter ? file.priority === priorityFilter : true;
      const matchesCategory = categoryFilter ? file.category === categoryFilter : true;
      return matchesSearch && matchesPriority && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === 'date') {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
      } else {
        // Priority weight sort
        const weights: Record<string, number> = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
        const weightA = weights[a.priority] || 0;
        const weightB = weights[b.priority] || 0;
        return sortOrder === 'desc' ? weightB - weightA : weightA - weightB;
      }
    });

  const toggleSort = (type: 'date' | 'priority') => {
    if (sortBy === type) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(type);
      setSortOrder('desc');
    }
  };

  const calculateDaysPending = (createdAtStr: string) => {
    const created = new Date(createdAtStr);
    const diff = Date.now() - created.getTime();
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Top Title and Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">e-Office File Management</h2>
            <p className="text-sm text-slate-500">Track and dispatch official files within established SLAs.</p>
          </div>
          <button
            onClick={() => {
              // Default recipient to Section Officer or Team Lead
              const defaultHolder = users.find(u => u.id !== currentUser?.id) || users[0];
              setNewHolderId(defaultHolder?.id.toString() || '');
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-xl shadow-lg transition-all self-start"
          >
            <Plus className="h-4.5 w-4.5" />
            Create Official File
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex border-b border-slate-200 overflow-x-auto">
          <button
            onClick={() => setActiveTab('inbox')}
            className={`flex items-center gap-2 px-5 py-3.5 border-b-2 font-bold text-sm transition-all whitespace-nowrap ${
              activeTab === 'inbox'
                ? 'border-blue-800 text-blue-900 bg-white/50'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FolderOpen className="h-4 w-4" />
            Active Inbox
            {activeTab === 'inbox' && (
              <span className="ml-1.5 px-2 py-0.5 text-xs bg-slate-100 rounded-full text-slate-700">
                {filteredFiles.length}
              </span>
            )}
          </button>
          
          <button
            onClick={() => setActiveTab('sent')}
            className={`flex items-center gap-2 px-5 py-3.5 border-b-2 font-bold text-sm transition-all whitespace-nowrap ${
              activeTab === 'sent'
                ? 'border-blue-800 text-blue-900 bg-white/50'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Send className="h-4 w-4" />
            Outbox (Sent/Initiated)
            {activeTab === 'sent' && (
              <span className="ml-1.5 px-2 py-0.5 text-xs bg-slate-100 rounded-full text-slate-700">
                {filteredFiles.length}
              </span>
            )}
          </button>

          {isExecutive && (
            <button
              onClick={() => setActiveTab('all')}
              className={`flex items-center gap-2 px-5 py-3.5 border-b-2 font-bold text-sm transition-all whitespace-nowrap ${
                activeTab === 'all'
                  ? 'border-blue-800 text-blue-900 bg-white/50'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Cpu className="h-4 w-4" />
              All Department Files
              {activeTab === 'all' && (
                <span className="ml-1.5 px-2 py-0.5 text-xs bg-slate-100 rounded-full text-slate-700">
                  {filteredFiles.length}
                </span>
              )}
            </button>
          )}

          <button
            onClick={() => setActiveTab('archive')}
            className={`flex items-center gap-2 px-5 py-3.5 border-b-2 font-bold text-sm transition-all whitespace-nowrap ${
              activeTab === 'archive'
                ? 'border-blue-800 text-blue-900 bg-white/50'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Archive className="h-4 w-4" />
            Completed Archive
            {activeTab === 'archive' && (
              <span className="ml-1.5 px-2 py-0.5 text-xs bg-slate-100 rounded-full text-slate-700">
                {filteredFiles.length}
              </span>
            )}
          </button>
        </div>

        {/* Filters and search panel */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 flex flex-col md:flex-row md:items-center gap-4 justify-between">
          <div className="flex-1 max-w-md relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search files by subject or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400" />
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Filters:</span>
            </div>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Priorities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Files Data Table */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-900" />
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-2">
              <FileText className="h-10 w-10 text-slate-300" />
              <p className="text-sm font-semibold">No files found.</p>
              <p className="text-xs">Active pending items or completed items will show up here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <th className="px-6 py-4.5">File Subject</th>
                    <th className="px-6 py-4.5">Category</th>
                    <th className="px-6 py-4.5 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => toggleSort('priority')}>
                      <div className="flex items-center gap-1">
                        Priority
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                    <th className="px-6 py-4.5">Current Holder</th>
                    <th className="px-6 py-4.5 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => toggleSort('date')}>
                      <div className="flex items-center gap-1">
                        Days Pending
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                    <th className="px-6 py-4.5">Status</th>
                    <th className="px-6 py-4.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredFiles.map((file) => {
                    const daysPending = calculateDaysPending(file.createdAt);
                    const isOverdue = daysPending > file.slaCategoryDays;

                    return (
                      <tr key={file.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-6 py-4.5 max-w-xs md:max-w-sm">
                          <Link href={`/files/${file.id}`} className="font-bold text-slate-800 hover:text-blue-700 hover:underline line-clamp-1">
                            {file.subject}
                          </Link>
                          <span className="text-[10px] text-slate-400 mt-1 block">
                            File Ref ID: #{file.id} | Initiated on {new Date(file.createdAt).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="px-6 py-4.5">
                          <span className="px-2.5 py-1 bg-slate-100 rounded-lg text-xs font-semibold text-slate-600 border border-slate-200/50">
                            {file.category}
                          </span>
                        </td>
                        <td className="px-6 py-4.5">
                          <span className={`px-2 py-0.5 rounded text-xs font-extrabold ${
                            file.priority === 'CRITICAL'
                              ? 'bg-red-100 text-red-800 border border-red-200'
                              : file.priority === 'HIGH'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : file.priority === 'MEDIUM'
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : 'bg-slate-100 text-slate-800 border border-slate-200'
                          }`}>
                            {file.priority}
                          </span>
                        </td>
                        <td className="px-6 py-4.5">
                          <p className="font-bold text-slate-700">{file.currentHolder.name}</p>
                          <p className="text-[10px] text-slate-400">{file.currentHolder.designation}</p>
                        </td>
                        <td className="px-6 py-4.5">
                          <span className={`font-bold ${isOverdue && file.status === 'pending' ? 'text-red-600' : 'text-slate-700'}`}>
                            {daysPending} days
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">SLA: {file.slaCategoryDays} days</span>
                        </td>
                        <td className="px-6 py-4.5">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            file.status === 'approved'
                              ? 'bg-green-100 text-green-800 border border-green-200'
                              : file.status === 'rejected'
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : 'bg-yellow-100 text-yellow-800 border border-yellow-200 animate-pulse'
                          }`}>
                            {file.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4.5 text-right">
                          <Link
                            href={`/files/${file.id}`}
                            className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-900 border border-blue-200 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            Open File
                            <ChevronRight className="h-3 w-3" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Create File Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
                <div className="flex items-center gap-2 text-blue-900">
                  <FileText className="h-5 w-5" />
                  <span className="font-bold text-base">Initiate New Official File</span>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Body Form */}
              <form onSubmit={handleCreateFile} className="p-6 space-y-4">
                {errorMsg && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl flex items-start gap-2">
                    <AlertTriangle className="h-4.5 w-4.5 text-red-500 shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </div>
                )}
                <div className="space-y-1">
                  <label htmlFor="subject" className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                    File Subject
                  </label>
                  <input
                    id="subject"
                    type="text"
                    required
                    placeholder="Enter short descriptive subject..."
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label htmlFor="category" className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                      Category
                    </label>
                    <select
                      id="category"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    >
                      {categories.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="priority" className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                      Priority
                    </label>
                    <select
                      id="priority"
                      value={newPriority}
                      onChange={(e) => setNewPriority(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white font-bold"
                    >
                      <option value="CRITICAL">CRITICAL (2 days SLA)</option>
                      <option value="HIGH">HIGH (5 days SLA)</option>
                      <option value="MEDIUM">MEDIUM (10 days SLA)</option>
                      <option value="LOW">LOW (15 days SLA)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label htmlFor="holder" className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                    Initial Dispatch Holder
                  </label>
                  <select
                    id="holder"
                    required
                    value={newHolderId}
                    onChange={(e) => setNewHolderId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  >
                    <option value="" disabled>Select User...</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.name} — {u.designation} ({u.department?.name})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex items-center gap-1.5 px-4.5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-md disabled:opacity-70"
                  >
                    {submitting ? (
                      <>
                        <RefreshCw className="h-3 w-3 animate-spin" />
                        Initiating...
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="h-4.5 w-4.5" />
                        Initiate File
                      </>
                    )}
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
