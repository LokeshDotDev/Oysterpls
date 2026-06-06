'use client';

import React, { useState, useEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';

export default function LoanAgreementPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  // Application details
  const [app, setApp] = useState<any | null>(null);
  const [loadingApp, setLoadingApp] = useState(true);
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1 = PAN check, 2 = Selfie & Signature, 3 = Success
  const [mandateUrl, setMandateUrl] = useState<string | null>(null);

  // Form states
  const [panNumber, setPanNumber] = useState('');
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  
  // Canvas signature state
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSigned, setHasSigned] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loadingSubmit, setLoadingSubmit] = useState(false);

  useEffect(() => {
    const fetchAppDetails = async () => {
      try {
        const res = await fetch(`/api/applications/esign-info/${id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to fetch application details');
        setApp(data.application);
      } catch (err: any) {
        setError(err.message || 'Unable to load loan agreement. Invalid link.');
      } finally {
        setLoadingApp(false);
      }
    };
    fetchAppDetails();
  }, [id]);

  // PAN Check
  const handleVerifyPan = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!app || !app.customer.profile) {
      setError('Invalid customer profile.');
      return;
    }

    const correctPan = app.customer.profile.panNumber.toUpperCase();
    if (panNumber.trim().toUpperCase() !== correctPan) {
      setError('PAN card number does not match our records. Please verify.');
      return;
    }

    setSuccess('PAN verified! Please provide your selfie and signature.');
    setTimeout(() => {
      setSuccess('');
      setStep(2);
    }, 1000);
  };

  // Selfie capture
  const handleSelfieChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelfieFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelfiePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Canvas Signature pad handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = '#38bdf8'; // sky-400
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    
    let x, y;
    if ('touches' in e) {
      const rect = canvas.getBoundingClientRect();
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.nativeEvent.offsetX;
      y = e.nativeEvent.offsetY;
    }

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let x, y;
    if ('touches' in e) {
      e.preventDefault(); // prevent scrolling
      const rect = canvas.getBoundingClientRect();
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.nativeEvent.offsetX;
      y = e.nativeEvent.offsetY;
    }

    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSigned(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSigned(false);
  };

  // Submit E-sign
  const handleSubmitEsign = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoadingSubmit(true);

    if (!selfieFile) {
      setError('Live selfie photo is required.');
      setLoadingSubmit(false);
      return;
    }

    if (!hasSigned || !canvasRef.current) {
      setError('Signature is required. Please draw in the signature pad.');
      setLoadingSubmit(false);
      return;
    }

    try {
      // Get signature file from canvas
      const canvas = canvasRef.current;
      const signatureBlob = await new Promise<Blob | null>((resolve) => 
        canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.9)
      );

      if (!signatureBlob) {
        throw new Error('Failed to capture signature canvas.');
      }

      const signatureFile = new File([signatureBlob], 'signature.jpg', { type: 'image/jpeg' });

      // Create FormData
      const formData = new FormData();
      formData.append('panNumber', panNumber);
      formData.append('selfie', selfieFile);
      formData.append('signature', signatureFile);

      const res = await fetch(`/api/applications/${id}/esign`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit agreement signature');

      setSuccess('E-Sign Agreement submitted successfully!');
      if (data.authUrl) {
        setMandateUrl(data.authUrl);
      }
      setStep(3);
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoadingSubmit(false);
    }
  };

  if (loadingApp) {
    return (
      <div className="flex justify-center items-center py-20 min-h-screen bg-slate-950 text-slate-400">
        <span className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></span>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 items-center justify-center p-4 bg-slate-950 min-h-screen relative overflow-hidden text-slate-100 font-sans">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-sky-500 rounded-full blur-3xl opacity-[0.03] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500 rounded-full blur-3xl opacity-[0.03] pointer-events-none"></div>

      <div className="max-w-xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 md:p-10 shadow-2xl relative z-10">
        
        {/* Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 font-bold text-lg mb-4">
            ✍
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">Loan Agreement E-Sign</h1>
          <p className="text-slate-400 text-sm mt-1">Review & authorize your digital loan contract.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs text-center font-bold">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs text-center font-bold">
            {success}
          </div>
        )}

        {/* Step 1: PAN Verification */}
        {step === 1 && (
          <form onSubmit={handleVerifyPan} className="space-y-6">
            <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 text-xs space-y-2">
              <h3 className="font-bold text-slate-300">Loan Scheme Details</h3>
              <div className="flex justify-between border-b border-slate-900 pb-2">
                <span className="text-slate-500">Applicant:</span>
                <span className="text-slate-300 font-semibold">{app?.customer.profile?.fullName}</span>
              </div>
              <div className="flex justify-between border-b border-slate-900 pb-2">
                <span className="text-slate-500">Loan Amount:</span>
                <span className="text-emerald-400 font-bold">₹{Number(app?.requestedAmount).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tenure:</span>
                <span className="text-slate-300">{app?.requestedTenure} Months</span>
              </div>
            </div>

            <div>
              <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
                Confirm your PAN Number
              </label>
              <input
                type="text"
                maxLength={10}
                required
                placeholder="ABCDE1234F"
                value={panNumber}
                onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                className="w-full px-4 py-3.5 bg-slate-950 border border-slate-800 rounded-2xl text-slate-100 font-mono tracking-widest text-center text-xl font-bold"
              />
              <p className="text-[11px] text-slate-500 mt-2">
                For security reasons, please enter your PAN card number exactly as provided during customer details entry.
              </p>
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-sky-500 hover:bg-sky-600 active:scale-[0.99] text-slate-950 font-bold rounded-2xl shadow-lg shadow-sky-500/15 transition-all flex items-center justify-center gap-2"
            >
              Verify identity
            </button>
          </form>
        )}

        {/* Step 2: Selfie & Canvas Signature */}
        {step === 2 && (
          <form onSubmit={handleSubmitEsign} className="space-y-6">
            
            {/* Selfie input */}
            <div className="space-y-2">
              <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider">
                1. Upload Live Selfie
              </label>
              <div className="flex items-center gap-4">
                <label className="px-4 py-3.5 bg-slate-950 border border-slate-800 rounded-2xl text-slate-300 hover:border-slate-700/80 cursor-pointer font-semibold text-xs transition-all flex-1 text-center">
                  Take Selfie Photo
                  <input
                    type="file"
                    accept="image/*"
                    capture="user"
                    onChange={handleSelfieChange}
                    className="hidden"
                  />
                </label>
                {selfiePreview && (
                  <div className="w-14 h-14 rounded-xl border border-slate-800 overflow-hidden relative bg-slate-950 flex-shrink-0">
                    <img src={selfiePreview} alt="Selfie preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>

            {/* Signature Pad */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider">
                  2. Draw your Signature
                </label>
                <button
                  type="button"
                  onClick={clearSignature}
                  className="text-xs text-rose-400 hover:underline font-bold"
                >
                  Clear Pad
                </button>
              </div>
              
              <div className="border border-slate-800 bg-slate-950 rounded-2xl overflow-hidden relative">
                <canvas
                  ref={canvasRef}
                  width={500}
                  height={150}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="w-full bg-slate-950 cursor-crosshair"
                />
              </div>
              <p className="text-[10px] text-slate-500 font-medium">
                Use your mouse or touch screen to draw your signature inside the box.
              </p>
            </div>

            <button
              type="submit"
              disabled={loadingSubmit}
              className="w-full py-4 bg-sky-500 hover:bg-sky-600 active:scale-[0.99] text-slate-950 font-bold rounded-2xl shadow-lg shadow-sky-500/15 transition-all flex items-center justify-center gap-2"
            >
              {loadingSubmit ? (
                <span className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
              ) : (
                'Sign Agreement & Authorize'
              )}
            </button>
          </form>
        )}

        {/* Step 3: Success Screen */}
        {step === 3 && (
          <div className="text-center space-y-6 py-6">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto text-3xl font-bold animate-bounce">
              ✓
            </div>
            <h2 className="text-2xl font-bold text-emerald-400">E-Sign Completed!</h2>
            <p className="text-slate-400 text-sm max-w-sm mx-auto">
              Your digital contract has been signed and locked into the ledger. You are now being redirected to the Razorpay E-Mandate Autopay configuration portal...
            </p>
            <button
              onClick={() => {
                if (mandateUrl) {
                  window.location.href = mandateUrl;
                } else if (app?.mandate?.authUrl) {
                  window.location.href = app.mandate.authUrl;
                } else {
                  router.push('/');
                }
              }}
              className="px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-2xl shadow-lg shadow-emerald-500/15 transition-all inline-flex items-center gap-2 active:scale-95"
            >
              Proceed to Auto-Pay mandate
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
