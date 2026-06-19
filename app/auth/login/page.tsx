'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/providers';
import { Lock, Mail, ArrowRight, ShieldAlert, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const { user, loginUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If already logged in, redirect to dashboard
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Password login failed');
      }

      loginUser({
        id: data.user.id,
        phoneNumber: data.user.phoneNumber,
        role: data.user.role,
        email: data.user.email || undefined,
        merchantStatus: data.user.merchantStatus || 'NOT_STARTED',
      });

      setSuccess('Login successful! Redirecting...');
      setTimeout(() => {
        router.push('/dashboard');
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 font-sans flex flex-col justify-center items-center relative p-6 overflow-hidden">
      
      {/* Decorative Orbs */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#1E2B58]/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-900/30 rounded-full blur-3xl pointer-events-none" />

      {/* Back button */}
      <Link 
        href="/" 
        className="absolute top-6 left-6 text-slate-400 hover:text-white flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </Link>

      <div className="w-full max-w-md bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-3xl p-8 md:p-10 shadow-2xl space-y-8 relative z-10">
        
        {/* Brand/Logo Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#1E2B58] to-indigo-500 text-white items-center justify-center font-black text-xl shadow-lg">
            O
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight leading-none">Oysterpls LMS</h1>
            <span className="text-[10px] font-black uppercase tracking-widest text-[#10B981] mt-1 block">Secure Portal Access</span>
          </div>
        </div>

        {/* Error/Success alerts */}
        {error && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-2xl text-xs text-center font-bold flex items-center justify-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-2xl text-xs text-center font-bold">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 text-xs font-bold">
          <div className="space-y-1.5">
            <label className="block text-slate-400 uppercase tracking-wider" htmlFor="identifier">
              Email Address or Phone Number
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-505" />
              <input
                id="identifier"
                type="text"
                required
                placeholder="name@email.com or +91..."
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                disabled={loading}
                className="w-full pl-11 pr-4 py-3 bg-white/[0.02] hover:bg-white/[0.04] focus:bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all font-semibold text-xs"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-slate-400 uppercase tracking-wider" htmlFor="password">
              Account Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-550" />
              <input
                id="password"
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="w-full pl-11 pr-4 py-3 bg-white/[0.02] hover:bg-white/[0.04] focus:bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all font-semibold text-xs"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 active:scale-[0.99] text-white font-extrabold rounded-2xl shadow-lg shadow-indigo-500/10 transition-all flex items-center justify-center gap-2 cursor-pointer mt-6 text-xs uppercase tracking-wider"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                <span>Sign In Securely</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center text-xs font-semibold text-slate-400 pt-2 border-t border-white/[0.05]">
          Need an account?{' '}
          <Link href="/auth/signup" className="text-indigo-400 hover:text-indigo-300 font-extrabold uppercase text-[10px] tracking-wide ml-1">
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
}
