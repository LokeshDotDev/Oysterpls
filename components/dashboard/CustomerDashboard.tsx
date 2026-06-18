'use client';

import React, { useState, useEffect } from 'react';
import { AuthUser } from '@/app/providers';
import DashboardLayout from './DashboardLayout';
import { 
  User, Mail, Phone, ShieldCheck, FileText, CheckCircle2, 
  CreditCard, Camera, UploadCloud, AlertTriangle, ArrowRight, 
  ArrowLeft, Download, Check, Landmark, RefreshCw, LayoutDashboard,
  Coins, FileUp, ChevronRight
} from 'lucide-react';

export default function CustomerDashboard({ user }: { user: AuthUser }) {
  const [profile, setProfile] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState<'loan' | 'mandate' | 'documents'>('loan');
  const [uploadState, setUploadState] = useState<Record<string, { uploading: boolean; status?: string }>>({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Profile
      const profRes = await fetch('/api/profile');
      if (profRes.ok) {
        const profData = await profRes.json();
        setProfile(profData.profile);
      }

      // 2. Fetch Applications
      const appRes = await fetch('/api/applications');
      if (appRes.ok) {
        const appData = await appRes.json();
        setApplications(appData.applications);
      }

      // 3. Fetch Loans
      const loanRes = await fetch('/api/loans');
      if (loanRes.ok) {
        const loanData = await loanRes.json();
        setLoans(loanData.loans);
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

  const handleFileUpload = async (type: string, file: File) => {
    setError('');
    setSuccess('');
    setUploadState((prev) => ({ ...prev, [type]: { uploading: true } }));
    try {
      // 1. Get pre-signed upload URL from API
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, filename: file.name }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to initialize document upload');

      const { presignedUrl } = data;

      // 2. Perform direct binary upload to S3 (or mock local API endpoint)
      const uploadRes = await fetch(presignedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });

      if (!uploadRes.ok) {
        throw new Error('File upload to storage server failed.');
      }

      setSuccess(`${type} document uploaded successfully! Verification status: PENDING.`);
      setUploadState((prev) => ({ ...prev, [type]: { uploading: false, status: 'PENDING' } }));
      fetchData(); // Refresh list to fetch updated document list
    } catch (err: any) {
      setError(err.message);
      setUploadState((prev) => ({ ...prev, [type]: { uploading: false } }));
    }
  };

  const handleSetupMandate = async (appId: string) => {
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`/api/applications/${appId}/mandate`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to setup mandate');
      
      if (data.authUrl) {
        window.open(data.authUrl, '_blank');
      }
      setSuccess('E-Mandate registration triggered successfully!');
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Helper date-and-day formatter
  const formatDateAndDay = (dateString: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20 min-h-[50vh]">
        <span className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></span>
      </div>
    );
  }

  // Find the single active loan or latest application
  const activeLoan = loans[0];
  const latestApplication = applications[0];

  return (
    <DashboardLayout
      user={user}
      activeTab={currentTab}
      setActiveTab={setCurrentTab}
      error={error}
      success={success}
    >

        {/* TAB 1: ACTIVE LOAN & REPAYMENT SCHEDULE */}
        {currentTab === 'loan' && (
          <div className="space-y-8 animate-fadeIn">
            <div>
              <h1 className="text-2xl font-black text-slate-900 leading-tight">Active Loan Accounts</h1>
              <p className="text-slate-500 text-xs mt-1">Check loan application, disbursals, and payment dates.</p>
            </div>

            {/* Application and Merchant Submission Status */}
            {latestApplication && (
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-extrabold text-slate-950 text-sm">Loan Application Status</h3>
                    <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mt-0.5">Submitted via store merchant partner</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${
                    latestApplication.status === 'APPROVED' || latestApplication.status === 'DISBURSED' || latestApplication.status === 'ACTIVE'
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
                      : latestApplication.status === 'REJECTED' 
                      ? 'bg-rose-50 text-rose-600 border-rose-200' 
                      : 'bg-indigo-50 text-indigo-600 border-indigo-200'
                  }`}>
                    {latestApplication.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-semibold">
                  <div>
                    <span className="block text-slate-400">Merchant Store</span>
                    <span className="text-slate-800 font-extrabold">{latestApplication.productName || latestApplication.product.name}</span>
                  </div>
                  <div>
                    <span className="block text-slate-400">Brand & Model</span>
                    <span className="text-slate-800 font-bold">{latestApplication.productBrandName || 'N/A'} ({latestApplication.productModelNo || 'N/A'})</span>
                  </div>
                  <div>
                    <span className="block text-slate-400">Total Store Price</span>
                    <span className="text-slate-800 font-bold">₹{Number(latestApplication.productValue || latestApplication.requestedAmount).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="block text-slate-400">Requested Tenure</span>
                    <span className="text-slate-800 font-bold">{latestApplication.requestedTenure} Months</span>
                  </div>
                </div>

                {latestApplication.status === 'APPROVED' && (
                  <div className="pt-2">
                    <button
                      onClick={() => handleSetupMandate(latestApplication.id)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
                    >
                      Verify & Setup eMandate
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Active Loan Ledger */}
            {activeLoan ? (
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-md font-extrabold text-slate-900">EMI Repayment Schedule Ledger</h2>
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 uppercase">
                    Loan Status: {activeLoan.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-semibold bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div>
                    <span className="text-slate-400">Total Disbursed</span>
                    <span className="block text-slate-800 font-black text-sm">₹{Number(activeLoan.disbursedAmount).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Outstanding Dues</span>
                    <span className="block text-rose-600 font-black text-sm">₹{Number(activeLoan.outstandingAmount).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Interest rate</span>
                    <span className="block text-slate-800 font-bold">{Number(activeLoan.interestRate)}% ({activeLoan.interestType})</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Tenure Duration</span>
                    <span className="block text-slate-800 font-bold">{activeLoan.tenure} Months</span>
                  </div>
                </div>

                <div className="overflow-x-auto mt-6">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase">
                        <th className="py-3 px-3 bg-slate-50 rounded-l-xl">Installment #</th>
                        <th className="py-3 px-3 bg-slate-50">Due Date & Day</th>
                        <th className="py-3 px-3 bg-slate-50">Principal Portion</th>
                        <th className="py-3 px-3 bg-slate-50">Interest Portion</th>
                        <th className="py-3 px-3 bg-slate-50">Late / Penalty fees</th>
                        <th className="py-3 px-3 bg-slate-50">Total Amount Due</th>
                        <th className="py-3 px-3 bg-slate-50">Paid Date</th>
                        <th className="py-3 px-3 bg-slate-50 rounded-r-xl">EMI Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {activeLoan.schedules.map((sch: any) => (
                        <tr key={sch.id} className="hover:bg-slate-50/50">
                          <td className="py-3.5 px-3 font-bold text-slate-900">EMI #{sch.installmentNo}</td>
                          <td className="py-3.5 px-3 text-slate-700">{formatDateAndDay(sch.dueDate)}</td>
                          <td className="py-3.5 px-3 text-slate-600">₹{Number(sch.principal).toLocaleString()}</td>
                          <td className="py-3.5 px-3 text-slate-600">₹{Number(sch.interest).toLocaleString()}</td>
                          <td className="py-3.5 px-3 text-rose-600">₹{(Number(sch.penaltyAccrued) + Number(sch.lateFeeAccrued)).toLocaleString()}</td>
                          <td className="py-3.5 px-3 font-bold text-slate-900">₹{Number(sch.amountDue).toLocaleString()}</td>
                          <td className="py-3.5 px-3 text-slate-500">{sch.paidAt ? new Date(sch.paidAt).toLocaleDateString() : '-'}</td>
                          <td className="py-3.5 px-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              sch.status === 'PAID' 
                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                                : sch.status === 'OVERDUE' 
                                ? 'bg-rose-50 text-rose-600 border border-rose-100 animate-pulse' 
                                : 'bg-slate-100 text-slate-500 border border-slate-200'
                            }`}>
                              {sch.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              !latestApplication && (
                <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm text-center">
                  <p className="text-slate-400 text-sm font-semibold">No active loan accounts or submitted applications found.</p>
                </div>
              )
            )}
          </div>
        )}

        {/* TAB 2: E-MANDATE DETAILS */}
        {currentTab === 'mandate' && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h1 className="text-2xl font-black text-slate-900">E-Mandate Details</h1>
              <p className="text-slate-500 text-xs">Verify your HDFC/SBI/ICICI bank automated EMI mandate status.</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
              {latestApplication?.mandate ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs font-semibold">
                    <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl">
                      <span className="text-slate-400 block uppercase">Razorpay Mandate ID</span>
                      <span className="text-slate-800 font-mono font-bold mt-1 block">{latestApplication.mandate.razorpayMandateId || 'MOCK_MANDATE_ID'}</span>
                    </div>

                    <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl">
                      <span className="text-slate-400 block uppercase">Authorization Mode</span>
                      <span className="text-slate-800 font-bold mt-1 block">Netbanking / Debit Card</span>
                    </div>

                    <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl">
                      <span className="text-slate-400 block uppercase">Mandate Status</span>
                      <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-black uppercase mt-1 ${
                        latestApplication.mandate.status === 'ACTIVE' 
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' 
                          : 'bg-amber-50 text-amber-600 border border-amber-200'
                      }`}>
                        {latestApplication.mandate.status}
                      </span>
                    </div>
                  </div>

                  {latestApplication.mandate.status !== 'ACTIVE' && latestApplication.mandate.authUrl && (
                    <div className="pt-2 text-center">
                      <p className="text-xs text-slate-500 font-semibold mb-3">Please authorize your recurring bank collection mandate:</p>
                      <a
                        href={latestApplication.mandate.authUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95"
                      >
                        Authorize Mandate Link
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400 text-xs font-semibold">
                  <Landmark className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  No active e-mandate configured. Contact your store merchant to set up recurring drafts.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: UPLOADED DOCUMENTS */}
        {currentTab === 'documents' && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h1 className="text-2xl font-black text-slate-900">KYC Upload Vault</h1>
              <p className="text-slate-500 text-xs">Verify your uploaded documents and review verification flags.</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
              {!profile ? (
                <p className="text-slate-400 text-center py-4 text-xs font-semibold">Profile details not initialized.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {['PAN', 'AADHAAR', 'BANK_PROOF', 'SELFIE'].map((docType) => {
                    const fileInfo = profile.documents?.find((d: any) => d.type === docType);
                    const isUploading = uploadState[docType]?.uploading;

                    return (
                      <div key={docType} className="bg-slate-50 border border-slate-250 rounded-2xl p-5 flex flex-col justify-between space-y-4">
                        <div>
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-extrabold text-slate-900 text-xs tracking-wide uppercase">{docType.replace('_', ' ')}</h3>
                            {fileInfo && (
                              <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider ${
                                fileInfo.status === 'VERIFIED' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                fileInfo.status === 'REJECTED' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                                'bg-amber-50 text-amber-600 border border-amber-100'
                              }`}>
                                {fileInfo.status}
                              </span>
                            )}
                          </div>
                          {fileInfo ? (
                            <div className="text-[11px] text-slate-500 space-y-1 font-semibold">
                              <p>Storage Version: <span className="text-indigo-600 font-bold">{fileInfo.version}</span></p>
                              {fileInfo.rejectionReason && (
                                <p className="text-rose-600 font-bold">Reason: {fileInfo.rejectionReason}</p>
                              )}
                            </div>
                          ) : (
                            <p className="text-[11px] text-slate-400 font-semibold">Missing document scan.</p>
                          )}
                        </div>

                        <div>
                          <label className="block w-full py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-center text-xs font-bold rounded-xl cursor-pointer transition-all active:scale-[0.98]">
                            {isUploading ? 'Uploading...' : fileInfo ? 'Update File' : 'Upload File'}
                            <input
                              type="file"
                              accept="image/*,application/pdf"
                              className="hidden"
                              disabled={isUploading}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleFileUpload(docType, file);
                              }}
                            />
                          </label>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
    </DashboardLayout>
  );
}
