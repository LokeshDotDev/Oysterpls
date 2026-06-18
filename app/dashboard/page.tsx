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

  const renderDashboard = () => {
    switch (user.role) {
      case 'CUSTOMER':
        return <CustomerDashboard user={user} />;
      case 'MERCHANT':
        if (user.merchantStatus === 'APPROVED') {
          return <MerchantDashboard user={user} />;
        } else if (user.merchantStatus === 'PENDING_APPROVAL') {
          return (
            <div className="flex flex-col flex-1 items-center justify-center p-6 bg-slate-50 min-h-[70vh] text-slate-800">
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
            </div>
          );
        } else {
          return (
            <div className="flex flex-col flex-1 p-6 bg-slate-50">
              {user.merchantStatus === 'REJECTED' && (
                <div className="max-w-3xl w-full mx-auto mb-4 p-4 rounded-2xl bg-rose-50 border border-rose-250 text-rose-600 text-xs font-bold text-center flex items-center justify-center gap-2 shadow-sm">
                  <span>❌ Your application was rejected by the administrator. Please review your details below and resubmit.</span>
                </div>
              )}
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
