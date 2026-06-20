'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/providers';
import { Lock, Mail, Phone, User, ArrowRight, ShieldAlert, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function SignupPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'CUSTOMER' | 'MERCHANT'>('CUSTOMER');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const { user, loginUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect if already authenticated
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
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          email,
          phoneNumber,
          role,
          password
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      if (data.directLogin) {
        loginUser({
          id: data.user.id,
          phoneNumber: data.user.phoneNumber,
          role: data.user.role,
          email: data.user.email || undefined,
          merchantStatus: data.user.merchantStatus || 'NOT_STARTED',
        });
        setSuccess('Registration successful! Redirecting to dashboard...');
        setTimeout(() => {
          router.push('/dashboard');
        }, 1000);
        return;
      }

      if (data.mockVerifyLink) {
        setSuccess(`Account created successfully! We've sent a verification link to your email address. You must verify your account before logging in.\n\nSandbox Auto-Verification Link:\n${data.mockVerifyLink}`);
      } else {
        setSuccess("Account created successfully! We've sent a verification link to your email address. Please verify your account to log in.");
      }

      // Clear fields on success for non-direct login
      setFullName('');
      setEmail('');
      setPhoneNumber('');
      setPassword('');

    } catch (err: any) {
      setError(err.message || 'Signup failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col justify-center items-center relative p-6 overflow-hidden">
      
      {/* Decorative Orbs */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-100/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-200/30 rounded-full blur-3xl pointer-events-none" />

      {/* Back button */}
      <Link 
        href="/" 
        className="absolute top-6 left-6 text-slate-505 hover:text-slate-800 flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </Link>

      <div className="w-full max-w-md bg-white border border-slate-250/80 rounded-3xl p-8 md:p-10 shadow-xl space-y-8 relative z-10 my-12">
        
        {/* Brand/Logo Header */}
        <div className="text-center space-y-2">
          <img src="/oysterlogo.png" alt="Oysterpls Logo" className="mx-auto h-20 w-auto object-contain mb-2" />
          <div>
            <h1 className="text-2xl font-black text-[#1E2B58] tracking-tight leading-none">Oysterpls LMS</h1>
            <span className="text-[10px] font-black uppercase tracking-widest text-[#10B981] mt-1 block">Account Registration</span>
          </div>
        </div>

        {/* Error/Success alerts */}
        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-750 rounded-2xl text-xs text-center font-bold flex items-center justify-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-250 text-emerald-750 rounded-2xl text-xs text-left font-bold whitespace-pre-wrap break-all leading-relaxed">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-bold">
          <div className="space-y-1.5">
            <label className="block text-slate-500 uppercase tracking-wider" htmlFor="fullName">
              Full Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="fullName"
                type="text"
                required
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={loading}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-905 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-500 transition-all font-semibold text-xs"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-slate-500 uppercase tracking-wider" htmlFor="email">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="email"
                type="email"
                required
                placeholder="name@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-905 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-500 transition-all font-semibold text-xs"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-slate-500 uppercase tracking-wider" htmlFor="phoneNumber">
              Mobile Number (E.164 format)
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="phoneNumber"
                type="text"
                required
                placeholder="+919876543210"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                disabled={loading}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-905 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-500 transition-all font-semibold text-xs"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-slate-500 uppercase tracking-wider" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="password"
                type="password"
                required
                placeholder="At least 6 characters..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-905 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-500 transition-all font-semibold text-xs"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-slate-500 uppercase tracking-wider">
              Account Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
              disabled={loading}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500 transition-all font-semibold text-xs cursor-pointer"
            >
              <option value="CUSTOMER">Customer Portal</option>
              <option value="MERCHANT">Merchant Store Console</option>
            </select>
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
                <span>Register Account</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center text-xs font-semibold text-slate-500 pt-3 border-t border-slate-100">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-indigo-600 hover:text-indigo-700 font-extrabold uppercase text-[10px] tracking-wide ml-1">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
