'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/app/providers';

function GoogleOtpContent() {
  const [otpCode, setOtpCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [mockOtp, setMockOtp] = useState<string | null>(null);
  
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const initialMockOtp = searchParams.get('mockOtp') || null;

  const { user, loginUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
    if (initialMockOtp) {
      setMockOtp(initialMockOtp);
    }
  }, [user, router, initialMockOtp]);

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (otpCode.length !== 6) {
      setError('Verification code must be exactly 6 digits');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: otpCode }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Invalid OTP code');
      }

      setSuccess('Verification successful! Logging in...');

      // Save user to Auth Context
      loginUser({
        id: data.user.id,
        phoneNumber: data.user.phoneNumber,
        role: data.user.role,
        email: data.user.email || undefined,
      });

      setTimeout(() => {
        router.push('/dashboard');
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'OTP verification failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 items-center justify-center p-4 bg-slate-950 min-h-screen relative overflow-hidden text-slate-100">
      {/* Glow meshes */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500 rounded-full blur-3xl opacity-[0.03] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500 rounded-full blur-3xl opacity-[0.03] pointer-events-none"></div>

      <div className="max-w-md w-full bg-slate-900 border border-slate-800/80 rounded-3xl p-8 md:p-10 shadow-2xl relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold text-xl mb-4 font-sans">
            G
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">Google 2FA Verification</h1>
          <p className="text-slate-400 text-sm mt-1">An OTP verification code was sent to:</p>
          <p className="text-emerald-400 font-semibold font-mono text-sm mt-0.5">{email}</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm text-center font-medium">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm text-center font-medium">
            {success}
          </div>
        )}

        <form onSubmit={handleVerifyOtp} className="space-y-6">
          <div>
            <label className="block text-slate-400 text-sm font-medium mb-2" htmlFor="otp">
              6-Digit OTP Code
            </label>
            <input
              id="otp"
              type="text"
              maxLength={6}
              placeholder="000000"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-3.5 bg-slate-950 border border-slate-800 rounded-2xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all font-mono text-center text-2xl tracking-widest"
            />
            
            {mockOtp && (
              <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs text-center rounded-xl font-medium">
                Sandbox Mode OTP: <span className="font-bold underline font-mono text-sm">{mockOtp}</span>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-indigo-500 hover:bg-indigo-600 active:scale-[0.99] text-slate-100 font-bold rounded-2xl shadow-lg shadow-indigo-500/15 transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-slate-100 border-t-transparent rounded-full animate-spin"></span>
            ) : (
              'Verify OTP & Enter App'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function GoogleOtpPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-1 justify-center items-center bg-slate-950 min-h-screen text-slate-400">
        Loading...
      </div>
    }>
      <GoogleOtpContent />
    </Suspense>
  );
}
