'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../providers';

// Import dashboards
import CustomerDashboard from '@/components/dashboard/CustomerDashboard';
import MerchantDashboard from '@/components/dashboard/MerchantDashboard';
import AdminDashboard from '@/components/dashboard/AdminDashboard';

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
        return <MerchantDashboard user={user} />;
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
      {/* GLOBAL NAVBAR */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-3.5 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-lg">
              ΛG
            </div>
            <div>
              <h1 className="font-extrabold text-base text-slate-900 leading-tight">Antigravity Lending System</h1>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black">CTO Operations Console</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {/* DEV MODE TOGGLE BUTTON */}
            <button
              onClick={() => {
                const val = !isDevMode;
                setIsDevMode(val);
                localStorage.setItem('dev_mode', String(val));
              }}
              className={`px-3 py-1.5 text-[11px] font-bold rounded-xl border transition-all ${
                isDevMode
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 hover:bg-amber-500/20'
                  : 'bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200'
              }`}
            >
              {isDevMode ? '🛠 Dev Mode: ON' : '🛡 Production Mode'}
            </button>

            {/* DEVELOPMENT ROLE SWITCHER SIMULATOR */}
            {isDevMode && (
              <div className="flex items-center bg-slate-100 border border-slate-200 rounded-2xl px-3.5 py-1.5 gap-2 text-xs font-semibold">
                <span className="text-slate-500">Developer Switch:</span>
                <select
                  value={user.role}
                  onChange={(e) => switchRole(e.target.value)}
                  className="bg-transparent border-none text-indigo-600 focus:outline-none cursor-pointer font-bold uppercase"
                >
                  <option value="CUSTOMER">Customer View</option>
                  <option value="MERCHANT">Merchant View</option>
                  <option value="ADMIN">Admin Console</option>
                  <option value="SUPER_ADMIN">Super Admin View</option>
                </select>
              </div>
            )}

            {/* Session details */}
            <div className="text-right hidden sm:block">
              <span className="block text-[10px] text-slate-400 uppercase tracking-wider font-bold">Session Contact</span>
              <span className="text-slate-700 font-bold text-xs">{user.phoneNumber}</span>
            </div>

            {/* Log Out button */}
            <button
              onClick={logout}
              className="px-4 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-600 text-xs font-bold rounded-xl transition-all"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* DYNAMIC DASHBOARD CONTENT */}
      <main className="w-full flex-1 flex flex-col">
        {renderDashboard()}
      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-slate-400 text-[11px]">
        <p>© 2026 Antigravity Digital Lending Technologies. Protected sandbox environment.</p>
      </footer>
    </div>
  );
}
