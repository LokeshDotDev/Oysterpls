'use client';

import React, { useState, useEffect } from 'react';
import { AuthUser } from '@/app/providers';

export default function CollectionsDashboard({ user }: { user: AuthUser }) {
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [payingId, setPayingId] = useState<string | null>(null);

  const fetchOverdueLoans = async () => {
    try {
      const res = await fetch('/api/loans?status=OVERDUE');
      if (res.ok) {
        const data = await res.json();
        setLoans(data.loans);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverdueLoans();
  }, []);

  const handleSyncOverdue = async () => {
    setError('');
    setSuccess('');
    setSyncing(true);
    try {
      const res = await fetch('/api/loans/sync-overdue', {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to sync overdue accounts');

      setSuccess(`Portfolio synced successfully! ${data.message}`);
      fetchOverdueLoans();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSyncing(false);
    }
  };

  // Simulates standard recurring eMandate payment success by posting to our webhook endpoint
  const handleSimulatePayment = async (loan: any, status: 'success' | 'failed') => {
    setError('');
    setSuccess('');
    setPayingId(loan.id + '-' + status);

    const mandateId = loan.application.mandate?.razorpayMandateId;
    if (!mandateId) {
      setError('Cannot simulate autopay: No active mandate exists for this loan.');
      setPayingId(null);
      return;
    }

    // Find the next overdue or pending installment to charge
    const nextInstallment = loan.schedules.find((s: any) => s.status !== 'PAID');
    if (!nextInstallment) {
      setError('All installments are already fully paid.');
      setPayingId(null);
      return;
    }

    const amountDueRupees = Number(nextInstallment.amountDue) + Number(nextInstallment.penaltyAccrued) + Number(nextInstallment.lateFeeAccrued) - Number(nextInstallment.amountPaid);

    const payload = {
      entity: 'event',
      account_id: 'acc_mock_123',
      event: status === 'success' ? 'payment.success' : 'payment.failed',
      payload: {
        payment: {
          entity: {
            id: `pay_sim_${Math.random().toString(36).substr(2, 9)}`,
            amount: Math.round(amountDueRupees * 100), // convert to paise
            subscription_id: mandateId,
            status: status === 'success' ? 'captured' : 'failed',
            error_description: status === 'failed' ? 'Insufficient funds in customer bank account' : null,
          },
        },
      },
    };

    try {
      const res = await fetch('/api/webhooks/razorpay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-razorpay-signature': 'mock_signature', // triggers mock verify pass
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to dispatch simulation webhook');

      setSuccess(`Simulated eMandate webhook [${status === 'success' ? 'payment.success' : 'payment.failed'}] processed successfully!`);
      
      // Delay fetching updated state to let DB commit transactions
      setTimeout(() => {
        fetchOverdueLoans();
        setPayingId(null);
      }, 1000);
    } catch (err: any) {
      setError(err.message);
      setPayingId(null);
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

      {/* HEADER CONTROLS CARD */}
      <section className="bg-slate-900 border border-slate-800/80 rounded-3xl p-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Repayment & Recovery Management Panel</h2>
          <p className="text-xs text-slate-400 mt-1">Track days past due (DPD), penalties, and trigger autopay simulations.</p>
        </div>
        <div>
          <button
            onClick={handleSyncOverdue}
            disabled={syncing}
            className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-slate-100 font-bold rounded-2xl active:scale-[0.98] transition-all flex items-center gap-2 text-sm"
          >
            {syncing ? (
              <span className="w-4 h-4 border-2 border-slate-100 border-t-transparent rounded-full animate-spin"></span>
            ) : null}
            Trigger Daily Portfolio Sync (Calculate DPD)
          </button>
        </div>
      </section>

      {/* OVERDUE PIPELINE LIST */}
      <section className="bg-slate-900 border border-slate-800/80 rounded-3xl p-6 md:p-8 space-y-6">
        <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
          Active Overdue Recovery Queue
        </h2>

        {loans.length === 0 ? (
          <p className="text-slate-500 text-sm py-8 text-center">No overdue accounts. Recovery queue is empty.</p>
        ) : (
          <div className="space-y-6">
            {loans.map((loan) => (
              <div key={loan.id} className="bg-slate-950 border border-slate-800/60 rounded-2xl p-5 space-y-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                  <div>
                    <h3 className="font-bold text-slate-200 text-base">{loan.application.customer.profile?.fullName}</h3>
                    <p className="text-xs text-slate-500">Phone: {loan.application.customer.phoneNumber} | Loan ID: <code className="text-xs font-mono">{loan.id}</code></p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSimulatePayment(loan, 'success')}
                      disabled={payingId !== null}
                      className="px-3.5 py-2 bg-emerald-500 text-slate-950 text-xs font-bold rounded-xl active:scale-[0.97]"
                    >
                      {payingId === loan.id + '-success' ? 'Crediting...' : 'Simulate Repayment'}
                    </button>
                    <button
                      onClick={() => handleSimulatePayment(loan, 'failed')}
                      disabled={payingId !== null}
                      className="px-3.5 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 text-xs font-bold rounded-xl active:scale-[0.97]"
                    >
                      {payingId === loan.id + '-failed' ? 'Declining...' : 'Simulate Debit Bounce'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-slate-800/50 pt-4 text-xs">
                  <div>
                    <span className="block text-slate-500">Outstanding Balance</span>
                    <span className="font-bold text-slate-200 text-sm">₹{Number(loan.outstandingAmount).toLocaleString('en-IN')}</span>
                  </div>
                  <div>
                    <span className="block text-slate-500">Days Past Due (DPD)</span>
                    <span className="font-bold text-rose-400 text-sm">{loan.dpd} Days</span>
                  </div>
                  <div>
                    <span className="block text-slate-500">Bounce Penalty</span>
                    <span className="font-bold text-rose-400 text-sm">₹{Number(loan.penaltiesPaid || 0) + Number(loan.schedules.reduce((sum: number, s: any) => sum + Number(s.penaltyAccrued), 0))}</span>
                  </div>
                  <div>
                    <span className="block text-slate-500">Overdue Installments</span>
                    <span className="font-bold text-slate-200 text-sm">{loan.schedules.filter((s: any) => s.status === 'OVERDUE').length} / {loan.tenure}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
