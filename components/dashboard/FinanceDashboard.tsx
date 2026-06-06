'use client';

import React, { useState, useEffect } from 'react';
import { AuthUser } from '@/app/providers';

export default function FinanceDashboard({ user }: { user: AuthUser }) {
  const [approvedQueue, setApprovedQueue] = useState<any[]>([]);
  const [activeLoans, setActiveLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [disbursingId, setDisbursingId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      // 1. Fetch applications in MANDATE_ACTIVE status (ready to disburse)
      const appRes = await fetch('/api/applications?status=MANDATE_ACTIVE');
      if (appRes.ok) {
        const appData = await appRes.json();
        setApprovedQueue(appData.applications);
      }

      // 2. Fetch all loans
      const loansRes = await fetch('/api/loans');
      if (loansRes.ok) {
        const loansData = await loansRes.json();
        setActiveLoans(loansData.loans);
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

  const handleDisburseLoan = async (appId: string) => {
    setError('');
    setSuccess('');
    setDisbursingId(appId);

    try {
      const res = await fetch(`/api/loans/${appId}/disburse`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Disbursal trigger failed');

      setSuccess(`Loan successfully disbursed! Active Account: ${data.loan.id}`);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDisbursingId(null);
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

      {/* DISBURSEMENT QUEUE CARD */}
      <section className="bg-slate-900 border border-slate-800/80 rounded-3xl p-6 md:p-8 space-y-6">
        <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          Pending Loan Disbursement Queue (Mandate Active)
        </h2>

        {approvedQueue.length === 0 ? (
          <p className="text-slate-500 text-sm py-8 text-center">No applications waiting for payout. Vault is clean.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                  <th className="py-3 px-4">Customer Name</th>
                  <th className="py-3 px-4">Application ID</th>
                  <th className="py-3 px-4">Bank Repayment Info</th>
                  <th className="py-3 px-4">Disbursal Principal</th>
                  <th className="py-3 px-4">Processing Fee</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {approvedQueue.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-950/20">
                    <td className="py-3.5 px-4 font-bold text-slate-200">{app.customer.profile?.fullName}</td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-400">{app.id}</td>
                    <td className="py-3.5 px-4">
                      <div className="text-xs">
                        <p className="font-semibold text-slate-300">{app.customer.profile?.bankName}</p>
                        <p className="text-slate-500">A/C: {app.customer.profile?.bankAccountNo} (IFSC: {app.customer.profile?.bankIfsc})</p>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-emerald-400">₹{Number(app.requestedAmount).toLocaleString('en-IN')}</td>
                    <td className="py-3.5 px-4">₹{Number(app.product.processingFee).toLocaleString('en-IN')}</td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleDisburseLoan(app.id)}
                        disabled={disbursingId === app.id}
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold rounded-xl active:scale-[0.98] transition-all"
                      >
                        {disbursingId === app.id ? 'Processing...' : 'Disburse Funds'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* DISBURSED PORTFOLIO SETTLEMENT */}
      <section className="bg-slate-900 border border-slate-800/80 rounded-3xl p-6 md:p-8 space-y-6">
        <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
          Finance Loan Portfolio & Settlement Ledger
        </h2>

        {activeLoans.length === 0 ? (
          <p className="text-slate-500 text-sm py-8 text-center">No active loans in portfolio.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                  <th className="py-3 px-4">Loan Account ID</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Disbursed Principal</th>
                  <th className="py-3 px-4">Outstanding Due</th>
                  <th className="py-3 px-4">Payout Reference (RzpX)</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {activeLoans.map((loan) => (
                  <tr key={loan.id} className="hover:bg-slate-950/20">
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-400">{loan.id}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-200">{loan.application.customer.profile?.fullName}</td>
                    <td className="py-3.5 px-4">₹{Number(loan.disbursedAmount).toLocaleString('en-IN')}</td>
                    <td className="py-3.5 px-4 font-bold">₹{Number(loan.outstandingAmount).toLocaleString('en-IN')}</td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-500">{loan.razorpayPayoutId || 'N/A'}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        loan.status === 'CLOSED' ? 'bg-slate-500/10 text-slate-400 border border-slate-800/80' :
                        loan.status === 'OVERDUE' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                        'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {loan.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
