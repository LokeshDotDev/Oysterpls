'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ShieldCheck, Zap, Coins, ArrowRight, 
  Sparkles, ChevronRight, Building, Landmark, Lock
} from 'lucide-react';
import Link from 'next/link';

export default function LandingPage() {
  // Interactive Calculator State
  const [calcAmount, setCalcAmount] = useState(45000);
  const [calcTenure, setCalcTenure] = useState(6);

  const router = useRouter();

  // Calculated values
  const downPayment = Math.round(calcAmount * 0.20); // 20% down payment
  const principal = calcAmount - downPayment;
  const estimatedEMI = Math.round((principal * (1 + 0.12 * (calcTenure / 12))) / calcTenure); // 12% flat rate p.a.
  const processingFee = 999;

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
      <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-200/50 z-50 px-6 py-4 transition-all">
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

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-bold text-slate-500 uppercase tracking-wider">
            <button onClick={() => scrollToId('what-why')} className="hover:text-[#1E2B58] transition-colors cursor-pointer">What & Why</button>
            <button onClick={() => scrollToId('how-it-works')} className="hover:text-[#1E2B58] transition-colors cursor-pointer">How It Works</button>
            <button onClick={() => scrollToId('calculator')} className="hover:text-[#1E2B58] transition-colors cursor-pointer">EMI Simulator</button>
          </nav>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-3">
            <Link 
              href="/auth/login"
              className="px-4.5 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all shadow-2xs flex items-center gap-1"
            >
              Sign In
            </Link>
            <Link 
              href="/auth/signup"
              className="px-4.5 py-2.5 bg-[#1E2B58] hover:bg-[#2c3d75] text-white text-xs font-bold rounded-xl transition-all shadow-sm shadow-[#1E2B58]/10 flex items-center gap-1"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-12 space-y-28 relative z-10">
        
        {/* HERO SECTION */}
        <section className="text-center max-w-4xl mx-auto space-y-8 pt-6 md:pt-12">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-full text-indigo-700 text-[10px] font-black uppercase tracking-wider shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-indigo-650" /> Instant POS Device Financing
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
            <Link 
              href="/auth/login"
              className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-slate-50 border border-slate-250 hover:border-slate-300 text-slate-700 text-xs font-black uppercase tracking-wider rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              Go to Auth Portal <ChevronRight className="w-4 h-4" />
            </Link>
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
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-650">
                <Building className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-[#1E2B58] uppercase tracking-wide">Enterprise Lending System</h3>
              <p className="text-slate-400 text-xs font-semibold leading-relaxed">
                Oysterpls connects three core pillars: retail mobile **Merchants** who initiate the loan, back-office **Lenders** who manage rules and underwriting, and **Customers** who access financed mobile plans.
              </p>
            </div>

            {/* Card 2: How it helps Merchants */}
            <div className="bg-white border border-slate-200/70 p-8 rounded-3xl space-y-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-650">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-[#1E2B58] uppercase tracking-wide">Instant POS Checkouts</h3>
              <p className="text-slate-400 text-xs font-semibold leading-relaxed">
                Rather than manual paperwork, merchants upload customer documents and invoice costs directly inside the console. Credit checks and eligibility decisions execute in real-time.
              </p>
            </div>

            {/* Card 3: Secure LMS Operations */}
            <div className="bg-white border border-slate-200/70 p-8 rounded-3xl space-y-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-650">
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

        {/* SECTION 4: CALL TO ACTION */}
        <section className="bg-gradient-to-tr from-[#1E2B58] to-indigo-950 rounded-3xl p-8 md:p-12 text-center text-white space-y-6 shadow-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(99,102,241,0.1),transparent)] pointer-events-none" />
          <h2 className="text-2xl md:text-3xl font-black tracking-tight leading-tight">Ready to access your console?</h2>
          <p className="text-slate-300 text-xs font-semibold max-w-xl mx-auto leading-relaxed">
            Log in to manage loan agreements, perform verification audits, track recurring e-mandates or set up instant POS checkouts.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-2">
            <Link 
              href="/auth/login"
              className="w-full sm:w-auto px-8 py-3.5 bg-white hover:bg-slate-50 text-indigo-950 text-xs font-extrabold uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5"
            >
              Sign In to Console
            </Link>
            <Link 
              href="/auth/signup"
              className="w-full sm:w-auto px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold uppercase tracking-wider rounded-xl border border-indigo-500 transition-all flex items-center justify-center gap-1.5"
            >
              Create Account
            </Link>
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

    </div>
  );
}
