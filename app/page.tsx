'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from './providers';
import { 
  Smartphone, ShieldCheck, Zap, Coins, ArrowRight, 
  CheckCircle2, Lock, Mail, Phone, ShieldAlert, Sparkles, Check, 
  ChevronRight, Building, HelpCircle, Layers, FileText, Landmark
} from 'lucide-react';

function LoginPageContent() {
  const [activeTab, setActiveTab] = useState<'PHONE' | 'EMAIL' | 'SIGNUP' | 'PASSWORD'>('EMAIL');
  
  // Password login
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
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

  // Interactive Calculator State
  const [calcAmount, setCalcAmount] = useState(45000);
  const [calcTenure, setCalcTenure] = useState(6);

  const { user, loginUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Calculated values
  const downPayment = Math.round(calcAmount * 0.20); // 20% down payment
  const principal = calcAmount - downPayment;
  const estimatedEMI = Math.round((principal * (1 + 0.12 * (calcTenure / 12))) / calcTenure); // 12% flat rate p.a.
  const processingFee = 999;

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

  // Handle Password Login
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: loginIdentifier, password: loginPassword }),
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

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed.');
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

  // Smooth scroll handler
  const scrollToId = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFD] text-slate-800 font-sans selection:bg-indigo-100 flex flex-col relative overflow-x-hidden">
      
      {/* Decorative Gradient Background Accents */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-indigo-100/30 via-sky-50/10 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-[40%] left-[-100px] w-[500px] h-[500px] bg-gradient-to-tr from-emerald-50/20 via-indigo-50/10 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-[-100px] w-[600px] h-[600px] bg-gradient-to-tl from-sky-100/20 via-slate-50/10 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* STICKY TOP NAVIGATION HEADER */}
      <header className="sticky top-0 bg-white/85 backdrop-blur-md border-b border-slate-200/50 z-50 px-6 py-4 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo Brand */}
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#1E2B58] to-indigo-500 text-white flex items-center justify-center font-black text-md shadow-md shadow-[#1E2B58]/10">
              O
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-[#1E2B58]">Oysterpls</span>
              <span className="text-[9px] block font-extrabold uppercase tracking-widest text-[#10B981] mt-0.5">Fintech Financing</span>
            </div>
          </div>

          {/* Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-bold text-slate-500 uppercase tracking-wider">
            <button onClick={() => scrollToId('what-why')} className="hover:text-[#1E2B58] transition-colors cursor-pointer">What & Why</button>
            <button onClick={() => scrollToId('how-it-works')} className="hover:text-[#1E2B58] transition-colors cursor-pointer">How It Works</button>
            <button onClick={() => scrollToId('calculator')} className="hover:text-[#1E2B58] transition-colors cursor-pointer">EMI Simulator</button>
            <button onClick={() => scrollToId('portal')} className="hover:text-[#1E2B58] transition-colors cursor-pointer">Access Portal</button>
          </nav>

          {/* Header CTA Button */}
          <div>
            <button 
              onClick={() => scrollToId('portal')}
              className="px-5 py-2.5 bg-[#1E2B58] hover:bg-[#2c3d75] text-white text-xs font-bold rounded-xl transition-all shadow-sm shadow-[#1E2B58]/10 flex items-center gap-1.5 cursor-pointer"
            >
              Sign In <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-12 space-y-28 relative z-10">
        
        {/* HERO SECTION */}
        <section className="text-center max-w-4xl mx-auto space-y-8 pt-6 md:pt-12">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-full text-indigo-700 text-[10px] font-black uppercase tracking-wider shadow-xs animate-bounce">
            <Sparkles className="w-3.5 h-3.5" /> Instant POS Device Financing
          </div>

          {/* Slogan */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-[#1E2B58] tracking-tight leading-tight">
            Buy Your Next Smartphone Today. <br />
            <span className="bg-gradient-to-r from-indigo-600 to-sky-600 bg-clip-text text-transparent">Pay in Easy Monthly EMIs.</span>
          </h1>

          {/* Description */}
          <p className="text-slate-500 text-sm md:text-base leading-relaxed max-w-2xl mx-auto font-semibold">
            Oysterpls is an enterprise-grade Loan Management System (LMS) linking customers, merchants, and lenders. We deliver automated credit assessment, instant digital KYC checks, and secure auto-debited e-mandates directly at store checkouts in under 5 minutes.
          </p>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
            <button 
              onClick={() => scrollToId('calculator')}
              className="w-full sm:w-auto px-8 py-4 bg-[#1E2B58] hover:bg-[#2c3d75] text-white text-xs font-black uppercase tracking-wider rounded-2xl transition-all shadow-md shadow-[#1E2B58]/10 flex items-center justify-center gap-2 cursor-pointer"
            >
              Simulate EMI <Coins className="w-4 h-4" />
            </button>
            <button 
              onClick={() => scrollToId('portal')}
              className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-slate-50 border border-slate-250 hover:border-slate-300 text-slate-700 text-xs font-black uppercase tracking-wider rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              Go to Auth Portal <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </section>

        {/* SECTION 1: WHAT & WHY IS OYSTERPLS */}
        <section id="what-why" className="space-y-12 scroll-mt-24">
          <div className="text-center space-y-2">
            <h2 className="text-2xl md:text-3xl font-black text-[#1E2B58] tracking-tight">What & Why</h2>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Why businesses & customers choose Oysterpls</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1: What it is */}
            <div className="bg-white border border-slate-200/70 p-8 rounded-3xl space-y-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <Building className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-[#1E2B58] uppercase tracking-wide">Enterprise Lending System</h3>
              <p className="text-slate-400 text-xs font-semibold leading-relaxed">
                Oysterpls connects three core pillars: retail mobile **Merchants** who initiate the loan, back-office **Lenders** who manage rules and underwriting, and **Customers** who access financed mobile plans.
              </p>
            </div>

            {/* Card 2: How it helps Merchants */}
            <div className="bg-white border border-slate-200/70 p-8 rounded-3xl space-y-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-[#1E2B58] uppercase tracking-wide">Instant POS Checkouts</h3>
              <p className="text-slate-400 text-xs font-semibold leading-relaxed">
                Rather than manual paperwork, merchants upload customer documents and invoice costs directly inside the console. Credit checks and eligibility decisions execute in real-time.
              </p>
            </div>

            {/* Card 3: Secure LMS Operations */}
            <div className="bg-white border border-slate-200/70 p-8 rounded-3xl space-y-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-[#1E2B58] uppercase tracking-wide">Automatic Repayments</h3>
              <p className="text-slate-400 text-xs font-semibold leading-relaxed">
                No manual collection tracking needed. Integrated E-Nach mandates automatically schedule and debit EMIs from customer bank accounts, sending real-time status alerts.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 2: HOW IT WORKS (TIMELINE) */}
        <section id="how-it-works" className="space-y-12 scroll-mt-24">
          <div className="text-center space-y-2">
            <h2 className="text-2xl md:text-3xl font-black text-[#1E2B58] tracking-tight">How It Works</h2>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">A transparent 4-step mobile financing process</p>
          </div>

          <div className="relative">
            {/* Center connector line (Desktop) */}
            <div className="hidden lg:block absolute left-1/2 top-12 bottom-12 w-0.5 bg-slate-200 -translate-x-1/2" />

            <div className="space-y-12 lg:space-y-20">
              
              {/* Step 1 */}
              <div className="flex flex-col lg:flex-row items-center gap-6 lg:gap-12 relative">
                <div className="lg:w-1/2 lg:text-right space-y-2 order-2 lg:order-1">
                  <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-indigo-50 border border-indigo-100 text-indigo-700">Step 1</span>
                  <h3 className="text-base font-black text-[#1E2B58] uppercase tracking-wide">Onboarding & Document Upload</h3>
                  <p className="text-slate-400 text-xs font-semibold leading-relaxed lg:max-w-md lg:ml-auto">
                    The merchant registers the customer with basic phone and email inputs, uploading photo KYC documentation (PAN card, Aadhaar details) directly in the retail portal.
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-[#1E2B58] text-white flex items-center justify-center font-black text-xs z-10 order-1 lg:order-2">1</div>
                <div className="hidden lg:block lg:w-1/2 order-3" />
              </div>

              {/* Step 2 */}
              <div className="flex flex-col lg:flex-row items-center gap-6 lg:gap-12 relative">
                <div className="hidden lg:block lg:w-1/2" />
                <div className="w-10 h-10 rounded-full bg-[#1E2B58] text-white flex items-center justify-center font-black text-xs z-10">2</div>
                <div className="lg:w-1/2 space-y-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-indigo-50 border border-indigo-100 text-indigo-700">Step 2</span>
                  <h3 className="text-base font-black text-[#1E2B58] uppercase tracking-wide">Automated Verification Check</h3>
                  <p className="text-slate-400 text-xs font-semibold leading-relaxed lg:max-w-md">
                    Oysterpls' underwriting engine checks eligibility rules (such as CIBIL scores and region-specific restrictions) automatically, passing approval in under 30 seconds.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col lg:flex-row items-center gap-6 lg:gap-12 relative">
                <div className="lg:w-1/2 lg:text-right space-y-2 order-2 lg:order-1">
                  <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-indigo-50 border border-indigo-100 text-indigo-700">Step 3</span>
                  <h3 className="text-base font-black text-[#1E2B58] uppercase tracking-wide">Secure E-Mandate Setup</h3>
                  <p className="text-slate-400 text-xs font-semibold leading-relaxed lg:max-w-md lg:ml-auto">
                    The customer completes bank verification to activate recurring e-mandates (e-NACH). This ensures monthly EMI payments are deducted smoothly with zero manual tracking.
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-[#1E2B58] text-white flex items-center justify-center font-black text-xs z-10 order-1 lg:order-2">3</div>
                <div className="hidden lg:block lg:w-1/2 order-3" />
              </div>

              {/* Step 4 */}
              <div className="flex flex-col lg:flex-row items-center gap-6 lg:gap-12 relative">
                <div className="hidden lg:block lg:w-1/2" />
                <div className="w-10 h-10 rounded-full bg-[#1E2B58] text-white flex items-center justify-center font-black text-xs z-10">4</div>
                <div className="lg:w-1/2 space-y-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-indigo-50 border border-indigo-100 text-indigo-700">Step 4</span>
                  <h3 className="text-base font-black text-[#1E2B58] uppercase tracking-wide">E-Sign & Instant Disbursal</h3>
                  <p className="text-slate-400 text-xs font-semibold leading-relaxed lg:max-w-md">
                    The customer digitally e-signs the automatically generated loan agreement contract. The loan is immediately disbursed to the store merchant, and the customer receives their phone.
                  </p>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* SECTION 3: EMI CALCULATOR */}
        <section id="calculator" className="space-y-12 scroll-mt-24">
          <div className="text-center space-y-2">
            <h2 className="text-2xl md:text-3xl font-black text-[#1E2B58] tracking-tight">EMI Loan Simulator</h2>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Simulate purchase pricing parameters instantly</p>
          </div>

          <div className="max-w-3xl mx-auto bg-white border border-slate-200 p-8 rounded-3xl space-y-8 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              
              {/* Sliders Box */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                    <span>DEVICE VALUE</span>
                    <span className="text-[#1E2B58] text-sm font-black font-mono">₹{calcAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <input 
                    type="range" 
                    min={10000} 
                    max={120000} 
                    step={5000}
                    value={calcAmount}
                    onChange={(e) => setCalcAmount(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <div className="flex justify-between text-[9px] text-slate-400 font-extrabold">
                    <span>₹10,000</span>
                    <span>₹1,20,000</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="block text-xs font-bold text-slate-500">REPAYMENT PERIOD</span>
                  <div className="grid grid-cols-4 gap-2">
                    {[3, 6, 9, 12].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setCalcTenure(m)}
                        className={`py-2.5 text-xs font-black rounded-xl border transition-all ${
                          calcTenure === m
                            ? 'bg-[#1E2B58] border-[#1E2B58] text-white'
                            : 'bg-slate-50 border-slate-200 text-slate-650 hover:bg-slate-100'
                        }`}
                      >
                        {m} Mo
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Calculator Output summary card */}
              <div className="bg-[#F8FAFD] border border-slate-200 p-6 rounded-2xl space-y-4">
                <div className="flex justify-between items-center text-[10px] text-slate-400 font-black uppercase tracking-wider border-b border-slate-200/50 pb-2">
                  <span>Financing Breakdown</span>
                  <span className="text-emerald-600">Approved</span>
                </div>
                <div className="space-y-3 text-xs font-bold text-slate-600">
                  <div className="flex justify-between">
                    <span>Required Down Payment (20%):</span>
                    <span className="text-slate-800 font-mono">₹{downPayment.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Principal Financed Loan:</span>
                    <span className="text-slate-800 font-mono">₹{principal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Setup & Processing Fee:</span>
                    <span className="text-slate-800 font-mono">₹{processingFee}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200/50 pt-3 text-sm">
                    <span className="text-indigo-600 font-black">Estimated Monthly EMI:</span>
                    <span className="text-indigo-700 font-mono font-black">₹{estimatedEMI.toLocaleString('en-IN')}/mo</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* SECTION 4: ACCESS PORTAL (LOGIN/SIGNUP) */}
        <section id="portal" className="scroll-mt-24 max-w-lg mx-auto w-full pt-12">
          <div className="bg-white border border-slate-200/80 rounded-3xl p-8 md:p-10 shadow-xl space-y-8">
            
            {/* Form Title */}
            <div className="text-center space-y-1.5">
              <h2 className="text-2xl font-black text-[#1E2B58] tracking-tight">Access Secure Portal</h2>
              <p className="text-xs text-slate-450 font-bold uppercase tracking-wider">Select method to authenticate</p>
            </div>

            {/* Display banners */}
            {error && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-600 rounded-2xl text-xs text-center font-bold flex items-center justify-center gap-2 animate-fadeIn">
                <ShieldAlert className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-250 text-emerald-600 rounded-2xl text-xs text-center font-bold whitespace-pre-wrap break-all shadow-xs animate-fadeIn">
                {success}
              </div>
            )}

            {/* Premium White Navigation Tabs */}
            <div className="grid grid-cols-4 bg-slate-50 p-1.5 rounded-2xl border border-slate-200/60 text-[10px] font-black uppercase tracking-wider text-center">
              <button
                onClick={() => { setActiveTab('EMAIL'); setError(''); setSuccess(''); }}
                className={`py-3.5 rounded-xl transition-all font-black cursor-pointer ${
                  activeTab === 'EMAIL' 
                    ? 'bg-white text-indigo-700 shadow-md border border-slate-200/50' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Email OTP
              </button>
              <button
                onClick={() => { setActiveTab('PHONE'); setError(''); setSuccess(''); }}
                className={`py-3.5 rounded-xl transition-all font-black cursor-pointer ${
                  activeTab === 'PHONE' 
                    ? 'bg-white text-indigo-700 shadow-md border border-slate-200/50' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Phone OTP
              </button>
              <button
                onClick={() => { setActiveTab('PASSWORD'); setError(''); setSuccess(''); }}
                className={`py-3.5 rounded-xl transition-all font-black cursor-pointer ${
                  activeTab === 'PASSWORD' 
                    ? 'bg-white text-indigo-700 shadow-md border border-slate-200/50' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Password
              </button>
              <button
                onClick={() => { setActiveTab('SIGNUP'); setError(''); setSuccess(''); }}
                className={`py-3.5 rounded-xl transition-all font-black cursor-pointer ${
                  activeTab === 'SIGNUP' 
                    ? 'bg-white text-indigo-700 shadow-md border border-slate-200/50' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Sign Up
              </button>
            </div>

            {/* Forms Section */}
            {activeTab === 'PASSWORD' && (
              <form onSubmit={handlePasswordLogin} className="space-y-6 animate-fadeIn text-xs text-left font-bold text-slate-700">
                <div className="space-y-2">
                  <label className="block text-slate-500 text-[10px] font-black uppercase tracking-wider" htmlFor="passwordIdentifier">
                    Email or Mobile Number
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-4.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="passwordIdentifier"
                      type="text"
                      required
                      placeholder="name@company.com or +919999999999"
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      disabled={loading}
                      className="w-full pl-12 pr-4.5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all font-semibold text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-slate-500 text-[10px] font-black uppercase tracking-wider" htmlFor="passwordInput">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-4.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="passwordInput"
                      type="password"
                      required
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      disabled={loading}
                      className="w-full pl-12 pr-4.5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all font-semibold text-xs"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-[#1E2B58] hover:bg-[#2c3d75] active:scale-[0.99] text-white font-extrabold rounded-2xl shadow-lg shadow-[#1E2B58]/10 transition-all flex items-center justify-center gap-2 cursor-pointer text-xs uppercase tracking-wider"
                >
                  {loading ? (
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    'Log In'
                  )}
                </button>
              </form>
            )}

            {activeTab === 'EMAIL' && (
              <div className="animate-fadeIn">
                {emailStep === 1 ? (
                  <form onSubmit={handleSendEmailOtp} className="space-y-6">
                    <div className="space-y-2">
                      <label className="block text-slate-500 text-[10px] font-black uppercase tracking-wider" htmlFor="email">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-4.5 top-1/2 -translate-y-1/2" />
                        <input
                          id="email"
                          type="email"
                          required
                          placeholder="name@company.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          disabled={loading}
                          className="w-full pl-12 pr-4.5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all font-semibold text-xs"
                        />
                      </div>
                      <p className="text-[9px] text-slate-450 font-bold leading-normal">
                        We will dispatch a secure 6-digit verification pin to your inbox.
                      </p>
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-4 bg-[#1E2B58] hover:bg-[#2c3d75] active:scale-[0.99] text-white font-extrabold rounded-2xl shadow-lg shadow-[#1E2B58]/10 transition-all flex items-center justify-center gap-2 cursor-pointer text-xs uppercase tracking-wider"
                    >
                      {loading ? (
                        <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      ) : (
                        'Send Login OTP'
                      )}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyEmailOtp} className="space-y-6">
                    <div className="space-y-2">
                      <label className="block text-slate-500 text-[10px] font-black uppercase tracking-wider" htmlFor="emailOtp">
                        Enter Verification OTP
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-4.5 top-1/2 -translate-y-1/2" />
                        <input
                          id="emailOtp"
                          type="text"
                          maxLength={6}
                          required
                          placeholder="000000"
                          value={emailOtp}
                          onChange={(e) => setEmailOtp(e.target.value)}
                          disabled={loading}
                          className="w-full pl-12 pr-4.5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all font-mono text-center text-xl tracking-widest font-black"
                        />
                      </div>
                      {mockEmailOtp && (
                        <div className="p-3 bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] text-center rounded-xl font-bold font-mono animate-pulse">
                          🔑 Sandbox OTP code: {mockEmailOtp}
                        </div>
                      )}
                    </div>
                    <div className="space-y-3">
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-[#1E2B58] hover:bg-[#2c3d75] active:scale-[0.99] text-white font-extrabold rounded-2xl shadow-lg shadow-[#1E2B58]/10 transition-all flex items-center justify-center gap-2 cursor-pointer text-xs uppercase tracking-wider"
                      >
                        {loading ? (
                          <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        ) : (
                          'Verify & Log In'
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEmailStep(1)}
                        disabled={loading}
                        className="w-full py-3.5 bg-transparent hover:bg-slate-50 text-slate-500 hover:text-slate-700 font-extrabold rounded-2xl transition-all cursor-pointer text-xs uppercase tracking-wider"
                      >
                        Change Email Input
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {activeTab === 'PHONE' && (
              <div className="animate-fadeIn">
                {phoneStep === 1 ? (
                  <form onSubmit={handleSendPhoneOtp} className="space-y-6">
                    <div className="space-y-2">
                      <label className="block text-slate-500 text-[10px] font-black uppercase tracking-wider" htmlFor="phone">
                        Mobile Number
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-slate-400 absolute left-4.5 top-1/2 -translate-y-1/2" />
                        <input
                          id="phone"
                          type="text"
                          required
                          placeholder="+919876543210"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          disabled={loading}
                          className="w-full pl-12 pr-4.5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all font-semibold text-xs"
                        />
                      </div>
                      <div className="p-3.5 bg-indigo-50/50 border border-indigo-100 rounded-2xl space-y-1.5 text-[9px] text-slate-500 font-bold">
                        <p className="text-[#1E2B58] uppercase font-black tracking-wide">Seeded Sandbox Accounts:</p>
                        <ul className="space-y-1 pl-2 list-disc">
                          <li>Admin User: <code className="text-indigo-700 font-mono font-bold">+919999999999</code></li>
                          <li>Customer User: <code className="text-indigo-700 font-mono font-bold">+919876543210</code></li>
                        </ul>
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-4 bg-[#1E2B58] hover:bg-[#2c3d75] active:scale-[0.99] text-white font-extrabold rounded-2xl shadow-lg shadow-[#1E2B58]/10 transition-all flex items-center justify-center gap-2 cursor-pointer text-xs uppercase tracking-wider"
                    >
                      {loading ? (
                        <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      ) : (
                        'Send SMS OTP'
                      )}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyPhoneOtp} className="space-y-6">
                    <div className="space-y-2">
                      <label className="block text-slate-500 text-[10px] font-black uppercase tracking-wider" htmlFor="phoneOtp">
                        Enter Verification Code
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-4.5 top-1/2 -translate-y-1/2" />
                        <input
                          id="phoneOtp"
                          type="text"
                          maxLength={6}
                          required
                          placeholder="000000"
                          value={phoneOtp}
                          onChange={(e) => setPhoneOtp(e.target.value)}
                          disabled={loading}
                          className="w-full pl-12 pr-4.5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all font-mono text-center text-xl tracking-widest font-black"
                        />
                      </div>
                      {mockPhoneOtp && (
                        <div className="p-3 bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] text-center rounded-xl font-bold font-mono animate-pulse">
                          🔑 Sandbox OTP code: {mockPhoneOtp}
                        </div>
                      )}
                    </div>
                    <div className="space-y-3">
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-[#1E2B58] hover:bg-[#2c3d75] active:scale-[0.99] text-white font-extrabold rounded-2xl shadow-lg shadow-[#1E2B58]/10 transition-all flex items-center justify-center gap-2 cursor-pointer text-xs uppercase tracking-wider"
                      >
                        {loading ? (
                          <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        ) : (
                          'Verify & Log In'
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setPhoneStep(1)}
                        disabled={loading}
                        className="w-full py-3.5 bg-transparent hover:bg-slate-50 text-slate-500 hover:text-slate-700 font-extrabold rounded-2xl transition-all cursor-pointer text-xs uppercase tracking-wider"
                      >
                        Change Phone Input
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {activeTab === 'SIGNUP' && (
              <form onSubmit={handleSignup} className="space-y-4 animate-fadeIn">
                <div className="space-y-1.5">
                  <label className="block text-slate-500 text-[10px] font-black uppercase tracking-wider" htmlFor="signupName">
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
                    className="w-full px-4.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all font-semibold text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-slate-500 text-[10px] font-black uppercase tracking-wider" htmlFor="signupEmail">
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
                    className="w-full px-4.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all font-semibold text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-slate-500 text-[10px] font-black uppercase tracking-wider" htmlFor="signupPhone">
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
                    className="w-full px-4.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all font-semibold text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-slate-500 text-[10px] font-black uppercase tracking-wider">
                    Account Role
                  </label>
                  <select
                    value={signupRole}
                    onChange={(e) => setSignupRole(e.target.value as any)}
                    disabled={loading}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500 transition-all font-semibold text-xs cursor-pointer"
                  >
                    <option value="CUSTOMER">Customer Account</option>
                    <option value="MERCHANT">Merchant Account</option>
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-[#1E2B58] hover:bg-[#2c3d75] active:scale-[0.99] text-white font-extrabold rounded-2xl shadow-lg shadow-[#1E2B58]/10 transition-all flex items-center justify-center gap-2 cursor-pointer mt-6 text-xs uppercase tracking-wider"
                >
                  {loading ? (
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    'Create Account'
                  )}
                </button>
              </form>
            )}

            {/* Social login divider */}
            <div className="flex items-center my-6 text-slate-450 text-[9px] font-black tracking-wider uppercase">
              <div className="flex-1 h-px bg-slate-200"></div>
              <span className="px-4">Or Access With</span>
              <div className="flex-1 h-px bg-slate-200"></div>
            </div>

            {/* Google SSO simulated integration */}
            <div>
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
                className="w-full py-3.5 bg-white hover:bg-slate-50 border border-slate-250 hover:border-slate-300 rounded-2xl text-slate-700 font-extrabold flex items-center justify-center gap-3 transition-all active:scale-[0.99] cursor-pointer text-xs uppercase tracking-wider shadow-xs"
                disabled={loading}
              >
                <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Sign In with Google
              </button>
            </div>
          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="bg-white border-t border-slate-200/60 py-8 px-6 text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-24">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <span>Oysterpls Loan Management System (LMS) © 2026. All rights reserved.</span>
          <span className="text-[#10B981]">Console v1.0.4 • Developer Sandboxed Environment</span>
        </div>
      </footer>

      {/* GOOGLE AUTH SIMULATOR MODAL popup - Redesigned in premium White theme */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
          <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-8 space-y-6 shadow-2xl relative animate-scaleUp">
            
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="currentColor"/>
                </svg>
              </div>
              <div>
                <h2 className="text-base font-black text-[#1E2B58]">Google Simulation Console</h2>
                <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Developer Sandbox Tool</span>
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed font-semibold">
              Enter any test email address to simulate the NextAuth Google redirect. The system will auto-initialize the account and trigger the developer 2FA verification flow.
            </p>

            <form onSubmit={handleMockGoogleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-slate-500 text-[10px] font-black uppercase tracking-wider">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="name@gmail.com"
                  value={googleEmail}
                  onChange={(e) => setGoogleEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs font-semibold focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
                />
              </div>
              
              <div className="space-y-1.5">
                <label className="block text-slate-500 text-[10px] font-black uppercase tracking-wider">Target Account Role</label>
                <select
                  value={googleRole}
                  onChange={(e) => setGoogleRole(e.target.value as any)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="CUSTOMER">Customer View</option>
                  <option value="MERCHANT">Merchant Store Owner</option>
                  <option value="SUPER_ADMIN">System Administrator</option>
                </select>
              </div>

              <div className="flex gap-3 pt-3 border-t border-slate-100">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-[#1E2B58] hover:bg-[#2c3d75] text-white font-extrabold rounded-2xl active:scale-[0.98] transition-all text-xs uppercase tracking-wider cursor-pointer"
                >
                  Simulate SSO Login
                </button>
                <button
                  type="button"
                  onClick={() => setShowGoogleModal(false)}
                  className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-extrabold rounded-2xl text-xs uppercase tracking-wider cursor-pointer"
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
      <div className="flex flex-1 justify-center items-center bg-[#F8FAFD] min-h-screen text-slate-500 font-sans font-bold">
        <span className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mr-3"></span>
        Loading Oysterpls Hub...
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  );
}
