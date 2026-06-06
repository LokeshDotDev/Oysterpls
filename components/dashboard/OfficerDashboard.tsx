'use client';

import React, { useState, useEffect } from 'react';
import { AuthUser } from '@/app/providers';

export default function OfficerDashboard({ user }: { user: AuthUser }) {
  const [applications, setApplications] = useState<any[]>([]);
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Underwriter action states
  const [remarks, setRemarks] = useState('');
  const [newNote, setNewNote] = useState('');
  const [transitioning, setTransitioning] = useState(false);

  const fetchQueue = async () => {
    try {
      const res = await fetch('/api/applications?status=UNDER_REVIEW');
      if (res.ok) {
        const data = await res.json();
        setApplications(data.applications);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleSelectApplication = async (appId: string) => {
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`/api/applications/${appId}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedApp(data.application);
      }
    } catch (err: any) {
      setError('Failed to fetch application details');
    }
  };

  const handleStatusTransition = async (status: string) => {
    if (!selectedApp) return;
    setError('');
    setSuccess('');
    setTransitioning(true);

    try {
      const res = await fetch(`/api/applications/${selectedApp.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, remarks }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update application');

      setSuccess(`Application status transitioned to ${status}!`);
      setRemarks('');
      setSelectedApp(null);
      fetchQueue();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setTransitioning(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp || !newNote.trim()) return;
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`/api/applications/${selectedApp.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newNote, isInternal: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to append note');

      // Refresh application details to see the new note
      handleSelectApplication(selectedApp.id);
      setNewNote('');
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <span className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {error && <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl text-center text-sm">{error}</div>}
      {success && <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl text-center text-sm">{success}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT COLUMN: APPLICATIONS LIST */}
        <div className="lg:col-span-1 bg-slate-900 border border-slate-800/80 rounded-3xl p-6">
          <h2 className="text-lg font-bold mb-4 text-slate-100 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Underwriting Review Queue
          </h2>

          {applications.length === 0 ? (
            <p className="text-slate-500 text-sm py-6 text-center">No applications pending review.</p>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {applications.map((app) => (
                <div
                  key={app.id}
                  onClick={() => handleSelectApplication(app.id)}
                  className={`p-4 border rounded-2xl cursor-pointer transition-all ${
                    selectedApp?.id === app.id
                      ? 'bg-slate-950 border-emerald-500/50 shadow-md shadow-emerald-500/5'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700/80'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-slate-200 text-sm">{app.customer.profile?.fullName || 'Prospective Customer'}</span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                      app.eligibilityCheck?.eligible ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                    }`}>
                      {app.eligibilityCheck?.eligible ? 'Pass' : 'Risk'}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>₹{Number(app.requestedAmount).toLocaleString('en-IN')}</span>
                    <span>{app.requestedTenure}M ({app.product.name})</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: ACTIVE APPLICATION UNDERWRITING DETAIL PANEL */}
        <div className="lg:col-span-2 space-y-6">
          {selectedApp ? (
            <div className="space-y-6">
              {/* Profile Details Card */}
              <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-6 md:p-8 space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest">Application ID</span>
                    <h2 className="text-xl font-bold font-mono text-slate-100">{selectedApp.id}</h2>
                  </div>
                  <div className="space-x-2">
                    <button
                      onClick={() => handleStatusTransition('APPROVED')}
                      disabled={transitioning}
                      className="px-4 py-2 bg-emerald-500 text-slate-950 text-xs font-bold rounded-xl active:scale-[0.98] transition-all"
                    >
                      Approve Loan
                    </button>
                    <button
                      onClick={() => handleStatusTransition('REJECTED')}
                      disabled={transitioning}
                      className="px-4 py-2 bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-bold rounded-xl hover:bg-rose-500/25 active:scale-[0.98] transition-all"
                    >
                      Reject Loan
                    </button>
                    <button
                      onClick={() => handleStatusTransition('DOCUMENT_PENDING')}
                      disabled={transitioning}
                      className="px-4 py-2 bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-700 active:scale-[0.98] transition-all"
                    >
                      Request Docs
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 bg-slate-950 border border-slate-800/80 p-5 rounded-2xl text-xs">
                  <div>
                    <span className="block text-slate-500">Applicant Name</span>
                    <span className="font-bold text-slate-200 text-sm">{selectedApp.customer.profile?.fullName}</span>
                  </div>
                  <div>
                    <span className="block text-slate-500">Net Income / Month</span>
                    <span className="font-bold text-slate-200 text-sm">₹{Number(selectedApp.customer.profile?.monthlyIncome).toLocaleString('en-IN')}</span>
                  </div>
                  <div>
                    <span className="block text-slate-500">PAN Card No</span>
                    <span className="font-bold font-mono text-slate-200 text-sm">{selectedApp.customer.profile?.panNumber}</span>
                  </div>
                  <div>
                    <span className="block text-slate-500">IFSC / A/C Number</span>
                    <span className="font-bold text-slate-200 text-sm">{selectedApp.customer.profile?.bankIfsc} / {selectedApp.customer.profile?.bankAccountNo}</span>
                  </div>
                </div>

                {/* Eligibility Engine Breakdown */}
                <div>
                  <h3 className="font-semibold text-slate-300 text-sm mb-3">Eligibility Engine Check Breakdown</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedApp.eligibilityCheck?.results && Object.entries(selectedApp.eligibilityCheck.results).map(([key, value]: [string, any]) => (
                      <div key={key} className="flex justify-between items-center p-3 bg-slate-950/40 border border-slate-800 rounded-xl text-xs">
                        <span className="text-slate-400 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                        <div className="space-x-2">
                          <span className="text-slate-200 font-semibold">{value.value !== undefined ? value.value : 'N/A'}</span>
                          <span className={`px-2 py-0.5 rounded font-bold uppercase text-[9px] ${
                            value.passed ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}>
                            {value.passed ? 'PASS' : 'FAIL'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Remarks Field */}
                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-2">Underwriter Decision Remarks (Required for Reject / Request Docs)</label>
                  <textarea
                    rows={3}
                    placeholder="Enter approval details, rejection reasons, or specify missing documents..."
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl focus:border-emerald-500/50 text-slate-100 text-sm"
                  />
                </div>
              </div>

              {/* Internal Notes thread */}
              <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-6 md:p-8 space-y-6">
                <h3 className="font-bold text-slate-100 text-sm">Underwriting Discussion Thread</h3>
                
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                  {selectedApp.notes && selectedApp.notes.length === 0 ? (
                    <p className="text-slate-500 text-xs py-4">No internal comments added to this file yet.</p>
                  ) : (
                    selectedApp.notes?.map((n: any) => (
                      <div key={n.id} className="bg-slate-950 border border-slate-800 p-4 rounded-2xl text-xs space-y-2">
                        <div className="flex justify-between text-slate-500">
                          <span className="font-semibold text-slate-300">{n.author.email} ({n.author.role})</span>
                          <span>{new Date(n.createdAt).toLocaleString()}</span>
                        </div>
                        <p className="text-slate-200 text-sm leading-relaxed">{n.content}</p>
                      </div>
                    ))
                  )}
                </div>

                <form onSubmit={handleAddNote} className="flex gap-3">
                  <input
                    type="text"
                    placeholder="Add underwriter note to file..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    required
                    className="flex-1 px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-sm focus:border-emerald-500/50"
                  />
                  <button
                    type="submit"
                    className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-slate-100 font-bold rounded-2xl text-sm"
                  >
                    Post Note
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-12 text-center text-slate-500 text-sm">
              Select a loan application from the review queue to display its full credit profile and begin underwriting.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
