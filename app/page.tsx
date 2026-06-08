'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from './providers';

function LoginPageContent() {
  const [activeTab, setActiveTab] = useState<'PHONE' | 'EMAIL' | 'SIGNUP'>('EMAIL');
  
  // Phone form
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [phoneStep, setPhoneStep] = useState<1 | 2>(1);
  const [mockPhoneOtp, setMockPhoneOtp] = useState<string | null>(null);

  // Email form
  const [email, setEmail] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [emailStep, setEmailStep] = useState<1 | 2>(1);
  const [mockEmailOtp, setMockEmailOtp] = useState<string | null>(null);

  // Signup form
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupRole, setSignupRole] = useState<'CUSTOMER' | 'MERCHANT'>('CUSTOMER');

  // Google Login state
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleRole, setGoogleRole] = useState<'CUSTOMER' | 'MERCHANT' | 'SUPER_ADMIN'>('CUSTOMER');
  const [showGoogleModal, setShowGoogleModal] = useState(false);

  // General state
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const { user, loginUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Redirect if already authenticated
    if (user) {
      router.push('/dashboard');
      return;
    }

    // Check for standard NextAuth session
    const checkNextAuthSession = async () => {
      try {
        const res = await fetch('/api/auth/session');
        const session = await res.json();
        if (session && session.user?.email) {
          setLoading(true);
          const callbackRes = await fetch('/api/auth/nextauth-callback');
          const data = await callbackRes.json();
          if (callbackRes.ok) {
            router.push(`/auth/google-otp?email=${encodeURIComponent(data.email)}&mockOtp=${data.mockOtp || ''}`);
          } else {
            setError(data.error || 'Failed to initialize Google 2FA OTP flow');
            setLoading(false);
          }
        }
      } catch (e) {
        console.error('Failed to check NextAuth session:', e);
      }
    };
    
    checkNextAuthSession();

    // Check search params for verification feedback
    const urlSuccess = searchParams.get('success');
    const urlError = searchParams.get('error');

    if (urlSuccess === 'email-verified') {
      setSuccess('Your email was successfully verified! You can now log in.');
    } else if (urlError === 'expired-or-invalid-token') {
      setError('The email verification link has expired or is invalid. Please sign up again.');
    } else if (urlError) {
      setError(`Error: ${urlError.replace(/-/g, ' ')}`);
    }
  }, [user, router, searchParams]);

  // Handle Phone OTP Request
  const handleSendPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!/^\+?[1-9]\d{9,14}$/.test(phoneNumber)) {
      setError('Please enter a valid phone number (e.g. +919876543210)');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send OTP');
      }

      setPhoneStep(2);
      if (data.mockOtp) {
        setMockPhoneOtp(data.mockOtp);
      }
      setSuccess('OTP sent successfully to phone.');
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Phone OTP Verification
  const handleVerifyPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, code: phoneOtp }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Invalid OTP code');
      }

      loginUser({
        id: data.user.id,
        phoneNumber: data.user.phoneNumber,
        role: data.user.role,
        email: data.user.email || undefined,
      });

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Email OTP Request
  const handleSendEmailOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to dispatch OTP');
      }

      setEmailStep(2);
      if (data.mockOtp) {
        setMockEmailOtp(data.mockOtp);
      }
      setSuccess('OTP sent successfully to email.');
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Email OTP Verification
  const handleVerifyEmailOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: emailOtp }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Invalid OTP code');
      }

      loginUser({
        id: data.user.id,
        phoneNumber: data.user.phoneNumber,
        role: data.user.role,
        email: data.user.email || undefined,
      });

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Signup Submit
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: signupName,
          email: signupEmail,
          phoneNumber: signupPhone,
          role: signupRole,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Signup failed');
      }

      if (data.directLogin) {
        loginUser({
          id: data.user.id,
          phoneNumber: data.user.phoneNumber,
          role: data.user.role,
          email: data.user.email || undefined,
          merchantStatus: data.user.merchantStatus || 'NOT_STARTED',
        });
        router.push('/dashboard');
        return;
      }

      if (data.mockVerifyLink) {
        setSuccess(`Account created! A verification link has been sent to your email. You must verify your account before logging in.\n\nSandbox Verification Link:\n${data.mockVerifyLink}`);
      } else {
        setSuccess('Account created! A verification link has been sent to your email. You must verify your account before logging in.');
      }
      
      // Clear signup form
      setSignupName('');
      setSignupEmail('');
      setSignupPhone('');
      
      // Switch back to email tab
      setActiveTab('EMAIL');
      setEmailStep(1);
    } catch (err: any) {
      setError(err.message || 'Signup failed.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Mock Google login (for developer sandboxed testing)
  const handleMockGoogleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    setShowGoogleModal(false);

    try {
      const res = await fetch('/api/auth/google-mock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: googleEmail, role: googleRole }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Google login simulation failed');
      }

      // Redirect to Google OTP verification screen
      router.push(`/auth/google-otp?email=${encodeURIComponent(googleEmail)}&mockOtp=${data.mockOtp}`);
    } catch (err: any) {
      setError(err.message || 'Google Auth failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 items-center justify-center p-4 bg-slate-950 min-h-screen relative overflow-hidden text-slate-100 font-sans">
      {/* Background glow meshes */}
      <div className="absolute top-1/4 left-1/4 w-[40rem] h-[40rem] bg-emerald-500 rounded-full blur-3xl opacity-[0.02] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[40rem] h-[40rem] bg-indigo-500 rounded-full blur-3xl opacity-[0.02] pointer-events-none"></div>

      <div className="max-w-lg w-full bg-slate-900/80 border border-slate-800/80 rounded-3xl p-6 md:p-10 shadow-2xl relative z-10 backdrop-blur-xl">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-2xl mb-4 shadow-inner shadow-emerald-400/5">
            ΛG
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-100">Antigravity LMS</h1>
          <p className="text-slate-400 text-sm mt-1.5 font-medium">Digital Lending Platform Sandbox Console</p>
        </div>

        {/* Notifications */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs text-center font-bold">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs text-center font-bold whitespace-pre-wrap break-all">
            {success}
          </div>
        )}

        {/* Auth Tab Selection */}
        <div className="grid grid-cols-3 bg-slate-950 p-1.5 rounded-2xl border border-slate-800/80 mb-8 text-xs font-bold uppercase tracking-wider">
          <button
            onClick={() => { setActiveTab('EMAIL'); setError(''); setSuccess(''); }}
            className={`py-3 rounded-xl transition-all ${
              activeTab === 'EMAIL' ? 'bg-slate-900 text-emerald-400 border border-slate-800/60 shadow-md shadow-emerald-500/5' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            Email OTP
          </button>
          <button
            onClick={() => { setActiveTab('PHONE'); setError(''); setSuccess(''); }}
            className={`py-3 rounded-xl transition-all ${
              activeTab === 'PHONE' ? 'bg-slate-900 text-emerald-400 border border-slate-800/60 shadow-md shadow-emerald-500/5' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            Phone OTP
          </button>
          <button
            onClick={() => { setActiveTab('SIGNUP'); setError(''); setSuccess(''); }}
            className={`py-3 rounded-xl transition-all ${
              activeTab === 'SIGNUP' ? 'bg-slate-900 text-emerald-400 border border-slate-800/60 shadow-md shadow-emerald-500/5' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Tab contents */}
        {activeTab === 'EMAIL' && (
          <div>
            {emailStep === 1 ? (
              <form onSubmit={handleSendEmailOtp} className="space-y-6">
                <div>
                  <label className="block text-slate-400 text-xs font-bold uppercase tracking-wide mb-2" htmlFor="email">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    className="w-full px-4 py-3.5 bg-slate-950 border border-slate-800 rounded-2xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition-all font-medium"
                  />
                  <p className="text-[11px] text-slate-500 mt-2 font-medium">
                    Enter your registered email address to receive a secure login verification OTP code.
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.99] text-slate-950 font-bold rounded-2xl shadow-lg shadow-emerald-500/15 transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <span className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    'Send Login OTP'
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyEmailOtp} className="space-y-6">
                <div>
                  <label className="block text-slate-400 text-xs font-bold uppercase tracking-wide mb-2" htmlFor="emailOtp">
                    Enter Verification OTP
                  </label>
                  <input
                    id="emailOtp"
                    type="text"
                    maxLength={6}
                    required
                    placeholder="000000"
                    value={emailOtp}
                    onChange={(e) => setEmailOtp(e.target.value)}
                    disabled={loading}
                    className="w-full px-4 py-3.5 bg-slate-950 border border-slate-800 rounded-2xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition-all font-mono text-center text-2xl tracking-widest"
                  />
                  {mockEmailOtp && (
                    <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs text-center rounded-xl font-bold font-mono">
                      Sandbox Code: {mockEmailOtp}
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.99] text-slate-950 font-bold rounded-2xl shadow-lg shadow-emerald-500/15 transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <span className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      'Verify & Log In'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEmailStep(1)}
                    disabled={loading}
                    className="w-full py-3.5 bg-transparent hover:bg-slate-800/40 text-slate-400 hover:text-slate-300 font-bold rounded-2xl transition-all"
                  >
                    Change Email Input
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {activeTab === 'PHONE' && (
          <div>
            {phoneStep === 1 ? (
              <form onSubmit={handleSendPhoneOtp} className="space-y-6">
                <div>
                  <label className="block text-slate-400 text-xs font-bold uppercase tracking-wide mb-2" htmlFor="phone">
                    Mobile Number
                  </label>
                  <input
                    id="phone"
                    type="text"
                    required
                    placeholder="+919876543210"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    disabled={loading}
                    className="w-full px-4 py-3.5 bg-slate-950 border border-slate-800 rounded-2xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition-all font-medium"
                  />
                  <p className="text-[11px] text-slate-500 mt-2 font-medium">
                    Try seeded numbers like <code className="text-emerald-400 font-mono font-bold">+919999999999</code> (Admin) or <code className="text-emerald-400 font-mono font-bold">+919876543210</code> (Customer).
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.99] text-slate-950 font-bold rounded-2xl shadow-lg shadow-emerald-500/15 transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <span className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    'Send SMS OTP'
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyPhoneOtp} className="space-y-6">
                <div>
                  <label className="block text-slate-400 text-xs font-bold uppercase tracking-wide mb-2" htmlFor="phoneOtp">
                    Enter Verification Code
                  </label>
                  <input
                    id="phoneOtp"
                    type="text"
                    maxLength={6}
                    required
                    placeholder="000000"
                    value={phoneOtp}
                    onChange={(e) => setPhoneOtp(e.target.value)}
                    disabled={loading}
                    className="w-full px-4 py-3.5 bg-slate-950 border border-slate-800 rounded-2xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition-all font-mono text-center text-2xl tracking-widest"
                  />
                  {mockPhoneOtp && (
                    <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs text-center rounded-xl font-bold font-mono">
                      Sandbox Code: {mockPhoneOtp}
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.99] text-slate-950 font-bold rounded-2xl shadow-lg shadow-emerald-500/15 transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <span className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      'Verify & Log In'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPhoneStep(1)}
                    disabled={loading}
                    className="w-full py-3.5 bg-transparent hover:bg-slate-800/40 text-slate-400 hover:text-slate-300 font-bold rounded-2xl transition-all"
                  >
                    Change Phone Input
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {activeTab === 'SIGNUP' && (
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-slate-400 text-xs font-bold uppercase tracking-wide mb-1" htmlFor="signupName">
                Full Name
              </label>
              <input
                id="signupName"
                type="text"
                required
                placeholder="John Doe"
                value={signupName}
                onChange={(e) => setSignupName(e.target.value)}
                disabled={loading}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 transition-all font-medium text-sm"
              />
            </div>
            <div>
              <label className="block text-slate-400 text-xs font-bold uppercase tracking-wide mb-1" htmlFor="signupEmail">
                Email Address
              </label>
              <input
                id="signupEmail"
                type="email"
                required
                placeholder="john@company.com"
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                disabled={loading}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 transition-all font-medium text-sm"
              />
            </div>
            <div>
              <label className="block text-slate-400 text-xs font-bold uppercase tracking-wide mb-1" htmlFor="signupPhone">
                Mobile Number (E.164)
              </label>
              <input
                id="signupPhone"
                type="text"
                required
                placeholder="+919876543210"
                value={signupPhone}
                onChange={(e) => setSignupPhone(e.target.value)}
                disabled={loading}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 transition-all font-medium text-sm"
              />
            </div>
            <div>
              <label className="block text-slate-400 text-xs font-bold uppercase tracking-wide mb-1">
                Account Role
              </label>
              <select
                value={signupRole}
                onChange={(e) => setSignupRole(e.target.value as any)}
                disabled={loading}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-emerald-500/50 transition-all font-medium text-sm"
              >
                <option value="CUSTOMER">Customer Account</option>
                <option value="MERCHANT">Merchant Account</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.99] text-slate-950 font-bold rounded-2xl shadow-lg shadow-emerald-500/15 transition-all flex items-center justify-center gap-2 mt-6 text-sm"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
              ) : (
                'Create Account & Send Verification'
              )}
            </button>
          </form>
        )}

        {/* Divider */}
        <div className="flex items-center my-6 text-slate-600 text-xs font-bold tracking-widest uppercase">
          <div className="flex-1 h-px bg-slate-800/80"></div>
          <span className="px-4">Or Connect With</span>
          <div className="flex-1 h-px bg-slate-800/80"></div>
        </div>

        {/* Social login buttons */}
        <div className="space-y-3">
          <button
            onClick={async () => {
              setError('');
              setSuccess('');
              setLoading(true);
              try {
                const configRes = await fetch('/api/auth/config');
                const config = await configRes.json();
                if (config.isMockGoogle) {
                  setLoading(false);
                  setShowGoogleModal(true);
                } else {
                  const { signIn } = await import('next-auth/react');
                  await signIn('google');
                }
              } catch (err: any) {
                setError('Google Authentication service connection failed');
                setLoading(false);
              }
            }}
            className="w-full py-4 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl text-slate-300 font-bold flex items-center justify-center gap-3 transition-all active:scale-[0.99]"
            disabled={loading}
          >
            <svg className="w-5 h-5 text-indigo-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign In with Google
          </button>
        </div>
      </div>

      {/* Google Sign In Simulator Modal */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl relative">
            <h2 className="text-xl font-bold flex items-center gap-2 text-indigo-400">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              </svg>
              Google Login Simulation Console
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Google OAuth integration is enabled. Enter any test email address to simulate the NextAuth Google redirect and trigger the 2FA login verification code.
            </p>
            <form onSubmit={handleMockGoogleLogin} className="space-y-4">
              <div>
                <label className="block text-slate-500 text-xs font-semibold mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="name@gmail.com"
                  value={googleEmail}
                  onChange={(e) => setGoogleEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
                />
              </div>
              <div>
                <label className="block text-slate-500 text-xs font-semibold mb-1">Target Account Role</label>
                <select
                  value={googleRole}
                  onChange={(e) => setGoogleRole(e.target.value as any)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
                >
                  <option value="CUSTOMER">Customer</option>
                  <option value="MERCHANT">Merchant</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-indigo-500 hover:bg-indigo-600 text-slate-100 font-bold rounded-2xl active:scale-[0.98] transition-all text-sm"
                >
                  Simulate Google Login
                </button>
                <button
                  type="button"
                  onClick={() => setShowGoogleModal(false)}
                  className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-400 font-bold rounded-2xl text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-1 justify-center items-center bg-slate-950 min-h-screen text-slate-400">
        Loading...
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  );
}
