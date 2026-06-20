'use client';

import React, { useState, useEffect } from 'react';
import { AuthUser } from '@/app/providers';

export default function OperationsDashboard({ user }: { user: AuthUser }) {
  const [pendingApps, setPendingApps] = useState<any[]>([]);
  const [pendingDocs, setPendingDocs] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [rejectReason, setRejectReason] = useState('');
  const [processingDocId, setProcessingDocId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [appRes, allAppRes] = await Promise.all([
        fetch('/api/applications?status=SUBMITTED'),
        fetch('/api/applications')
      ]);

      const [appData, allAppData] = await Promise.all([
        appRes.ok ? appRes.json() : null,
        allAppRes.ok ? allAppRes.json() : null
      ]);

      if (appData) setPendingApps(appData.applications);
      if (allAppData) {
        const docs: any[] = [];
        allAppData.applications.forEach((app: any) => {
          const profileDocs = app.customer.profile?.documents || [];
          profileDocs.forEach((d: any) => {
            if (d.status === 'PENDING') {
              docs.push({
                ...d,
                customerName: app.customer.profile?.fullName || 'Prospect Customer',
                customerPhone: app.customer.phoneNumber,
              });
            }
          });
        });
        
        // Remove duplicates in documents list
        const uniqueDocs = docs.filter((value, index, self) =>
          self.findIndex((t) => t.id === value.id) === index
        );

        setPendingDocs(uniqueDocs);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleVerifyDocument = async (docId: string, status: 'VERIFIED' | 'REJECTED') => {
    setError('');
    setSuccess('');
    if (status === 'REJECTED' && !rejectReason.trim()) {
      setError('Please provide a rejection reason first.');
      return;
    }

    try {
      const res = await fetch(`/api/documents/${docId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, rejectionReason: rejectReason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update document verification');

      setSuccess(`Document successfully ${status.toLowerCase()}!`);
      setRejectReason('');
      setProcessingDocId(null);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handlePromoteApplication = async (appId: string) => {
    setError('');
    setSuccess('');
    try {
      // Transition application from SUBMITTED to UNDER_REVIEW
      const res = await fetch(`/api/applications/${appId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'UNDER_REVIEW', remarks: 'Operations document check completed.' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to promote application');

      setSuccess('Application successfully verified and promoted to credit underwriting!');
      fetchData();
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* LEFT CARD: PENDING DOCUMENT VERIFICATION */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-6 space-y-6">
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            Pending Customer Documents Queue
          </h2>

          {pendingDocs.length === 0 ? (
            <p className="text-slate-500 text-sm py-8 text-center">All documents verified. Vault is clean.</p>
          ) : (
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
              {pendingDocs.map((doc) => (
                <div key={doc.id} className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-slate-200 text-sm">{doc.customerName}</h3>
                      <p className="text-xs text-slate-500">{doc.customerPhone}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 font-bold uppercase text-[9px] border border-amber-500/20">
                      {doc.type} (V{doc.version})
                    </span>
                  </div>

                  <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800/60 flex justify-between items-center text-xs">
                    <span className="text-slate-500">Storage Key / Link:</span>
                    <a
                      href={`/uploads/${doc.s3Url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-emerald-400 hover:underline truncate max-w-[200px]"
                    >
                      {doc.s3Url.split('/').pop()}
                    </a>
                  </div>

                  {processingDocId === doc.id ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="Reason for rejection (required only if declining)..."
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 text-xs focus:border-rose-500/50"
                      />
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => handleVerifyDocument(doc.id, 'VERIFIED')}
                          className="px-4 py-1.5 bg-emerald-500 text-slate-950 text-xs font-bold rounded-lg"
                        >
                          Approve Doc
                        </button>
                        <button
                          onClick={() => handleVerifyDocument(doc.id, 'REJECTED')}
                          className="px-4 py-1.5 bg-rose-500 text-slate-100 text-xs font-bold rounded-lg"
                        >
                          Reject Doc
                        </button>
                        <button
                          onClick={() => setProcessingDocId(null)}
                          className="px-3 py-1.5 bg-slate-800 text-slate-400 text-xs font-semibold rounded-lg"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-right">
                      <button
                        onClick={() => {
                          setProcessingDocId(doc.id);
                          setRejectReason('');
                        }}
                        className="px-4 py-2 bg-emerald-500 text-slate-950 text-xs font-bold rounded-xl active:scale-[0.98] transition-all"
                      >
                        Action Verification
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT CARD: NEW INCOMING SUBMISSIONS QUEUE */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-6 space-y-6">
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
            Incoming Loan Applications (Verify Pipeline)
          </h2>

          {pendingApps.length === 0 ? (
            <p className="text-slate-500 text-sm py-8 text-center">No new applications submitted. Queue is empty.</p>
          ) : (
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
              {pendingApps.map((app) => (
                <div key={app.id} className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-slate-200 text-sm">{app.customer.profile?.fullName}</h3>
                      <p className="text-xs text-slate-500">App ID: {app.id.substring(0, 8)}...</p>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 font-bold uppercase text-[9px] border border-indigo-500/20">
                      {app.product.name}
                    </span>
                  </div>

                  <div className="text-xs text-slate-400 grid grid-cols-2 gap-3">
                    <p>Requested: <span className="text-slate-200 font-semibold">₹{Number(app.requestedAmount).toLocaleString('en-IN')}</span></p>
                    <p>Tenure: <span className="text-slate-200 font-semibold">{app.requestedTenure} months</span></p>
                    <p>Employment: <span className="text-slate-200 font-semibold">{app.customer.profile?.employmentType}</span></p>
                    <p>City: <span className="text-slate-200 font-semibold">{app.customer.profile?.city}</span></p>
                  </div>

                  <div className="text-right border-t border-slate-800/60 pt-3">
                    <button
                      onClick={() => handlePromoteApplication(app.id)}
                      className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-slate-100 text-xs font-bold rounded-xl active:scale-[0.98] transition-all"
                    >
                      Promote to Credit Review
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
