'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../providers';

// Import dashboards
import CustomerDashboard from '@/components/dashboard/CustomerDashboard';
import MerchantDashboard from '@/components/dashboard/MerchantDashboard';
import AdminDashboard from '@/components/dashboard/AdminDashboard';
import MerchantOnboarding from '@/components/dashboard/MerchantOnboarding';

export default function DashboardPage() {
  const { user, loading, logout, switchRole } = useAuth();
  const [isDevMode, setIsDevMode] = useState(false);
  const router = useRouter();

  // Onboarding feedback comments timeline states
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loadingTimeline, setLoadingTimeline] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  const fetchTimeline = async () => {
    setLoadingTimeline(true);
    try {
      const res = await fetch('/api/merchant/onboarding-comments');
      if (res.ok) {
        const data = await res.json();
        setTimeline(data.timeline || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTimeline(false);
    }
  };

  const handlePostReply = async () => {
    if (!replyText.trim()) return;
    setSubmittingReply(true);
    try {
      const res = await fetch('/api/merchant/onboarding-comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: replyText.trim() }),
      });
      if (res.ok) {
        setReplyText('');
        fetchTimeline();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingReply(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'MERCHANT' && user.merchantStatus !== 'APPROVED') {
      fetchTimeline();
    }
  }, [user]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const saved = localStorage.getItem('dev_mode');
    setIsDevMode(saved === 'true');
  }, []);

  if (loading || !user) {
    return (
      <div className="flex flex-1 justify-center items-center bg-slate-50 min-h-screen">
        <div className="text-center space-y-4">
          <span className="inline-block w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></span>
          <p className="text-slate-500 text-sm font-semibold">Verifying secure JWT session...</p>
        </div>
      </div>
    );
  }

  const renderTimelineSection = () => {
    if (loadingTimeline && timeline.length === 0) {
      return <div className="text-center py-4 text-xs font-bold text-slate-400">Loading onboarding feedback...</div>;
    }
    return (
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-6 shadow-xl space-y-4 text-left text-xs text-slate-700">
        <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider border-b border-slate-100 pb-2 flex justify-between items-center">
          <span>💬 Onboarding Feedback History</span>
          <button onClick={fetchTimeline} className="text-[10px] text-indigo-600 hover:underline cursor-pointer">Refresh</button>
        </h3>
        {timeline.length === 0 ? (
          <p className="text-slate-400 text-center py-4 font-semibold">No feedback log history available.</p>
        ) : (
          <div className="space-y-3 max-h-[180px] overflow-y-auto pr-1 flex flex-col">
            {timeline.map((item) => {
              const isMe = item.sender.id === user.id;
              if (item.type === 'AUDIT') {
                return (
                  <div key={item.id} className="mx-auto my-1 py-0.5 px-2.5 bg-slate-150 border border-slate-200 text-slate-550 rounded-full text-[9px] font-black uppercase text-center">
                    ⚙️ {item.text}
                  </div>
                );
              }
              return (
                <div 
                  key={item.id} 
                  className={`flex flex-col max-w-[85%] rounded-2xl p-2.5 shadow-3xs mb-1 ${
                    isMe 
                      ? 'bg-[#1E2B58] text-white ml-auto' 
                      : 'bg-slate-50 text-slate-800 mr-auto border border-slate-150'
                  }`}
                >
                  <span className={`text-[8px] font-black uppercase mb-0.5 ${isMe ? 'text-indigo-200' : 'text-slate-450'}`}>
                    {item.sender.name} ({item.sender.role})
                  </span>
                  <p className="font-semibold leading-relaxed text-[10.5px]">{item.text}</p>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex gap-2 border-t border-slate-100 pt-3">
          <input
            type="text"
            placeholder="Type message to administrator..."
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handlePostReply(); }}
            className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-850 text-xs font-semibold focus:outline-none"
          />
          <button
            onClick={handlePostReply}
            disabled={submittingReply || !replyText.trim()}
            className="px-3.5 py-2 bg-indigo-650 hover:bg-indigo-750 text-white text-[11px] font-bold rounded-xl disabled:bg-slate-200 disabled:text-slate-400 shadow-sm cursor-pointer"
          >
            Send
          </button>
        </div>
      </div>
    );
  };

  const renderDashboard = () => {
    switch (user.role) {
      case 'CUSTOMER':
        return <CustomerDashboard user={user} />;
      case 'MERCHANT':
        if (user.merchantStatus === 'APPROVED') {
          return <MerchantDashboard user={user} />;
        } else if (user.merchantStatus === 'PENDING_APPROVAL') {
          return (
            <div className="flex flex-col flex-1 items-center justify-center p-6 bg-slate-50 min-h-[70vh] text-slate-800 space-y-6">
              <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-8 text-center space-y-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-2 bg-amber-500"></div>
                <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center text-3xl mx-auto animate-pulse">
                  ⏳
                </div>
                <h2 className="text-xl font-black text-slate-900 leading-tight">Application Under Review</h2>
                <p className="text-slate-500 text-xs font-semibold leading-relaxed">
                  Thank you for submitting your onboarding application! Your credentials, documents, and settlement details are currently being reviewed by our administrative team.
                </p>
                <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-100 text-amber-800 text-[11px] font-bold">
                  ✓ Profile Uploaded • ✓ KYC Documents Saved • ⏳ Awaiting Administrator Sign-off
                </div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  Disbursals will unlock immediately once approved.
                </p>
              </div>
              {renderTimelineSection()}
            </div>
          );
        } else {
          return (
            <div className="flex flex-col flex-1 p-6 bg-slate-50 space-y-6 max-w-4xl mx-auto">
              {user.merchantStatus === 'REJECTED' && (
                <div className="w-full p-4 rounded-2xl bg-rose-50 border border-rose-250 text-rose-600 text-xs font-bold text-center flex items-center justify-center gap-2 shadow-sm">
                  <span>❌ Your application was rejected by the administrator. Please review your details below and resubmit.</span>
                </div>
              )}
              {renderTimelineSection()}
              <MerchantOnboarding 
                user={user} 
                onOnboardingSubmitted={(updatedUser) => {
                  window.location.reload();
                }} 
              />
            </div>
          );
        }
      case 'LOAN_OFFICER':
      case 'OPERATIONS':
      case 'FINANCE':
      case 'COLLECTIONS':
      case 'ADMIN':
      case 'SUPER_ADMIN':
        return <AdminDashboard user={user} />;
      default:
        return (
          <div className="p-8 text-center text-rose-500 font-bold bg-rose-50 border border-rose-200 rounded-3xl">
            Unknown Role: {user.role}. Please contact support or switch roles.
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-800 font-sans">
      {/* DYNAMIC DASHBOARD CONTENT */}
      <main className="w-full flex-1 flex flex-col">
        {renderDashboard()}
      </main>
    </div>
  );
}
