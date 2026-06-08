'use client';

import React, { useState, useEffect } from 'react';
import { AuthUser } from '@/app/providers';
import { 
  Store, ShieldCheck, Camera, UploadCloud, Landmark, 
  FileText, CheckCircle2, ArrowRight, ArrowLeft, Check, AlertTriangle 
} from 'lucide-react';

interface MerchantOnboardingProps {
  user: AuthUser;
  onOnboardingSubmitted: (updatedUser: any) => void;
}

export default function MerchantOnboarding({ user, onOnboardingSubmitted }: MerchantOnboardingProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form fields
  const [shopName, setShopName] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('1990-01-01');
  const [panNumber, setPanNumber] = useState('');
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  
  // Store address
  const [addressLine1, setAddressLine1] = useState('');
  const [pincode, setPincode] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');

  // Bank details
  const [bankName, setBankName] = useState('');
  const [bankAccountNo, setBankAccountNo] = useState('');
  const [bankIfsc, setBankIfsc] = useState('');

  // Uploaded docs URLs
  const [panUrl, setPanUrl] = useState('');
  const [aadhaarUrl, setAadhaarUrl] = useState('');
  const [selfieUrl, setSelfieUrl] = useState('');

  // Uploading state indicators
  const [uploadProgress, setUploadProgress] = useState<Record<string, boolean>>({});

  // Fetch existing profile data on mount to populate defaults
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/profile');
        if (res.ok) {
          const data = await res.json();
          if (data.profile) {
            const p = data.profile;
            setShopName(p.shopName || '');
            setGstNumber(p.gstNumber || '');
            setFullName(p.fullName || '');
            if (p.dob) {
              setDob(new Date(p.dob).toISOString().split('T')[0]);
            }
            if (p.panNumber && !p.panNumber.startsWith('MOCK')) {
              setPanNumber(p.panNumber);
            }
            if (p.aadhaarNumber && !p.aadhaarNumber.startsWith('9999')) {
              setAadhaarNumber(p.aadhaarNumber);
            }
            setAddressLine1(p.addressLine1 && p.addressLine1 !== 'Placeholder Address' ? p.addressLine1 : '');
            setPincode(p.pincode && p.pincode !== '000000' ? p.pincode : '');
            setCity(p.city && p.city !== 'Placeholder City' ? p.city : '');
            setState(p.state && p.state !== 'Placeholder State' ? p.state : '');
            setBankName(p.bankName && p.bankName !== 'Placeholder Bank' ? p.bankName : '');
            setBankAccountNo(p.bankAccountNo && p.bankAccountNo !== '0000000000' ? p.bankAccountNo : '');
            setBankIfsc(p.bankIfsc && p.bankIfsc !== 'ICIC0000000' ? p.bankIfsc : '');

            // Pre-fill existing documents
            if (p.documents) {
              const panDoc = p.documents.find((d: any) => d.type === 'PAN');
              const aadhaarDoc = p.documents.find((d: any) => d.type === 'AADHAAR');
              const selfieDoc = p.documents.find((d: any) => d.type === 'SELFIE');
              if (panDoc) setPanUrl(`/uploads/${panDoc.s3Url}`);
              if (aadhaarDoc) setAadhaarUrl(`/uploads/${aadhaarDoc.s3Url}`);
              if (selfieDoc) setSelfieUrl(`/uploads/${selfieDoc.s3Url}`);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load merchant profile', err);
      }
    };
    fetchProfile();
  }, []);

  // Document Upload
  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>, type: 'PAN' | 'AADHAAR' | 'SELFIE') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setSuccess('');
    setUploadProgress(prev => ({ ...prev, [type]: true }));

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Upload of ${type} failed`);

      if (type === 'PAN') setPanUrl(data.url);
      if (type === 'AADHAAR') setAadhaarUrl(data.url);
      if (type === 'SELFIE') setSelfieUrl(data.url);

      setSuccess(`${type} document uploaded and optimized successfully!`);
    } catch (err: any) {
      setError(err.message || 'Failed to upload document.');
    } finally {
      setUploadProgress(prev => ({ ...prev, [type]: false }));
    }
  };

  // Step 1: Save Business & Owner details
  const handleNextStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Field Validations
    if (!shopName.trim()) return setError('Shop Name is required.');
    if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstNumber)) {
      return setError('Please enter a valid 15-character Indian GSTIN number.');
    }
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panNumber)) {
      return setError('Please enter a valid 10-character PAN card number.');
    }
    if (!/^[0-9]{12}$/.test(aadhaarNumber)) {
      return setError('Please enter a valid 12-digit Aadhaar Card number.');
    }

    setStep(2);
  };

  // Step 2: Ensure Documents are uploaded before proceeding
  const handleNextStep2 = () => {
    setError('');
    if (!panUrl) return setError('Please upload PAN Card scan.');
    if (!aadhaarUrl) return setError('Please upload Aadhaar Card scan.');
    if (!selfieUrl) return setError('Please upload your Selfie photo.');
    setStep(3);
  };

  // Step 3: Save details to Profile and submit onboarding
  const handleSubmitOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!bankName.trim()) return setError('Bank Name is required.');
    if (!/^[0-9]{9,18}$/.test(bankAccountNo)) {
      return setError('Please enter a valid Bank Account Number (9 to 18 digits).');
    }
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(bankIfsc)) {
      return setError('Please enter a valid 11-digit Bank IFSC code.');
    }
    if (!addressLine1.trim() || !city.trim() || !state.trim() || !pincode.trim()) {
      return setError('Please complete store address details.');
    }

    try {
      // 1. Update Profile details
      const profileRes = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          dob,
          panNumber,
          aadhaarNumber,
          shopName,
          gstNumber,
          bankName,
          bankAccountNo,
          bankIfsc,
          addressLine1,
          pincode,
          city,
          state,
        }),
      });

      const profileData = await profileRes.json();
      if (!profileRes.ok) throw new Error(profileData.error || 'Failed to save onboarding profile details');

      // 2. Submit for Admin Approval
      const submitRes = await fetch('/api/auth/onboarding/submit-merchant', {
        method: 'POST',
      });

      const submitData = await submitRes.json();
      if (!submitRes.ok) throw new Error(submitData.error || 'Submission failed');

      setSuccess('Application submitted successfully!');
      // Callback to update local storage user session
      onOnboardingSubmitted(submitData.user);
    } catch (err: any) {
      setError(err.message || 'Onboarding submission failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl w-full mx-auto my-8 bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-10 shadow-2xl relative z-10 backdrop-blur-xl text-slate-100 font-sans">
      
      {/* Glow effect */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-80 bg-indigo-500 rounded-full blur-3xl opacity-[0.05] pointer-events-none"></div>

      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold text-xl mb-3">
          🏬
        </div>
        <h2 className="text-2xl font-black text-slate-100">Merchant Onboarding Profile</h2>
        <p className="text-slate-400 text-xs mt-1.5 font-medium">Verify your store credentials to activate disbursals directly to your account.</p>
      </div>

      {/* Notification banners */}
      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-455 text-xs text-center font-bold flex items-center justify-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs text-center font-bold flex items-center justify-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Steps Progress Indicators */}
      <div className="flex items-center justify-center gap-4 mb-10 text-xs font-bold uppercase tracking-wider">
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${step === 1 ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-400' : 'border-slate-800 text-slate-550'}`}>
          <span className="w-5 h-5 rounded-full bg-slate-950 flex items-center justify-center border border-slate-800 text-[10px]">1</span>
          <span>Business Info</span>
        </div>
        <div className="w-8 h-px bg-slate-800"></div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${step === 2 ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-400' : 'border-slate-800 text-slate-550'}`}>
          <span className="w-5 h-5 rounded-full bg-slate-950 flex items-center justify-center border border-slate-800 text-[10px]">2</span>
          <span>Uploads</span>
        </div>
        <div className="w-8 h-px bg-slate-800"></div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${step === 3 ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-400' : 'border-slate-800 text-slate-550'}`}>
          <span className="w-5 h-5 rounded-full bg-slate-950 flex items-center justify-center border border-slate-800 text-[10px]">3</span>
          <span>Bank details</span>
        </div>
      </div>

      {/* Step Forms */}
      {step === 1 && (
        <form onSubmit={handleNextStep1} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">Shop/Business Name</label>
              <div className="relative">
                <Store className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Mobile Store"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 text-xs font-semibold"
                />
              </div>
            </div>
            <div>
              <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">GSTIN Number (15 Digits)</label>
              <div className="relative">
                <FileText className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  required
                  placeholder="e.g. 27AAAAA0000A1Z5"
                  value={gstNumber}
                  onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
                  className="w-full pl-11 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 text-xs font-mono uppercase font-semibold"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 border-t border-slate-800 pt-5 mt-2">
            <div>
              <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">Owner Full Name (on PAN)</label>
              <input
                type="text"
                required
                placeholder="e.g. John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 text-xs font-semibold"
              />
            </div>
            <div>
              <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">Date of Birth</label>
              <input
                type="date"
                required
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 text-xs font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">PAN Card Number</label>
              <input
                type="text"
                required
                placeholder="e.g. ABCDE1234F"
                value={panNumber}
                onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 text-xs font-mono uppercase font-semibold"
              />
            </div>
            <div>
              <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">Aadhaar Card Number (12 Digits)</label>
              <input
                type="text"
                required
                maxLength={12}
                placeholder="e.g. 123456789012"
                value={aadhaarNumber}
                onChange={(e) => setAadhaarNumber(e.target.value.replace(/[^0-9]/g, ''))}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 text-xs font-mono font-semibold"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              className="px-6 py-3 bg-indigo-500 hover:bg-indigo-650 text-slate-950 font-bold rounded-2xl shadow-lg shadow-indigo-500/10 transition-all flex items-center gap-2 text-xs"
            >
              <span>Verify & Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* PAN Card Upload */}
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 flex flex-col justify-between h-48 relative overflow-hidden">
              <div>
                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block mb-1">PAN Card Scan</span>
                <p className="text-[10px] text-slate-600">Provide an optimized clear scan of your PAN Card.</p>
              </div>
              
              <div className="mt-4">
                {panUrl ? (
                  <div className="flex items-center gap-2 text-xs text-emerald-500 font-bold">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Scan Uploaded Successfully</span>
                  </div>
                ) : (
                  <label className="w-full flex items-center justify-center gap-2 py-3 bg-slate-900 border border-dashed border-slate-800 hover:border-slate-700/80 rounded-xl cursor-pointer text-slate-400 font-bold text-xs transition-colors">
                    <UploadCloud className="w-4 h-4" />
                    <span>{uploadProgress['PAN'] ? 'Uploading...' : 'Upload PAN PDF/Img'}</span>
                    <input type="file" accept="image/*,application/pdf" onChange={(e) => handleUploadFile(e, 'PAN')} className="hidden" />
                  </label>
                )}
              </div>
            </div>

            {/* Aadhaar Card Upload */}
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 flex flex-col justify-between h-48 relative overflow-hidden">
              <div>
                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block mb-1">Aadhaar Card Scan</span>
                <p className="text-[10px] text-slate-600">Upload Aadhaar card image front and back combined.</p>
              </div>
              
              <div className="mt-4">
                {aadhaarUrl ? (
                  <div className="flex items-center gap-2 text-xs text-emerald-500 font-bold">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Scan Uploaded Successfully</span>
                  </div>
                ) : (
                  <label className="w-full flex items-center justify-center gap-2 py-3 bg-slate-900 border border-dashed border-slate-800 hover:border-slate-700/80 rounded-xl cursor-pointer text-slate-400 font-bold text-xs transition-colors">
                    <UploadCloud className="w-4 h-4" />
                    <span>{uploadProgress['AADHAAR'] ? 'Uploading...' : 'Upload Aadhaar File'}</span>
                    <input type="file" accept="image/*,application/pdf" onChange={(e) => handleUploadFile(e, 'AADHAAR')} className="hidden" />
                  </label>
                )}
              </div>
            </div>

          </div>

          {/* Selfie Upload */}
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center gap-6">
            <div className="w-24 h-24 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-3xl overflow-hidden shrink-0">
              {selfieUrl ? (
                <img src={selfieUrl} alt="Selfie" className="w-full h-full object-cover" />
              ) : (
                '📷'
              )}
            </div>
            <div className="flex-1 w-full space-y-3">
              <div>
                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block mb-1">Selfie Verification Photo</span>
                <p className="text-[10px] text-slate-600">Provide a direct capture selfie to match against ID credentials.</p>
              </div>
              
              {selfieUrl ? (
                <div className="flex items-center gap-2 text-xs text-emerald-500 font-bold">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Selfie Recorded Successfully</span>
                </div>
              ) : (
                <label className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 border border-slate-800 hover:border-slate-750 hover:bg-slate-900/60 rounded-xl cursor-pointer text-slate-300 font-bold text-xs transition-all">
                  <Camera className="w-4 h-4" />
                  <span>{uploadProgress['SELFIE'] ? 'Uploading...' : 'Upload Selfie Photo'}</span>
                  <input type="file" accept="image/*" onChange={(e) => handleUploadFile(e, 'SELFIE')} className="hidden" />
                </label>
              )}
            </div>
          </div>

          <div className="pt-4 flex justify-between">
            <button
              onClick={() => setStep(1)}
              className="px-5 py-3 border border-slate-800 text-slate-400 hover:text-slate-200 font-bold rounded-2xl transition-all flex items-center gap-2 text-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              onClick={handleNextStep2}
              className="px-6 py-3 bg-indigo-500 hover:bg-indigo-650 text-slate-950 font-bold rounded-2xl shadow-lg shadow-indigo-500/10 transition-all flex items-center gap-2 text-xs"
            >
              <span>Proceed to Settlements</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <form onSubmit={handleSubmitOnboarding} className="space-y-6">
          
          {/* Store Address fields */}
          <div className="space-y-4">
            <h3 className="text-sm font-extrabold text-slate-200 border-b border-slate-800 pb-2 flex items-center gap-2">
              <span>📍</span> Store Location Address
            </h3>
            
            <div>
              <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">Store Address Line 1</label>
              <input
                type="text"
                required
                placeholder="Plot/Shop No, building street name"
                value={addressLine1}
                onChange={(e) => setAddressLine1(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 text-xs font-semibold"
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">Pincode (6 digits)</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="000000"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 text-xs font-mono font-semibold"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">City</label>
                <input
                  type="text"
                  required
                  placeholder="Mumbai"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 text-xs font-semibold"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">State</label>
                <input
                  type="text"
                  required
                  placeholder="Maharashtra"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 text-xs font-semibold"
                />
              </div>
            </div>
          </div>

          {/* Settlement bank details */}
          <div className="space-y-4 pt-2">
            <h3 className="text-sm font-extrabold text-slate-200 border-b border-slate-800 pb-2 flex items-center gap-2">
              <Landmark className="w-4 h-4 text-indigo-400" />
              <span>Disbursal Bank Settlement Account</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">Bank Settlement Account Number</label>
                <input
                  type="text"
                  required
                  placeholder="Enter Account Number"
                  value={bankAccountNo}
                  onChange={(e) => setBankAccountNo(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 text-xs font-mono font-semibold"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">Bank IFSC Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SBIN0001234"
                  value={bankIfsc}
                  onChange={(e) => setBankIfsc(e.target.value.toUpperCase())}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 text-xs font-mono uppercase font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">Bank Name</label>
              <input
                type="text"
                required
                placeholder="e.g. State Bank of India"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 text-xs font-semibold"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-between">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="px-5 py-3 border border-slate-800 text-slate-400 hover:text-slate-200 font-bold rounded-2xl transition-all flex items-center gap-2 text-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-indigo-500 hover:bg-indigo-650 text-slate-950 disabled:bg-slate-800 disabled:text-slate-500 font-bold rounded-2xl shadow-lg shadow-indigo-500/10 transition-all flex items-center gap-2 text-xs active:scale-[0.98]"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Submit Profile for Review</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

    </div>
  );
}
