'use client';

import React, { useState, useEffect } from 'react';
import { AuthUser } from '@/app/providers';
import { 
  User, Mail, Phone, ShieldCheck, FileText, CheckCircle2, 
  CreditCard, Camera, UploadCloud, AlertTriangle, ArrowRight, 
  ArrowLeft, Download, Check, RefreshCw, Landmark, Trash2,
  LayoutGrid, Users, Coins, TrendingUp, FolderOpen, 
  ChevronRight, ChevronDown, BookOpen, FileUp, Calculator,
  Bell, Maximize2, Search, X, ShieldAlert
} from 'lucide-react';

const formatDate = (dateInput: string | Date | null | undefined) => {
  if (!dateInput) return 'N/A';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return 'N/A';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
};

const formatDateTime = (dateInput: string | Date | null | undefined) => {
  if (!dateInput) return 'N/A';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return 'N/A';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
};

export default function MerchantDashboard({ user }: { user: AuthUser }) {
  const [applications, setApplications] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Sidebar navigation tab state
  const [currentTab, setCurrentTab] = useState<'analytics' | 'client-records' | 'docs-upload' | 'emi-calc' | 'onboard' | 'loans' | 'disbursal-tracker' | 'loans-consumer' | 'disbursal-consumer'>('analytics');
  const [clientMasterOpen, setClientMasterOpen] = useState(true);
  const [loansMenuOpen, setLoansMenuOpen] = useState(true);
  const [disbursalMenuOpen, setDisbursalMenuOpen] = useState(true);

  // Sub-tabs for the Consumer Loans lists
  const [loansSubTab, setLoansSubTab] = useState<'PENDING' | 'IN_PROCESS' | 'REJECTED'>('PENDING');
  const [disbursalSubTab, setDisbursalSubTab] = useState<'DOCUMENT_UPLOAD' | 'VERIFICATION' | 'DISBURSAL'>('DISBURSAL');

  // Search filters
  const [loansSearchText, setLoansSearchText] = useState('');
  const [disbursalSearchText, setDisbursalSearchText] = useState('');

  // Comment input buffer state
  const [tempComments, setTempComments] = useState<Record<string, string>>({});
  const [savingComment, setSavingComment] = useState<Record<string, boolean>>({});

  // Search Customer Records states
  const [searchType, setSearchType] = useState('Select Search Type');
  const [searchValue, setSearchValue] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  // Wizard state
  const [wizardStep, setWizardStep] = useState<number>(1);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [applicationId, setApplicationId] = useState<string | null>(null);

  // STEP 1: Dual Contact Verification
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [phoneSent, setPhoneSent] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [mockPhoneCode, setMockPhoneCode] = useState('');
  const [mockEmailCode, setMockEmailCode] = useState('');

  // STEP 2: Profile & CIBIL consent
  const [profileForm, setProfileForm] = useState({
    fullName: '',
    dob: '1995-01-01',
    panNumber: '',
    addressLine1: '',
    addressLine2: '',
    pincode: '',
    city: '',
    state: '',
    residenceStatus: 'OWNED', 
  });
  const [cibilConsent, setCibilConsent] = useState(false);
  const [cibilFetched, setCibilFetched] = useState(false);
  const [cibilScore, setCibilScore] = useState<number | null>(null);
  const [cibilDetails, setCibilDetails] = useState<any>(null);

  // STEP 3: Aadhaar Verification
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [aadhaarFrontFile, setAadhaarFrontFile] = useState<File | null>(null);
  const [aadhaarBackFile, setAadhaarBackFile] = useState<File | null>(null);
  const [aadhaarFrontUrl, setAadhaarFrontUrl] = useState('');
  const [aadhaarBackUrl, setAadhaarBackUrl] = useState('');

  // STEP 4: Personal Info & References
  const [personalForm, setPersonalForm] = useState({
    monthlyIncome: 45000,
    existingEmi: 0,
    employmentType: 'SALARIED', 
    employmentDuration: 24,
    addressProofType: 'VOTER_ID', 
    reference1Name: '',
    reference1Mobile: '',
    reference2Name: '',
    reference2Mobile: '',
  });
  const [addressProofFile, setAddressProofFile] = useState<File | null>(null);
  const [addressProofUrl, setAddressProofUrl] = useState('');

  // STEP 5: Eligibility Check Results
  const [eligibilityResult, setEligibilityResult] = useState<any>(null);

  // STEP 6: Product Details
  const [productForm, setProductForm] = useState({
    productId: '',
    productName: '',
    productBrandName: '',
    productModelNo: '',
    productValue: 35000,
    productInsurance: 1500,
  });

  // STEP 7: Choose EMI scheme
  const [selectedTenure, setSelectedTenure] = useState<number>(6); 
  const [emiCalculation, setEmiCalculation] = useState<any>(null);

  // New calculator states
  const [selectedFrequency, setSelectedFrequency] = useState<string>('MONTHLY');
  const [selectedInsurancePlanName, setSelectedInsurancePlanName] = useState<string>('');

  // STEP 8 & 9: EMI OTP & Bank Details
  const [emiOtp, setEmiOtp] = useState('');
  const [emiOtpSent, setEmiOtpSent] = useState(false);
  const [mockEmiOtpCode, setMockEmiOtpCode] = useState('');
  const [bankForm, setBankForm] = useState({
    accountNumber: '',
    ifsc: '',
    accountType: 'SAVINGS', 
    bankVerifiedName: '',
    bankName: '',
    bankAddress: '',
  });

  // Docs Upload Hub UI Form state
  const [uploadHubForm, setUploadHubForm] = useState({
    loanId: '',
    documentType: 'PAN',
    identityType: 'LOAN_ID',
  });
  const [uploadHubFile, setUploadHubFile] = useState<File | null>(null);
  const [uploadHubFileProgress, setUploadHubFileProgress] = useState(false);

  // Active Pipeline Actions
  const [selectedPipelineApp, setSelectedPipelineApp] = useState<any | null>(null);
  const [pipelineAction, setPipelineAction] = useState<'DO_DOWNLOAD' | 'UPLOAD_INVOICE' | null>(null);
  const [invoiceForm, setInvoiceForm] = useState({
    invoiceNo: '',
    invoiceCost: 0,
    imeiNumber: '',
    productSerialNo: '',
  });
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [collateralFile, setCollateralFile] = useState<File | null>(null);
  const [insuranceFile, setInsuranceFile] = useState<File | null>(null);
  const [selfieProductFile, setSelfieProductFile] = useState<File | null>(null);

  // Upload progress indicators
  const [uploadProgress, setUploadProgress] = useState<Record<string, boolean>>({});

  // Pagination & Search in Analytics View
  const [entriesLimit, setEntriesLimit] = useState(10);
  const [analyticsSearchQuery, setAnalyticsSearchQuery] = useState('');

  const fetchData = async () => {
    try {
      const appRes = await fetch('/api/applications');
      if (appRes.ok) {
        const appData = await appRes.json();
        setApplications(appData.applications);
      }

      const prodRes = await fetch('/api/admin/products');
      if (prodRes.ok) {
        const prodData = await prodRes.json();
        const activeProds = prodData.products.filter((p: any) => p.isActive);
        setProducts(activeProds);
        if (activeProds.length > 0 && !productForm.productId) {
          setProductForm((prev) => ({ ...prev, productId: activeProds[0].id }));
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Calculate EMI choices based on inputs
  useEffect(() => {
    if (products.length > 0 && productForm.productId) {
      const activeProd = products.find((p) => p.id === productForm.productId);
      if (activeProd) {
        const productVal = Number(productForm.productValue || 0);

        // 1. Calculate Down Payment based on active product downPaymentRate
        const dpRate = activeProd.downPaymentRate !== null ? Number(activeProd.downPaymentRate) : 20.00;
        const downPayment = Math.round(productVal * (dpRate / 100));

        // 2. Find selected insurance plan and calculate its amount
        let insuranceAmt = 0;
        if (selectedInsurancePlanName && activeProd.insurancePlans) {
          const plans = Array.isArray(activeProd.insurancePlans) ? activeProd.insurancePlans : [];
          const plan = plans.find((p: any) => p.name === selectedInsurancePlanName);
          if (plan) {
            if (plan.type === 'FIXED') {
              insuranceAmt = Number(plan.value);
            } else if (plan.type === 'PERCENTAGE') {
              insuranceAmt = Math.round(productVal * (Number(plan.value) / 100));
            }
          }
        } else {
          // Fallback to static productInsurance if no plan is selected or available
          insuranceAmt = Number(productForm.productInsurance || 0);
        }

        // 3. Loan Amount = Product Value + Insurance Amount - Down Payment
        const loanAmount = Math.max(0, productVal + insuranceAmt - downPayment);

        // 4. EMI Amount based on interest rate, type, tenure, and frequency
        const interestRate = Number(activeProd.interestRate);
        const tenure = selectedTenure;
        const processingFee = Number(activeProd.processingFee);

        let emi = 0;
        let rate = interestRate / 100;

        // Periodic rate and total installments based on selectedFrequency
        let r = rate / 12; // monthly rate by default
        let N = tenure;    // monthly installments by default

        if (selectedFrequency === 'WEEKLY') {
          r = rate / 52;
          N = Math.round(tenure * 52 / 12);
        } else if (selectedFrequency === 'FORTNIGHTLY') {
          r = rate / 26;
          N = Math.round(tenure * 26 / 12);
        }

        if (activeProd.interestType === 'FLAT') {
          const totalInterest = loanAmount * (interestRate / 100) * (tenure / 12);
          emi = (loanAmount + totalInterest) / N;
        } else {
          // reducing balance formula
          if (r > 0) {
            emi = (loanAmount * r * Math.pow(1 + r, N)) / (Math.pow(1 + r, N) - 1);
          } else {
            emi = loanAmount / N;
          }
        }

        // 5. DBD = Loan Amount * (dbdRate / 100)
        const dbdRate = activeProd.dbdRate !== null ? Number(activeProd.dbdRate) : 2.00;
        const dbdAmount = Math.round(loanAmount * (dbdRate / 100));

        // 6. Payable to Store (Disbursal from Lender to Store) = Product Value - Down Payment - DBD
        const payableToStore = Math.max(0, productVal - downPayment - dbdAmount);

        // 7. Payable At Store by Customer = Down Payment + Processing Fee
        const customerPayableAtStore = downPayment + processingFee;

        setEmiCalculation({
          principal: loanAmount,
          loanAmount: loanAmount,
          downPayment: downPayment,
          emiAmount: Math.round(emi),
          processingFee: processingFee,
          payableToStore: Math.round(payableToStore),
          customerPayableAtStore: customerPayableAtStore,
          insuranceAmount: insuranceAmt,
          dbd: dbdAmount,
          frequency: selectedFrequency,
          totalLoanAmount: loanAmount,
          installmentsCount: N,
        });
      }
    }
  }, [
    productForm.productId, 
    productForm.productValue, 
    productForm.productInsurance, 
    selectedTenure, 
    selectedFrequency, 
    selectedInsurancePlanName, 
    products
  ]);

  // Send contact OTPs
  const handleSendContactOtp = async (channel: 'SMS' | 'EMAIL') => {
    setError('');
    setSuccess('');
    const body = channel === 'SMS' 
      ? { phoneNumber: customerPhone } 
      : { email: customerEmail };

    try {
      const res = await fetch('/api/auth/onboarding/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Failed to send ${channel} OTP`);

      if (channel === 'SMS') {
        setPhoneSent(true);
        if (data.mockOtp) setMockPhoneCode(data.mockOtp);
      } else {
        setEmailSent(true);
        if (data.mockOtp) setMockEmailCode(data.mockOtp);
      }
      setSuccess(`Verification OTP sent successfully via ${channel}.`);
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Verify contact OTPs
  const handleVerifyContactOtp = async (channel: 'SMS' | 'EMAIL') => {
    setError('');
    setSuccess('');
    const body = channel === 'SMS' 
      ? { phoneNumber: customerPhone, code: phoneOtp } 
      : { email: customerEmail, code: emailOtp };

    try {
      const res = await fetch('/api/auth/onboarding/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Invalid ${channel} OTP code`);

      if (channel === 'SMS') {
        setPhoneVerified(true);
      } else {
        setEmailVerified(true);
      }
      setSuccess(`${channel} verified successfully!`);
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Step progress auto-saver
  const saveStepProgress = async (nextStep: number, customPayload: Record<string, any> = {}) => {
    if (!applicationId) return;
    try {
      const res = await fetch(`/api/applications/${applicationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          onboardingStep: nextStep,
          ...customPayload
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to auto-save step progress');
      }
      setWizardStep(nextStep);
      fetchData();
    } catch (err: any) {
      setError(`Auto-save error: ${err.message}`);
    }
  };

  const handleProceedToProfile = async () => {
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/auth/onboarding/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: customerPhone,
          email: customerEmail,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to initialize customer account');
      }

      const custId = data.user.id;
      setCustomerId(custId);

      const defaultProductId = products[0]?.id || '';
      if (!defaultProductId) {
        throw new Error('No active loan products available to bind draft application');
      }

      const appRes = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: defaultProductId,
          requestedAmount: 35000,
          requestedTenure: selectedTenure,
          customerId: custId,
          status: 'DRAFT',
          onboardingStep: 2,
        }),
      });

      const appData = await appRes.json();
      if (!appRes.ok) {
        throw new Error(appData.error || 'Failed to initialize draft application');
      }

      setApplicationId(appData.application.id);
      setSuccess('Customer session registered and draft created.');
      setWizardStep(2);
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    }
  };

  // Fetch CIBIL details
  const handleFetchCibil = async () => {
    setError('');
    setSuccess('');
    if (!customerId) return;

    try {
      const res = await fetch('/api/verification/cibil', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          panNumber: profileForm.panNumber,
          dob: profileForm.dob,
          fullName: profileForm.fullName,
          consent: cibilConsent,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'CIBIL fetch failed');

      setCibilFetched(true);
      setCibilScore(data.data.score);
      setCibilDetails(data.data);
      setSuccess(`CIBIL Score pulled successfully: ${data.data.score}`);
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Handle optimized file uploads
  const handleOptimizeFileUpload = async (type: string, file: File) => {
    if (!customerId) return;
    setError('');
    setSuccess('');
    setUploadProgress((prev) => ({ ...prev, [type]: true }));

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);
      formData.append('customerId', customerId);

      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');

      if (type === 'AADHAAR') {
        if (!aadhaarFrontUrl) {
          setAadhaarFrontFile(file);
          setAadhaarFrontUrl(data.url);
        } else {
          setAadhaarBackFile(file);
          setAadhaarBackUrl(data.url);
        }
      } else if (type === 'BANK_PROOF') {
        setAddressProofFile(file);
        setAddressProofUrl(data.url);
      } else if (type === 'INVOICE') {
        setInvoiceFile(file);
      } else if (type === 'PAN') {
        setCollateralFile(file);
      } else if (type === 'NOC') {
        setInsuranceFile(file);
      } else if (type === 'SELFIE') {
        setSelfieProductFile(file);
      }

      setSuccess(`Document optimized & saved successfully as WebP! size reduced.`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploadProgress((prev) => ({ ...prev, [type]: false }));
    }
  };

  // Step 2 Proceed: Save Profile Form & Progress
  const handleSaveStep2 = async () => {
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...profileForm,
          aadhaarNumber: `9999${Math.floor(10000000 + Math.random() * 90000000)}`,
          monthlyIncome: 45000,
          employmentType: 'SALARIED',
          employmentDuration: 24,
          bankAccountNo: '0000000000',
          bankIfsc: 'ICIC0000000',
          bankName: 'Placeholder Bank',
          cibilScore,
          userId: customerId,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save customer profile');

      setSuccess('Profile details saved.');
      await saveStepProgress(3);
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Step 3 Proceed: Save Aadhaar Upload Progress
  const handleSaveStep3 = async () => {
    await saveStepProgress(4);
  };

  // Step 4 Proceed: Submit Full Profile and references, then calculate Eligibility
  const handleSubmitProfileAndPersonal = async () => {
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...profileForm,
          ...personalForm,
          aadhaarNumber,
          bankAccountNo: '0000000000', 
          bankIfsc: 'ICIC0000000',
          bankName: 'Placeholder Bank',
          cibilScore,
          userId: customerId,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save customer profile');

      setSuccess('Profile details updated.');
      
      // Transition application to UNDER_REVIEW and keep onboardingStep at 4 for manual verification
      const appUpdateRes = await fetch(`/api/applications/${applicationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'UNDER_REVIEW',
          onboardingStep: 4,
        }),
      });
      
      const appUpdateData = await appUpdateRes.json();
      if (!appUpdateRes.ok) throw new Error(appUpdateData.error || 'Failed to submit application for verification');

      setSuccess('Profile details saved and application submitted for admin document verification!');
      await fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Trigger EMI otp send
  const handleSendEmiOtp = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setMockEmiOtpCode(code);
    setEmiOtpSent(true);
    setSuccess(`EMI confirmation OTP code sent to customer phone and email: ${code}`);
  };

  // Finalize onboarding loan application
  const handleFinalizeOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (emiOtp !== mockEmiOtpCode) {
      setError('Invalid EMI authorization OTP code');
      return;
    }

    try {
      const profUpdateRes = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...profileForm,
          ...personalForm,
          aadhaarNumber,
          bankAccountNo: bankForm.accountNumber,
          bankIfsc: bankForm.ifsc,
          bankName: bankForm.bankName,
          cibilScore,
          userId: customerId,
        }),
      });
      if (!profUpdateRes.ok) {
        const pErr = await profUpdateRes.json();
        throw new Error(pErr.error || 'Failed to update final bank details in profile');
      }

      const res = await fetch(`/api/applications/${applicationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'DOCUMENT_PENDING', 
          onboardingStep: 10,
          productName: productForm.productName,
          productBrandName: productForm.productBrandName,
          productModelNo: productForm.productModelNo,
          productValue: productForm.productValue,
          productInsurance: productForm.productInsurance,
          downPayment: emiCalculation.downPayment,
          processingFee: emiCalculation.processingFee,
          emiAmount: emiCalculation.emiAmount,
          payableToStore: emiCalculation.payableToStore,
          frequency: selectedFrequency,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update loan application details');

      setWizardStep(10);
      setSuccess('Onboarding finalized! Secure agreement link dispatched.');
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Resume Draft flow
  const handleResumeDraft = async (draftApp: any) => {
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const res = await fetch(`/api/applications/${draftApp.id}`);
      if (!res.ok) throw new Error('Failed to fetch draft details');

      const data = await res.json();
      const app = data.application;
      const cust = app.customer;
      const prof = cust.profile;

      setCustomerId(app.customerId);
      setApplicationId(app.id);

      setCustomerPhone(cust.phoneNumber);
      setCustomerEmail(cust.email || '');
      setPhoneVerified(true);
      setEmailVerified(true);

      if (prof) {
        setProfileForm({
          fullName: prof.fullName || '',
          dob: prof.dob ? new Date(prof.dob).toISOString().split('T')[0] : '1995-01-01',
          panNumber: prof.panNumber || '',
          addressLine1: prof.addressLine1 || '',
          addressLine2: prof.addressLine2 || '',
          pincode: prof.pincode || '',
          city: prof.city || '',
          state: prof.state || '',
          residenceStatus: prof.residenceStatus || 'OWNED',
        });
        setPersonalForm({
          monthlyIncome: Number(prof.monthlyIncome) || 45000,
          existingEmi: Number(prof.existingEmi) || 0,
          employmentType: prof.employmentType || 'SALARIED',
          employmentDuration: Number(prof.employmentDuration) || 24,
          addressProofType: prof.addressProofType || 'VOTER_ID',
          reference1Name: prof.reference1Name || '',
          reference1Mobile: prof.reference1Mobile || '',
          reference2Name: prof.reference2Name || '',
          reference2Mobile: prof.reference2Mobile || '',
        });
        setAadhaarNumber(prof.aadhaarNumber && !prof.aadhaarNumber.startsWith('9999') ? prof.aadhaarNumber : '');
        setBankForm({
          accountNumber: prof.bankAccountNo && prof.bankAccountNo !== '0000000000' ? prof.bankAccountNo : '',
          ifsc: prof.bankIfsc && prof.bankIfsc !== 'ICIC0000000' ? prof.bankIfsc : '',
          accountType: 'SAVINGS',
          bankVerifiedName: prof.fullName || '',
          bankName: prof.bankName && prof.bankName !== 'Placeholder Bank' ? prof.bankName : '',
          bankAddress: '',
        });
        setCibilScore(prof.cibilScore);
        if (prof.cibilScore) {
          setCibilFetched(true);
        }
      }

      setProductForm({
        productId: app.productId || '',
        productName: app.productName || '',
        productBrandName: app.productBrandName || '',
        productModelNo: app.productModelNo || '',
        productValue: Number(app.productValue) || 35000,
        productInsurance: Number(app.productInsurance) || 1500,
      });
      setSelectedTenure(app.requestedTenure || 6);

      setEligibilityResult(app.eligibilityCheck);
      setWizardStep(app.onboardingStep);
      setCurrentTab('onboard');
      setSuccess('Draft application loaded successfully!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Reset Onboarding State
  const resetOnboarding = () => {
    setWizardStep(1);
    setCustomerId(null);
    setApplicationId(null);
    setCustomerPhone('');
    setCustomerEmail('');
    setPhoneOtp('');
    setEmailOtp('');
    setPhoneSent(false);
    setEmailSent(false);
    setPhoneVerified(false);
    setEmailVerified(false);
    setCibilConsent(false);
    setCibilFetched(false);
    setCibilScore(null);
    setAadhaarNumber('');
    setAadhaarFrontFile(null);
    setAadhaarBackFile(null);
    setAadhaarFrontUrl('');
    setAadhaarBackUrl('');
    setAddressProofFile(null);
    setAddressProofUrl('');
    setEmiOtp('');
    setEmiOtpSent(false);
    setProfileForm({
      fullName: '',
      dob: '1995-01-01',
      panNumber: '',
      addressLine1: '',
      addressLine2: '',
      pincode: '',
      city: '',
      state: '',
      residenceStatus: 'OWNED',
    });
    setPersonalForm({
      monthlyIncome: 45000,
      existingEmi: 0,
      employmentType: 'SALARIED',
      employmentDuration: 24,
      addressProofType: 'VOTER_ID',
      reference1Name: '',
      reference1Mobile: '',
      reference2Name: '',
      reference2Mobile: '',
    });
  };

  // Upload Invoice details
  const handleUploadInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!selectedPipelineApp) return;

    try {
      const res = await fetch(`/api/applications/${selectedPipelineApp.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'UNDER_REVIEW', 
          invoiceNo: invoiceForm.invoiceNo,
          invoiceCost: Number(invoiceForm.invoiceCost),
          imeiNumber: invoiceForm.imeiNumber,
          productSerialNo: invoiceForm.productSerialNo,
          invoiceUploaded: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit invoice details');

      setSuccess('Invoice submitted! Loan is out for verification.');
      setSelectedPipelineApp(null);
      setPipelineAction(null);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Dedicated Docs Upload Hub logic
  const handleDocsHubUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!uploadHubForm.loanId) {
      setError('Please provide an Identity Value');
      return;
    }
    if (!uploadHubFile) {
      setError('Please choose or drag a file to upload');
      return;
    }

    setUploadHubFileProgress(true);
    try {
      // Find associated application to get customerId
      let matchedApp;
      if (uploadHubForm.identityType === 'LOAN_ID') {
        matchedApp = applications.find(app => app.id === uploadHubForm.loanId || app.id.startsWith(uploadHubForm.loanId));
      } else {
        // Customer Code Search
        matchedApp = applications.find(app => app.customerId === uploadHubForm.loanId || app.customerId.startsWith(uploadHubForm.loanId));
      }
      
      if (!matchedApp) {
        throw new Error('Specified Identity Value was not found in registered database records.');
      }

      const formData = new FormData();
      formData.append('file', uploadHubFile);
      formData.append('type', uploadHubForm.documentType);
      formData.append('customerId', matchedApp.customerId);

      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Document upload failed');

      setSuccess(`Success: ${uploadHubForm.documentType} uploaded to Customer: ${matchedApp.customer.profile?.fullName}!`);
      setUploadHubFile(null);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploadHubFileProgress(false);
    }
  };

  // Client Records search action
  const handleSearchCustomerRecords = (e: React.FormEvent) => {
    e.preventDefault();
    setHasSearched(true);
    if (!searchValue.trim()) {
      setSearchResults(applications);
      return;
    }

    const value = searchValue.toLowerCase().trim();
    const filtered = applications.filter((app) => {
      const profile = app.customer.profile;
      if (searchType === 'Mobile Number') {
        return app.customer.phoneNumber.includes(value);
      } else if (searchType === 'PAN Number') {
        return profile?.panNumber?.toLowerCase().includes(value);
      } else if (searchType === 'Customer Code') {
        return app.customerId.toLowerCase().includes(value);
      } else {
        // Default matches any
        return (
          app.customer.phoneNumber.includes(value) ||
          profile?.panNumber?.toLowerCase().includes(value) ||
          profile?.fullName?.toLowerCase().includes(value) ||
          app.customerId.toLowerCase().includes(value)
        );
      }
    });

    setSearchResults(filtered);
  };

  const handleSaveComment = async (appId: string) => {
    const commentText = tempComments[appId];
    if (commentText === undefined) return;
    setError('');
    setSuccess('');
    setSavingComment((prev) => ({ ...prev, [appId]: true }));
    try {
      const res = await fetch(`/api/applications/${appId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ remarks: commentText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save comment');
      setSuccess('Comment saved successfully!');
      fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSavingComment((prev) => ({ ...prev, [appId]: false }));
    }
  };

  // Filters for Analytics table
  const filteredAnalyticsApplications = applications.filter((app) => {
    if (!analyticsSearchQuery) return true;
    const query = analyticsSearchQuery.toLowerCase();
    const profile = app.customer.profile;
    return (
      profile?.fullName?.toLowerCase().includes(query) ||
      app.customer.phoneNumber.includes(query) ||
      profile?.panNumber?.toLowerCase().includes(query) ||
      app.id.toLowerCase().includes(query) ||
      app.status.toLowerCase().includes(query)
    );
  }).slice(0, entriesLimit);

  // Helper count applications based on loan type/status
  const totalLoanCount = applications.length;
  const disbursedCount = applications.filter(app => app.status === 'DISBURSED' || app.status === 'ACTIVE').length;
  const inProcessCount = applications.filter(app => ['UNDER_REVIEW', 'DOCUMENT_PENDING', 'APPROVED', 'MANDATE_PENDING', 'MANDATE_ACTIVE'].includes(app.status)).length;
  const rejectedCount = applications.filter(app => app.status === 'REJECTED').length;
  const draftApplications = applications.filter(app => app.status === 'DRAFT');

  // Extract all system notifications/audit logs from notes or fallbacks for display
  const mockNotifications = [
    { text: 'Application DISBURSAL-PENDING.(Partner-ORO003,Agent-.CustomerCode-OROXXFKO).Reason-OK', date: '05-06-2026 04:22:09' },
    { text: 'Application VERIFICATION.(Partner-ORO003,Agent-.CustomerCode-OROSXHTQ).Reason-Invoice Updated', date: '05-06-2026 03:51:34' },
    { text: 'Application UNDER_REVIEW.(Partner-ORO003,Agent-.CustomerCode-OROXXFKO).Reason-Eligibility Passed', date: '05-06-2026 02:44:12' },
  ];

  // Extract latest comments from applications
  const allComments: any[] = [];
  applications.forEach(app => {
    if (app.notes) {
      app.notes.forEach((note: any) => {
        allComments.push({
          content: note.content,
          author: note.author.email,
          date: new Date(note.createdAt).toLocaleString(),
          loanId: app.id
        });
      });
    }
  });

  return (
    <div className="flex flex-1 min-h-[calc(100vh-65px)] bg-[#f4f6fd]">
      {/* SIDEBAR PANEL */}
      <aside className="w-64 bg-[#303F7A] text-white flex flex-col justify-between shrink-0 shadow-xl transition-all duration-300">
        <div className="flex flex-col">
          {/* Logo container matching exact design */}
          <div className="p-6 border-b border-white/10 flex items-center justify-start gap-2">
            <span className="text-2xl font-black tracking-wider text-white">oroboro</span>
          </div>

          {/* Nav links */}
          <nav className="p-4 space-y-1">
            <button
              onClick={() => setCurrentTab('analytics')}
              className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold rounded-xl transition-all ${
                currentTab === 'analytics' 
                  ? 'bg-white/10 text-white' 
                  : 'text-slate-200 hover:bg-white/5 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-4 h-4 shrink-0" />
              <span>AnalyticsDashboard</span>
            </button>

            {/* Collapsible Client Master */}
            <div>
              <button
                onClick={() => setClientMasterOpen(!clientMasterOpen)}
                className="w-full flex items-center justify-between px-4 py-3 text-slate-200 hover:bg-white/5 hover:text-white text-xs font-bold rounded-xl transition-all"
              >
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4 shrink-0" />
                  <span>Client Master</span>
                </div>
                {clientMasterOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>

              {clientMasterOpen && (
                <div className="pl-8 pr-2 py-1 space-y-1 border-l border-white/10 ml-6 mt-1">
                  <button
                    onClick={() => setCurrentTab('client-records')}
                    className={`w-full text-left px-3 py-2 text-[10px] font-bold tracking-wide rounded-lg block uppercase transition-all ${
                      currentTab === 'client-records' ? 'text-white bg-white/10' : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    - CLIENT RECORDS
                  </button>
                  <button
                    onClick={() => setCurrentTab('docs-upload')}
                    className={`w-full text-left px-3 py-2 text-[10px] font-bold tracking-wide rounded-lg block uppercase transition-all ${
                      currentTab === 'docs-upload' ? 'text-white bg-white/10' : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    - DOCS UPLOAD HUB
                  </button>
                  <button
                    onClick={() => setCurrentTab('emi-calc')}
                    className={`w-full text-left px-3 py-2 text-[10px] font-bold tracking-wide rounded-lg block uppercase transition-all ${
                      currentTab === 'emi-calc' ? 'text-white bg-white/10' : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    - EMI CALCULATOR
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => setCurrentTab('onboard')}
              className={`w-full flex items-center justify-between px-4 py-3 text-xs font-bold rounded-xl transition-all ${
                currentTab === 'onboard' 
                  ? 'bg-white/10 text-white' 
                  : 'text-slate-200 hover:bg-white/5 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <BookOpen className="w-4 h-4 shrink-0" />
                <span>Onboard</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Collapsible Loans */}
            <div>
              <button
                onClick={() => setLoansMenuOpen(!loansMenuOpen)}
                className="w-full flex items-center justify-between px-4 py-3 text-slate-200 hover:bg-white/5 hover:text-white text-xs font-bold rounded-xl transition-all"
              >
                <div className="flex items-center gap-3">
                  <Coins className="w-4 h-4 shrink-0" />
                  <span>Loans</span>
                </div>
                {loansMenuOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>

              {loansMenuOpen && (
                <div className="pl-8 pr-2 py-1 space-y-1 border-l border-white/10 ml-6 mt-1">
                  <button
                    onClick={() => setCurrentTab('loans-consumer')}
                    className={`w-full text-left px-3 py-2 text-[10px] font-bold tracking-wide rounded-lg block uppercase transition-all ${
                      currentTab === 'loans-consumer' ? 'text-white bg-white/10' : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    - CONSUMER LOANS
                  </button>
                </div>
              )}
            </div>

            {/* Collapsible Disbursal Tracker */}
            <div>
              <button
                onClick={() => setDisbursalMenuOpen(!disbursalMenuOpen)}
                className="w-full flex items-center justify-between px-4 py-3 text-slate-200 hover:bg-white/5 hover:text-white text-xs font-bold rounded-xl transition-all"
              >
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-4 h-4 shrink-0" />
                  <span>Disbursal Tracker</span>
                </div>
                {disbursalMenuOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>

              {disbursalMenuOpen && (
                <div className="pl-8 pr-2 py-1 space-y-1 border-l border-white/10 ml-6 mt-1">
                  <button
                    onClick={() => setCurrentTab('disbursal-consumer')}
                    className={`w-full text-left px-3 py-2 text-[10px] font-bold tracking-wide rounded-lg block uppercase transition-all ${
                      currentTab === 'disbursal-consumer' ? 'text-white bg-white/10' : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    - CONSUMER LOANS
                  </button>
                </div>
              )}
            </div>
          </nav>
        </div>

        <div className="p-4 border-t border-white/10 text-[10px] text-slate-300 text-center font-bold uppercase tracking-wider bg-black/10">
          Store Console : ID {user.id.substring(0,6)}
        </div>
      </aside>

      {/* WORKSPACE & GLOBAL HEADER SIMULATION */}
      <div className="flex-1 flex flex-col min-h-full">
        {/* Header bar matching exact screenshots */}
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0 shadow-sm">
          {/* Collapse sidebar icon */}
          <div className="flex items-center gap-4">
            <button className="text-slate-500 hover:text-slate-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          {/* Right Header items */}
          <div className="flex items-center gap-6">
            <button className="text-slate-500 hover:text-slate-700">
              <Maximize2 className="w-4 h-4" />
            </button>

            <div className="relative">
              <Bell className="w-4 h-4 text-slate-500 hover:text-slate-700" />
              <span className="absolute -top-2.5 -right-2.5 bg-rose-500 text-white text-[9px] font-black rounded-full px-1 py-0.5">100</span>
            </div>

            <div className="h-8 w-px bg-slate-200" />

            <div className="text-right">
              <span className="block text-xs font-black text-slate-900 leading-tight">BIJALA RAM</span>
              <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider">AGENT</span>
            </div>
          </div>
        </header>

        {/* WORKSPACE WORKSPACE */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          {/* Messages */}
          {error && <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-600 rounded-2xl text-center text-xs font-bold shadow-sm">{error}</div>}
          {success && <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-2xl text-center text-xs font-bold shadow-sm">{success}</div>}

          {/* TAB 1: ANALYTICS DASHBOARD */}
          {currentTab === 'analytics' && (
            <div className="space-y-8 animate-fadeIn">
              
              {/* Header Selector Row */}
              <div className="flex justify-between items-center">
                <div />
                <select className="bg-white border border-slate-300 text-slate-700 text-xs font-semibold px-4 py-2 rounded-xl focus:outline-none">
                  <option>Last 7 Days</option>
                  <option>Last 30 Days</option>
                  <option>All Time</option>
                </select>
              </div>

              {/* Performance Cards Row matching exact design */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                
                {/* Total Loan */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block">Total Loan</span>
                    <span className="text-3xl font-black text-slate-900 mt-2 block">{totalLoanCount}</span>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Coins className="w-6 h-6" />
                  </div>
                </div>

                {/* Disbursed */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block">Disbursed</span>
                    <span className="text-3xl font-black text-slate-900 mt-2 block">{disbursedCount}</span>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Landmark className="w-6 h-6" />
                  </div>
                </div>

                {/* In-Process */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block">In-Process</span>
                    <span className="text-3xl font-black text-slate-900 mt-2 block">{inProcessCount}</span>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
                    <FileText className="w-6 h-6" />
                  </div>
                </div>

                {/* Rejected */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block">Rejected</span>
                    <span className="text-3xl font-black text-slate-900 mt-2 block">{rejectedCount}</span>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                </div>

              </div>

              {/* Recent Loans table */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
                <h2 className="text-md font-extrabold text-slate-900">Recent Loans</h2>
                
                {/* Search & Entries header bar */}
                <div className="flex flex-col sm:flex-row justify-between gap-4 text-xs font-semibold text-slate-600">
                  <div className="flex items-center gap-2">
                    <span>Show</span>
                    <select
                      value={entriesLimit}
                      onChange={(e) => setEntriesLimit(Number(e.target.value))}
                      className="bg-white border border-slate-350 px-2 py-1 rounded focus:outline-none"
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                    </select>
                    <span>entries</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span>Search:</span>
                    <input
                      type="text"
                      value={analyticsSearchQuery}
                      onChange={(e) => setAnalyticsSearchQuery(e.target.value)}
                      className="bg-white border border-slate-350 px-3 py-1 rounded focus:outline-none font-medium text-slate-800"
                    />
                  </div>
                </div>

                {/* Data table */}
                {filteredAnalyticsApplications.length === 0 ? (
                  <p className="text-slate-400 text-center py-8 text-xs">No records found.</p>
                ) : (
                  <div className="overflow-x-auto border border-slate-150 rounded-2xl">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-700 bg-slate-50 font-bold uppercase">
                          <th className="py-3 px-4">AGENT</th>
                          <th className="py-3 px-4">PAN</th>
                          <th className="py-3 px-4">CUSTOMER</th>
                          <th className="py-3 px-4">LOAN NO.</th>
                          <th className="py-3 px-4">AMOUNT</th>
                          <th className="py-3 px-4">STATUS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                        {filteredAnalyticsApplications.map((app) => (
                          <tr key={app.id} className="hover:bg-slate-50/50">
                            <td className="py-3.5 px-4 font-bold text-slate-800">
                              {app.productBrandName || 'Bagoda Mobile And Accessories'}
                            </td>
                            <td className="py-3.5 px-4 font-mono">{app.customer.profile?.panNumber || 'FSXPR5224R'}</td>
                            <td className="py-3.5 px-4">{app.customer.profile?.fullName || 'Prospect Customer'}</td>
                            <td className="py-3.5 px-4 font-mono text-[10px] text-indigo-650">
                              ORO{app.id.substring(0,8).toUpperCase()}
                            </td>
                            <td className="py-3.5 px-4 font-black">₹{Number(app.productValue || app.requestedAmount).toLocaleString()}</td>
                            <td className="py-3.5 px-4 text-xs font-semibold">
                              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold ${
                                app.status === 'DISBURSED' || app.status === 'ACTIVE' 
                                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                                  : 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                              }`}>
                                {app.status === 'DISBURSED' ? 'Loan Disbursed successfully' : app.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Pagination footer bar */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-semibold text-slate-500 pt-4 border-t border-slate-100">
                  <span>Showing 1 to {filteredAnalyticsApplications.length} of {applications.length} entries</span>
                  
                  <div className="flex border border-slate-200 rounded-lg overflow-hidden font-bold">
                    <button className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border-r border-slate-200">First</button>
                    <button className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border-r border-slate-200">Previous</button>
                    <button className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border-r border-slate-200">Next</button>
                    <button className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700">Last</button>
                  </div>
                </div>
              </div>

              {/* Bottom Comments and Notifications section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Latest Comments */}
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                  <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-3">Latest Comments</h3>
                  
                  {allComments.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 text-xs font-bold uppercase tracking-wide">
                      No comments found.
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-60 overflow-y-auto pr-1">
                      {allComments.map((comment, idx) => (
                        <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-semibold">
                          <div className="flex justify-between text-slate-400 text-[10px] mb-1">
                            <span>{comment.author}</span>
                            <span>{comment.date}</span>
                          </div>
                          <p className="text-slate-800">{comment.content}</p>
                          <span className="text-[9px] text-indigo-600 block mt-1">Loan Ref: {comment.loanId.substring(0,8)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* System Notifications */}
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                  <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-3">Notifications</h3>
                  
                  <div className="space-y-4 max-h-60 overflow-y-auto pr-1">
                    {mockNotifications.map((notif, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-150 text-[11px] font-semibold text-slate-700">
                        <p className="leading-relaxed">{notif.text}</p>
                        <span className="block text-[9px] text-slate-400 mt-1.5">{notif.date}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 2: CLIENT MASTER -> CLIENT RECORDS */}
          {currentTab === 'client-records' && (
            <div className="space-y-8 animate-fadeIn">
              
              {/* Search customer records card */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden p-8 space-y-6">
                
                {/* Search Header layout */}
                <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                  <div className="w-12 h-12 bg-[#1E2B58] text-white rounded-full flex items-center justify-center shadow-lg">
                    <Search className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-extrabold text-[#1E2B58]">Search Customer Records</h2>
                    <p className="text-slate-400 text-xs font-semibold">Find customer profiles using various search criteria</p>
                  </div>
                </div>

                {/* Form row */}
                <form onSubmit={handleSearchCustomerRecords} className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                  
                  {/* Choose Search Type */}
                  <div>
                    <label className="block text-slate-500 text-xs font-bold uppercase mb-2">Choose Search Type</label>
                    <select
                      value={searchType}
                      onChange={(e) => setSearchType(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-slate-300 focus:border-indigo-600 focus:outline-none rounded-xl text-slate-800 text-xs font-bold cursor-pointer"
                    >
                      <option>Select Search Type</option>
                      <option>Customer Code</option>
                      <option>Mobile Number</option>
                      <option>PAN Number</option>
                    </select>
                  </div>

                  {/* Enter Search Value */}
                  <div>
                    <label className="block text-slate-500 text-xs font-bold uppercase mb-2">Enter Search Value</label>
                    <input
                      type="text"
                      placeholder="Type here..."
                      value={searchValue}
                      onChange={(e) => setSearchValue(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-slate-300 focus:border-indigo-600 focus:outline-none rounded-xl text-slate-800 text-xs font-medium"
                    />
                  </div>

                  {/* Search Button */}
                  <div>
                    <button
                      type="submit"
                      className="w-full py-3 bg-[#23356E] hover:bg-[#1E2E61] text-white font-extrabold uppercase text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 active:scale-[0.99] transition-all"
                    >
                      <Search className="w-4 h-4" /> Search
                    </button>
                  </div>

                </form>

              </div>

              {/* Search results list */}
              {hasSearched && (
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                  <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-3">Search Results</h3>
                  
                  {searchResults.length === 0 ? (
                    <p className="text-slate-400 text-center py-6 text-xs">No matching customer profiles found.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase bg-slate-50">
                            <th className="py-2.5 px-3">Client Name</th>
                            <th className="py-2.5 px-3">PAN No.</th>
                            <th className="py-2.5 px-3">Aadhaar No.</th>
                            <th className="py-2.5 px-3">CIBIL score</th>
                            <th className="py-2.5 px-3">Bank account</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                          {searchResults.map((app) => (
                            <tr key={app.id} className="hover:bg-slate-50/50">
                              <td className="py-3.5 px-3 font-bold text-slate-900">{app.customer.profile?.fullName || 'Prospect Customer'}</td>
                              <td className="py-3.5 px-3 font-mono">{app.customer.profile?.panNumber || 'N/A'}</td>
                              <td className="py-3.5 px-3 font-mono">
                                {app.customer.profile?.aadhaarNumber && !app.customer.profile?.aadhaarNumber.startsWith('9999') 
                                  ? app.customer.profile.aadhaarNumber 
                                  : 'PENDING'}
                              </td>
                              <td className="py-3.5 px-3">
                                {app.customer.profile?.cibilScore ? (
                                  <span className={`px-2 py-0.5 rounded font-extrabold text-[10px] ${
                                    app.customer.profile.cibilScore >= 650 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                                  }`}>
                                    {app.customer.profile.cibilScore}
                                  </span>
                                ) : 'N/A'}
                              </td>
                              <td className="py-3.5 px-3">
                                {app.customer.profile?.bankAccountNo && app.customer.profile?.bankAccountNo !== '0000000000' 
                                  ? `${app.customer.profile.bankName} (${app.customer.profile.bankAccountNo})`
                                  : 'PENDING'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

            </div>
          )}

          {/* TAB 3: CLIENT MASTER -> DOCS UPLOAD HUB (EXACT FORM FROM SCREENSHOTS) */}
          {currentTab === 'docs-upload' && (
            <div className="flex justify-center items-center py-12 animate-fadeIn">
              <div className="max-w-xl w-full bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
                <div className="px-8 py-5 bg-white border-b border-slate-100">
                  <h2 className="text-lg font-extrabold text-slate-900">Upload Document</h2>
                </div>
                <form onSubmit={handleDocsHubUpload} className="p-8 space-y-6">
                  
                  {/* Identity Type dropdown */}
                  <div>
                    <label className="block text-slate-700 text-xs font-bold mb-2">Identity Type</label>
                    <select
                      value={uploadHubForm.identityType}
                      onChange={(e) => setUploadHubForm({ ...uploadHubForm, identityType: e.target.value })}
                      className="w-full px-4 py-3 bg-white border border-slate-300 focus:border-indigo-650 focus:outline-none rounded-xl text-slate-800 text-xs font-bold cursor-pointer"
                    >
                      <option value="--Select--">--Select--</option>
                      <option value="CUSTOMER_CODE">Customer Code</option>
                      <option value="LOAN_ID">Loan ID</option>
                    </select>
                  </div>

                  {/* Identity Value input */}
                  <div>
                    <label className="block text-slate-700 text-xs font-bold mb-2">Identity Value</label>
                    
                    {/* Active dropdown choices list combined with input */}
                    <div className="flex gap-2 mb-2">
                      <select
                        onChange={(e) => setUploadHubForm({ ...uploadHubForm, loanId: e.target.value })}
                        value={uploadHubForm.loanId}
                        className="px-3 py-3 bg-slate-50 border border-slate-300 focus:border-indigo-600 rounded-xl text-slate-700 text-xs font-semibold focus:outline-none cursor-pointer"
                      >
                        <option value="">--Select Active App--</option>
                        {applications.map(app => (
                          <option key={app.id} value={uploadHubForm.identityType === 'LOAN_ID' ? app.id : app.customerId}>
                            {uploadHubForm.identityType === 'LOAN_ID' ? `App: ${app.id.substring(0,8)}` : `Cust: ${app.customerId.substring(0,8)}`} ({app.customer.profile?.fullName})
                          </option>
                        ))}
                      </select>
                    </div>

                    <input
                      type="text"
                      placeholder=""
                      required
                      value={uploadHubForm.loanId}
                      onChange={(e) => setUploadHubForm({ ...uploadHubForm, loanId: e.target.value })}
                      className="w-full px-4 py-3 bg-white border border-slate-300 focus:border-indigo-650 focus:outline-none rounded-xl text-slate-800 text-xs font-medium"
                    />
                  </div>

                  {/* Document Type select dropdown */}
                  <div>
                    <label className="block text-slate-700 text-xs font-bold mb-2">Document Type</label>
                    <select
                      value={uploadHubForm.documentType}
                      onChange={(e) => setUploadHubForm({ ...uploadHubForm, documentType: e.target.value })}
                      className="w-full px-4 py-3 bg-white border border-slate-300 focus:border-indigo-650 focus:outline-none rounded-xl text-slate-800 text-xs font-bold cursor-pointer"
                    >
                      <option value="--select--">--select--</option>
                      <option value="PAN">PAN Card Scan</option>
                      <option value="AADHAAR">Aadhaar Card Scan</option>
                      <option value="BANK_PROOF">Bank Statement / Proof</option>
                      <option value="SELFIE">Selfie Photo</option>
                      <option value="INVOICE">Product Invoice</option>
                      <option value="AGREEMENT">Signed Agreement</option>
                      <option value="NOC">No Objection Certificate (NOC)</option>
                    </select>
                  </div>

                  {/* Drag and Drop File box */}
                  <div>
                    <label className="block text-slate-700 text-xs font-bold mb-2">Choose or drag Your File</label>
                    <label className="flex flex-col items-center justify-center p-8 border border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-slate-400 rounded-xl cursor-pointer transition-all">
                      <span className="text-xs text-slate-500 font-bold">
                        {uploadHubFileProgress ? 'Optimizing & Uploading...' : 'Drag & Drop your files or Browse'}
                      </span>
                      <input
                        type="file"
                        disabled={uploadHubFileProgress}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) setUploadHubFile(file);
                        }}
                        className="hidden"
                      />
                    </label>
                    {uploadHubFile && (
                      <div className="mt-3 p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-xs font-bold text-indigo-700 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" /> Ready: {uploadHubFile.name}
                      </div>
                    )}
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={uploadHubFileProgress || !uploadHubFile}
                      className="w-full py-4 bg-slate-900 hover:bg-slate-950 text-white font-extrabold uppercase text-xs rounded-xl shadow-lg active:scale-[0.99] transition-all disabled:bg-slate-200 disabled:text-slate-400"
                    >
                      {uploadHubFileProgress ? 'Uploading...' : 'Proceed'}
                    </button>
                  </div>

                </form>
              </div>
            </div>
          )}

          {/* TAB 4: CLIENT MASTER -> EMI CALCULATOR */}
          {currentTab === 'emi-calc' && (() => {
            const activeProd = products.find((p) => p.id === productForm.productId);
            const tenureOptions = (() => {
              if (!activeProd) return [6, 12, 18, 24];
              const min = activeProd.minTenure;
              const max = activeProd.maxTenure;
              const options = [];
              for (let i = min; i <= max; i++) {
                if (i % 3 === 0 || i === min || i === max) {
                  options.push(i);
                }
              }
              return Array.from(new Set(options)).sort((a, b) => a - b);
            })();

            const frequencyOptions = (() => {
              if (!activeProd || !activeProd.supportedFrequencies) return ['MONTHLY'];
              return Array.isArray(activeProd.supportedFrequencies) ? activeProd.supportedFrequencies : ['MONTHLY'];
            })();

            const insurancePlans = (() => {
              if (!activeProd || !activeProd.insurancePlans) return [];
              return Array.isArray(activeProd.insurancePlans) ? activeProd.insurancePlans : [];
            })();

            return (
              <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
                <div className="flex justify-between items-center">
                  <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                      <Calculator className="w-6 h-6 text-indigo-650" />
                      EMI Calculator & Simulation
                    </h1>
                    <p className="text-slate-500 text-xs font-semibold mt-1">Configure product options to simulate customer repayments and store payouts.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  
                  {/* Inputs Column */}
                  <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-5">
                    <h2 className="text-sm font-extrabold text-slate-800 border-b border-slate-100 pb-3 uppercase tracking-wider text-xs">Parameters</h2>

                    <div className="space-y-4 text-xs font-semibold text-slate-700">
                      <div>
                        <label className="block text-slate-500 mb-1.5 uppercase">Choose Product Scheme</label>
                        <select
                          value={productForm.productId}
                          onChange={(e) => {
                            const pid = e.target.value;
                            const nextProd = products.find(p => p.id === pid);
                            setProductForm({ 
                              ...productForm, 
                              productId: pid,
                              productValue: nextProd ? Number(nextProd.minAmount) : productForm.productValue
                            });
                            // reset selection defaults
                            setSelectedInsurancePlanName('');
                            setSelectedFrequency('MONTHLY');
                            if (nextProd) {
                              setSelectedTenure(nextProd.minTenure);
                            }
                          }}
                          className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-800 font-bold focus:border-indigo-500 focus:outline-none cursor-pointer"
                        >
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>{p.name} ({Number(p.interestRate)}% p.a.)</option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-slate-500 mb-1.5 uppercase">Tenure</label>
                          <select
                            value={selectedTenure}
                            onChange={(e) => setSelectedTenure(Number(e.target.value))}
                            className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-800 font-bold focus:border-indigo-500 focus:outline-none cursor-pointer"
                          >
                            {tenureOptions.map((t) => (
                              <option key={t} value={t}>{t} Months</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-slate-500 mb-1.5 uppercase">Frequency</label>
                          <select
                            value={selectedFrequency}
                            onChange={(e) => setSelectedFrequency(e.target.value)}
                            className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-800 font-bold focus:border-indigo-500 focus:outline-none cursor-pointer"
                          >
                            {frequencyOptions.map((f: any) => (
                              <option key={f} value={f}>{f}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-slate-500 mb-1.5 uppercase">Insurance Protection Plan</label>
                        <select
                          value={selectedInsurancePlanName}
                          onChange={(e) => setSelectedInsurancePlanName(e.target.value)}
                          className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-800 font-bold focus:border-indigo-500 focus:outline-none cursor-pointer"
                        >
                          <option value="">-- No Insurance --</option>
                          {insurancePlans.map((plan: any) => (
                            <option key={plan.name} value={plan.name}>
                              {plan.name} ({plan.type === 'FIXED' ? `₹${plan.value}` : `${plan.value}%`})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-500 mb-1.5 uppercase">Product Retail Value (Cost)</label>
                        <div className="relative">
                          <span className="absolute left-4 top-2.5 text-slate-400 font-bold text-sm">₹</span>
                          <input
                            type="number"
                            value={productForm.productValue || ''}
                            onChange={(e) => setProductForm({ ...productForm, productValue: Number(e.target.value) })}
                            className="w-full pl-8 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-850 font-extrabold focus:border-indigo-500 focus:outline-none text-sm"
                            placeholder="Enter cost value"
                          />
                        </div>
                        {activeProd && (
                          <div className="flex justify-between text-[10px] text-slate-400 font-semibold mt-1.5 uppercase tracking-wide">
                            <span>Min: ₹{Number(activeProd.minAmount).toLocaleString()}</span>
                            <span>Max: ₹{Number(activeProd.maxAmount).toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Outputs/Results Column */}
                  <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 shadow-xl p-6 space-y-6">
                    <h2 className="text-sm font-extrabold text-slate-800 border-b border-slate-100 pb-3 uppercase tracking-wider text-xs">Simulation Output</h2>

                    {emiCalculation ? (
                      <div className="space-y-6 animate-fadeIn">
                        
                        {/* Primary EMI Callout */}
                        <div className="bg-gradient-to-br from-[#1E2E61] to-[#2E427E] text-white p-6 rounded-2xl flex justify-between items-center shadow-lg relative overflow-hidden">
                          <div className="z-10">
                            <span className="block text-slate-300 text-[10px] font-black uppercase tracking-wider">Estimated EMI Repayment</span>
                            <span className="text-3xl font-black tracking-tight">₹{emiCalculation.emiAmount.toLocaleString()}</span>
                            <span className="text-xs text-indigo-200 font-bold block mt-1">/ {emiCalculation.frequency.toLowerCase()}</span>
                          </div>
                          <div className="text-right z-10">
                            <span className="block text-slate-300 text-[10px] font-black uppercase tracking-wider">Total Installments</span>
                            <span className="text-2xl font-black block mt-1">{emiCalculation.installmentsCount}</span>
                            <span className="text-[10px] text-slate-300 font-bold">Over {selectedTenure} Months</span>
                          </div>
                          <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-4 translate-y-4">
                            <Coins className="w-40 h-40" />
                          </div>
                        </div>

                        {/* Calculations Breakdown Grid */}
                        <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-600">
                          
                          <div className="bg-slate-50 border border-slate-150 p-4 rounded-xl">
                            <span className="text-[10px] text-slate-400 font-bold block uppercase mb-1">Product Value</span>
                            <span className="text-slate-800 font-extrabold text-sm">₹{(productForm.productValue || 0).toLocaleString()}</span>
                          </div>

                          <div className="bg-slate-50 border border-slate-150 p-4 rounded-xl">
                            <span className="text-[10px] text-slate-400 font-bold block uppercase mb-1">Insurance Cost</span>
                            <span className="text-slate-800 font-extrabold text-sm">₹{emiCalculation.insuranceAmount.toLocaleString()}</span>
                            {selectedInsurancePlanName && (
                              <span className="text-[9px] text-indigo-650 font-bold block mt-0.5 uppercase">{selectedInsurancePlanName}</span>
                            )}
                          </div>

                          <div className="bg-slate-50 border border-slate-150 p-4 rounded-xl">
                            <span className="text-[10px] text-slate-400 font-bold block uppercase mb-1">Down Payment ({activeProd?.downPaymentRate !== null ? Number(activeProd?.downPaymentRate) : 20}%)</span>
                            <span className="text-slate-800 font-extrabold text-sm">₹{emiCalculation.downPayment.toLocaleString()}</span>
                          </div>

                          <div className="bg-indigo-50/40 border border-indigo-100 p-4 rounded-xl">
                            <span className="text-[10px] text-indigo-600 font-bold block uppercase mb-1">Total Loan Amount</span>
                            <span className="text-indigo-700 font-black text-sm">₹{emiCalculation.loanAmount.toLocaleString()}</span>
                            <span className="text-[9px] text-slate-400 font-semibold block mt-0.5">Financed principal</span>
                          </div>

                          <div className="bg-slate-50 border border-slate-150 p-4 rounded-xl">
                            <span className="text-[10px] text-slate-400 font-bold block uppercase mb-1">Upfront Processing Fee</span>
                            <span className="text-slate-800 font-extrabold text-sm">₹{emiCalculation.processingFee.toLocaleString()}</span>
                          </div>

                          <div className="bg-slate-50 border border-slate-150 p-4 rounded-xl">
                            <span className="text-[10px] text-slate-400 font-bold block uppercase mb-1">Dealer Buy Down (DBD) ({activeProd?.dbdRate !== null ? Number(activeProd?.dbdRate) : 2}%)</span>
                            <span className="text-slate-800 font-extrabold text-sm">₹{emiCalculation.dbd.toLocaleString()}</span>
                            <span className="text-[9px] text-slate-400 font-semibold block mt-0.5">Subvention paid by store</span>
                          </div>

                          <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-xl col-span-2 flex justify-between items-center">
                            <div>
                              <span className="text-[10px] text-emerald-600 font-bold block uppercase mb-1">Payable At Store (by Customer)</span>
                              <span className="text-emerald-700 font-black text-base">₹{emiCalculation.customerPayableAtStore.toLocaleString()}</span>
                            </div>
                            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide text-right">
                              Down Payment + Processing Fee
                            </div>
                          </div>

                          <div className="bg-indigo-50/30 border border-indigo-150 p-4 rounded-xl col-span-2 flex justify-between items-center">
                            <div>
                              <span className="text-[10px] text-indigo-600 font-bold block uppercase mb-1">Net Payout to Store (Store Receives)</span>
                              <span className="text-indigo-850 font-black text-base">₹{emiCalculation.payableToStore.toLocaleString()}</span>
                            </div>
                            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide text-right">
                              Product Value - DP - DBD
                            </div>
                          </div>

                        </div>

                        {/* Quick validation alerts */}
                        {activeProd && (productForm.productValue < Number(activeProd.minAmount) || productForm.productValue > Number(activeProd.maxAmount)) && (
                          <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-xs font-bold flex items-center gap-2">
                            <ShieldAlert className="w-4 h-4" />
                            Warning: Product value is outside this scheme's allowed limits (₹{Number(activeProd.minAmount).toLocaleString()} - ₹{Number(activeProd.maxAmount).toLocaleString()})
                          </div>
                        )}

                      </div>
                    ) : (
                      <p className="text-slate-400 text-xs text-center py-12 font-medium">Please enter product cost and choose parameters to run simulator.</p>
                    )}
                  </div>

                </div>
              </div>
            );
          })()}

          {/* TAB 5: ONBOARD WIZARD */}
          {currentTab === 'onboard' && (
            <div className="space-y-8 animate-fadeIn">
              {wizardStep === 1 && (
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <h2 className="text-md font-extrabold text-slate-900">Resume In-Progress Onboarding Drafts</h2>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-600">{draftApplications.length} Drafts</span>
                  </div>
                  {draftApplications.length === 0 ? (
                    <p className="text-slate-400 text-center py-4 text-xs font-semibold">No draft applications saved.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase bg-slate-50">
                            <th className="py-2.5 px-3 rounded-l-lg">Customer Phone</th>
                            <th className="py-2.5 px-3">Draft Application ID</th>
                            <th className="py-2.5 px-3">Last Active Step</th>
                            <th className="py-2.5 px-3 rounded-r-lg text-right">Resume Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                          {draftApplications.map((draft) => (
                            <tr key={draft.id} className="hover:bg-slate-50/50">
                              <td className="py-3 px-3 font-bold text-slate-900">
                                {draft.customer.phoneNumber}
                                <span className="block text-[10px] text-slate-400 font-normal">{draft.customer.email}</span>
                              </td>
                              <td className="py-3 px-3 font-mono">{draft.id}</td>
                              <td className="py-3 px-3 font-bold text-indigo-600">Step {draft.onboardingStep} of 10</td>
                              <td className="py-3 px-3 text-right">
                                <button
                                  onClick={() => handleResumeDraft(draft)}
                                  className="px-3 py-1.5 bg-[#23356E] hover:bg-[#1E2E61] text-white font-bold rounded-xl text-xs transition-all shadow-sm"
                                >
                                  Resume Onboarding
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* WIZARD CONTAINER */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 md:p-8 space-y-6">
                
                {/* Step Indicator Header */}
                <div className="flex items-center justify-between border-b border-slate-150 pb-6 overflow-x-auto gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center font-black">
                      {wizardStep}
                    </div>
                    <div>
                      <h2 className="font-extrabold text-slate-900 text-md">Onboarding Step {wizardStep} of 10</h2>
                      <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Draft Auto-Saves on Click Proceed</p>
                    </div>
                  </div>
                  <button
                    onClick={resetOnboarding}
                    className="px-4 py-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-bold rounded-xl transition-all"
                  >
                    Reset Wizard
                  </button>
                </div>

                {/* STEP 1: Dual Contact Verification */}
                {wizardStep === 1 && (
                  <div className="space-y-6">
                    <h3 className="text-md font-bold text-slate-800 flex items-center gap-2">
                      <Phone className="w-5 h-5 text-indigo-600" />
                      1. Customer Contact Verification
                    </h3>
                    <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                      Enter the customer's phone number and email. Secure codes are simulated to verify credentials.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* Phone verification */}
                      <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-4">
                        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Mobile Verification</h4>
                        <div>
                          <label className="block text-slate-500 text-xs font-bold mb-2 uppercase">Mobile Number</label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="+919876543210"
                              value={customerPhone}
                              onChange={(e) => setCustomerPhone(e.target.value)}
                              disabled={phoneVerified}
                              className="flex-1 px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-800 font-semibold focus:border-indigo-500 focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => handleSendContactOtp('SMS')}
                              disabled={phoneVerified || !customerPhone}
                              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-950 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
                            >
                              {phoneSent ? 'Resend' : 'Send'}
                            </button>
                          </div>
                        </div>
                        {phoneSent && !phoneVerified && (
                          <div>
                            <label className="block text-slate-500 text-xs font-bold mb-2 uppercase">Enter Mobile OTP</label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                maxLength={6}
                                placeholder="000000"
                                value={phoneOtp}
                                onChange={(e) => setPhoneOtp(e.target.value)}
                                className="flex-1 px-4 py-2 bg-white border border-slate-300 rounded-xl text-slate-800 font-mono tracking-widest text-center font-bold"
                              />
                              <button
                                type="button"
                                onClick={() => handleVerifyContactOtp('SMS')}
                                className="px-4 py-2 bg-[#23356E] text-white text-xs font-bold rounded-xl transition-all"
                              >
                                Verify
                              </button>
                            </div>
                            {mockPhoneCode && (
                              <p className="text-[10px] text-emerald-600 font-mono mt-1.5 font-bold uppercase tracking-wider">Sandbox code: {mockPhoneCode}</p>
                            )}
                          </div>
                        )}
                        {phoneVerified && (
                          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-600 text-xs font-bold rounded-xl flex items-center gap-2">
                            <Check className="w-4 h-4" /> Mobile Number Verified!
                          </div>
                        )}
                      </div>

                      {/* Email verification */}
                      <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-4">
                        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Email Verification</h4>
                        <div>
                          <label className="block text-slate-500 text-xs font-bold mb-2 uppercase">Email Address</label>
                          <div className="flex gap-2">
                            <input
                              type="email"
                              placeholder="customer@email.com"
                              value={customerEmail}
                              onChange={(e) => setCustomerEmail(e.target.value)}
                              disabled={emailVerified}
                              className="flex-1 px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-800 font-semibold focus:border-indigo-500 focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => handleSendContactOtp('EMAIL')}
                              disabled={emailVerified || !customerEmail}
                              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-950 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
                            >
                              {emailSent ? 'Resend' : 'Send'}
                            </button>
                          </div>
                        </div>
                        {emailSent && !emailVerified && (
                          <div>
                            <label className="block text-slate-500 text-xs font-bold mb-2 uppercase">Enter Email OTP</label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                maxLength={6}
                                placeholder="000000"
                                value={emailOtp}
                                onChange={(e) => setEmailOtp(e.target.value)}
                                className="flex-1 px-4 py-2 bg-white border border-slate-300 rounded-xl text-slate-800 font-mono tracking-widest text-center font-bold"
                              />
                              <button
                                type="button"
                                onClick={() => handleVerifyContactOtp('EMAIL')}
                                className="px-4 py-2 bg-[#23356E] text-white text-xs font-bold rounded-xl transition-all"
                              >
                                Verify
                              </button>
                            </div>
                            {mockEmailCode && (
                              <p className="text-[10px] text-emerald-600 font-mono mt-1.5 font-bold uppercase tracking-wider">Sandbox code: {mockEmailCode}</p>
                            )}
                          </div>
                        )}
                        {emailVerified && (
                          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-600 text-xs font-bold rounded-xl flex items-center gap-2">
                            <Check className="w-4 h-4" /> Email Address Verified!
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-right pt-6 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={handleProceedToProfile}
                      disabled={!phoneVerified || !emailVerified}
                      className="px-6 py-3 bg-[#23356E] hover:bg-[#1E2E61] disabled:bg-slate-100 disabled:text-slate-400 text-white font-bold rounded-xl flex items-center gap-2 ml-auto shadow-sm active:scale-95 transition-all text-xs"
                    >
                      Proceed to Details <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: Profile & CIBIL consent */}
              {wizardStep === 2 && (
                <div className="space-y-6">
                  <h3 className="text-md font-bold text-slate-800 flex items-center gap-2">
                    <User className="w-5 h-5 text-indigo-600" />
                    2. Customer Profile Details & CIBIL Bureau Consent
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-500 text-xs font-bold mb-2 uppercase">Full Name</label>
                      <input
                        type="text"
                        value={profileForm.fullName}
                        onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-800 font-semibold focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 text-xs font-bold mb-2 uppercase">Date of Birth</label>
                      <input
                        type="date"
                        value={profileForm.dob}
                        onChange={(e) => setProfileForm({ ...profileForm, dob: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-800 font-semibold focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 text-xs font-bold mb-2 uppercase">PAN Card Number</label>
                      <input
                        type="text"
                        maxLength={10}
                        placeholder="ABCDE1234F"
                        value={profileForm.panNumber}
                        onChange={(e) => setProfileForm({ ...profileForm, panNumber: e.target.value.toUpperCase() })}
                        className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-800 font-mono uppercase font-bold focus:outline-none"
                      />
                      <p className="text-[10px] text-slate-400 font-semibold mt-1">Tip: Use PAN starting with 'T' (e.g. TSTPA1234E) to test rejection/low CIBIL score.</p>
                    </div>
                    <div>
                      <label className="block text-slate-500 text-xs font-bold mb-2 uppercase">Email Address (Verified)</label>
                      <input
                        type="email"
                        value={customerEmail}
                        disabled
                        className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-400 font-medium cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 text-xs font-bold mb-2 uppercase">Address Line 1</label>
                      <input
                        type="text"
                        value={profileForm.addressLine1}
                        onChange={(e) => setProfileForm({ ...profileForm, addressLine1: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-800 font-semibold focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 text-xs font-bold mb-2 uppercase">Pincode</label>
                      <input
                        type="text"
                        maxLength={6}
                        value={profileForm.pincode}
                        onChange={(e) => setProfileForm({ ...profileForm, pincode: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-800 font-semibold focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 text-xs font-bold mb-2 uppercase">City</label>
                      <input
                        type="text"
                        value={profileForm.city}
                        onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-800 font-semibold focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 text-xs font-bold mb-2 uppercase">State</label>
                      <input
                        type="text"
                        value={profileForm.state}
                        onChange={(e) => setProfileForm({ ...profileForm, state: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-800 font-semibold focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 text-xs font-bold mb-2 uppercase">Residence Status</label>
                      <select
                        value={profileForm.residenceStatus}
                        onChange={(e) => setProfileForm({ ...profileForm, residenceStatus: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-800 font-semibold cursor-pointer"
                      >
                        <option value="OWNED">Owned Residence</option>
                        <option value="RENTED">Rented Apartment</option>
                        <option value="PARENTAL">Parental Home</option>
                      </select>
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-4">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id="consent"
                        checked={cibilConsent}
                        onChange={(e) => setCibilConsent(e.target.checked)}
                        className="w-4 h-4 mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-transparent"
                      />
                      <label htmlFor="consent" className="text-slate-700 text-xs leading-relaxed font-bold">
                        I agree to fetch my CIBIL bureau details from Credit Information Companies via Decentro.tech sandbox API.
                      </label>
                    </div>

                    {cibilConsent && !cibilFetched && (
                      <button
                        type="button"
                        onClick={handleFetchCibil}
                        disabled={!profileForm.panNumber || !profileForm.fullName}
                        className="px-4 py-2 bg-[#23356E] hover:bg-[#1E2E61] disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
                      >
                        Pull Credit Report from Decentro
                      </button>
                    )}

                    {cibilFetched && cibilScore !== null && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-slate-200 pt-4 text-xs font-semibold">
                        <div className="bg-white p-3 rounded-xl border border-slate-100 text-center">
                          <span className="block text-slate-400">CIBIL Bureau Score</span>
                          <span className={`text-2xl font-black ${cibilScore >= 650 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {cibilScore}
                          </span>
                        </div>
                        <div className="bg-white p-3 rounded-xl border border-slate-100">
                          <span className="block text-slate-400">Active Accounts:</span>
                          <span className="text-slate-700 font-black">{cibilDetails?.summary?.activeAccounts}</span>
                        </div>
                        <div className="bg-white p-3 rounded-xl border border-slate-100">
                          <span className="block text-slate-400">Outstanding:</span>
                          <span className="text-slate-700 font-black">₹{cibilDetails?.summary?.totalOutstandingBalance.toLocaleString()}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between pt-6 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setWizardStep(1)}
                      className="px-5 py-3 bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-700 font-bold rounded-xl flex items-center gap-2 text-xs"
                    >
                      <ArrowLeft className="w-4 h-4" /> Back
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveStep2}
                      disabled={!cibilFetched}
                      className="px-6 py-3 bg-[#23356E] hover:bg-[#1E2E61] disabled:bg-slate-150 disabled:text-slate-400 text-white font-bold rounded-xl flex items-center gap-2 text-xs"
                    >
                      Proceed <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: Aadhaar Verification */}
              {wizardStep === 3 && (
                <div className="space-y-6">
                  <h3 className="text-md font-bold text-slate-800 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-indigo-600" />
                    3. Aadhaar Verification & Document Uploads
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-slate-500 text-xs font-bold mb-2 uppercase">Aadhaar Card Number</label>
                      <input
                        type="text"
                        maxLength={12}
                        placeholder="000000000000"
                        value={aadhaarNumber}
                        onChange={(e) => setAadhaarNumber(e.target.value)}
                        className="w-full max-w-md px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-800 font-mono tracking-widest text-center text-lg font-bold focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
                      {/* Front Side */}
                      <div className="border border-slate-200 bg-slate-50 p-6 rounded-2xl text-center space-y-4">
                        <span className="text-xs font-bold text-slate-600 block uppercase tracking-wide">Aadhaar Front Photo</span>
                        <label className="flex flex-col items-center justify-center p-4 border border-dashed border-slate-300 hover:border-slate-400 bg-white rounded-xl cursor-pointer transition-all">
                          <UploadCloud className="w-8 h-8 text-indigo-500 mb-2" />
                          <span className="text-[10px] text-slate-500 font-bold uppercase">
                            {uploadProgress['AADHAAR'] ? 'Optimizing WebP...' : 'Choose File'}
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            disabled={uploadProgress['AADHAAR']}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleOptimizeFileUpload('AADHAAR', file);
                            }}
                            className="hidden"
                          />
                        </label>
                        {aadhaarFrontFile && (
                          <p className="text-[11px] text-emerald-600 font-bold">✓ Uploaded: {aadhaarFrontFile.name}</p>
                        )}
                      </div>

                      {/* Back Side */}
                      <div className="border border-slate-200 bg-slate-50 p-6 rounded-2xl text-center space-y-4">
                        <span className="text-xs font-bold text-slate-600 block uppercase tracking-wide">Aadhaar Back Photo</span>
                        <label className="flex flex-col items-center justify-center p-4 border border-dashed border-slate-300 hover:border-slate-400 bg-white rounded-xl cursor-pointer transition-all">
                          <UploadCloud className="w-8 h-8 text-indigo-500 mb-2" />
                          <span className="text-[10px] text-slate-500 font-bold uppercase">
                            {uploadProgress['AADHAAR_BACK'] ? 'Optimizing WebP...' : 'Choose File'}
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            disabled={uploadProgress['AADHAAR_BACK']}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleOptimizeFileUpload('AADHAAR', file);
                            }}
                            className="hidden"
                          />
                        </label>
                        {aadhaarBackFile && (
                          <p className="text-[11px] text-emerald-600 font-bold">✓ Uploaded: {aadhaarBackFile.name}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between pt-6 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setWizardStep(2)}
                      className="px-5 py-3 bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-700 font-bold rounded-xl flex items-center gap-2 text-xs"
                    >
                      <ArrowLeft className="w-4 h-4" /> Back
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveStep3}
                      disabled={!aadhaarNumber || !aadhaarFrontFile}
                      className="px-6 py-3 bg-[#23356E] hover:bg-[#1E2E61] disabled:bg-slate-150 disabled:text-slate-400 text-white font-bold rounded-xl flex items-center gap-2 text-xs"
                    >
                      Proceed <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 4: Personal Info & References */}
              {wizardStep === 4 && (
                <div className="space-y-6">
                  {(() => {
                    const currentApp = applications.find(a => a.id === applicationId);
                    const docs = currentApp?.customer?.profile?.documents || [];
                    const aadhaarDoc = docs.find((d: any) => d.type === 'AADHAAR');
                    const bankProofDoc = docs.find((d: any) => d.type === 'BANK_PROOF');

                    if (currentApp?.status === 'UNDER_REVIEW') {
                      return (
                        <div className="space-y-6">
                          <div className="text-center space-y-4 py-6">
                            <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-200 text-amber-550 flex items-center justify-center mx-auto text-3xl font-black animate-pulse">
                              ⏳
                            </div>
                            <h3 className="text-xl font-black text-slate-900">Application Under Admin Review</h3>
                            <p className="text-slate-500 text-xs max-w-md mx-auto font-medium leading-relaxed">
                              The customer's onboarding profile and uploaded documents are currently pending manual approval by the credit administration team.
                            </p>
                          </div>

                          <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-4">
                            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Document Verification Status</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="bg-white p-4 border border-slate-100 rounded-xl flex flex-col justify-between space-y-3">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <span className="font-bold text-xs block text-slate-800 uppercase">Aadhaar Card</span>
                                    <span className="text-[10px] text-slate-400 font-bold block mt-0.5">
                                      {aadhaarDoc ? `Version: ${aadhaarDoc.version}` : 'Not Uploaded'}
                                    </span>
                                  </div>
                                  <span className={`text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase border ${
                                    aadhaarDoc?.status === 'VERIFIED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                    aadhaarDoc?.status === 'REJECTED' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                    'bg-amber-50 text-amber-600 border-amber-100'
                                  }`}>
                                    {aadhaarDoc ? aadhaarDoc.status : 'MISSING'}
                                  </span>
                                </div>
                                {aadhaarDoc?.status === 'REJECTED' && (
                                  <div className="space-y-2 pt-2 border-t border-slate-100">
                                    <p className="text-[10px] text-rose-600 font-bold">Reason: {aadhaarDoc.rejectionReason}</p>
                                    <label className="flex items-center gap-2 p-2 border border-dashed border-rose-300 bg-rose-50/30 hover:bg-rose-50/50 rounded-lg cursor-pointer transition-all">
                                      <UploadCloud className="w-4 h-4 text-rose-500" />
                                      <span className="text-[10px] text-slate-650 font-bold">Re-upload Aadhaar</span>
                                      <input
                                        type="file"
                                        accept="image/*"
                                        disabled={uploadProgress['AADHAAR']}
                                        onChange={(e) => {
                                          const file = e.target.files?.[0];
                                          if (file) handleOptimizeFileUpload('AADHAAR', file);
                                        }}
                                        className="hidden"
                                      />
                                    </label>
                                  </div>
                                )}
                              </div>

                              <div className="bg-white p-4 border border-slate-100 rounded-xl flex flex-col justify-between space-y-3">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <span className="font-bold text-xs block text-slate-800 uppercase">Address / Bank Proof</span>
                                    <span className="text-[10px] text-slate-400 font-bold block mt-0.5">
                                      {bankProofDoc ? `Version: ${bankProofDoc.version}` : 'Not Uploaded'}
                                    </span>
                                  </div>
                                  <span className={`text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase border ${
                                    bankProofDoc?.status === 'VERIFIED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                    bankProofDoc?.status === 'REJECTED' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                    'bg-amber-50 text-amber-600 border-amber-100'
                                  }`}>
                                    {bankProofDoc ? bankProofDoc.status : 'MISSING'}
                                  </span>
                                </div>
                                {bankProofDoc?.status === 'REJECTED' && (
                                  <div className="space-y-2 pt-2 border-t border-slate-100">
                                    <p className="text-[10px] text-rose-600 font-bold">Reason: {bankProofDoc.rejectionReason}</p>
                                    <label className="flex items-center gap-2 p-2 border border-dashed border-rose-300 bg-rose-50/30 hover:bg-rose-50/50 rounded-lg cursor-pointer transition-all">
                                      <UploadCloud className="w-4 h-4 text-rose-500" />
                                      <span className="text-[10px] text-slate-650 font-bold">Re-upload Address Proof</span>
                                      <input
                                        type="file"
                                        accept="image/*"
                                        disabled={uploadProgress['BANK_PROOF']}
                                        onChange={(e) => {
                                          const file = e.target.files?.[0];
                                          if (file) handleOptimizeFileUpload('BANK_PROOF', file);
                                        }}
                                        className="hidden"
                                      />
                                    </label>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {((aadhaarDoc?.status === 'REJECTED' && uploadProgress['AADHAAR'] !== true) || 
                            (bankProofDoc?.status === 'REJECTED' && uploadProgress['BANK_PROOF'] !== true)) && (
                            <div className="p-4 bg-rose-50 border border-rose-150 rounded-2xl flex items-center justify-between">
                              <span className="text-xs text-rose-700 font-bold">Please re-upload rejected files and click Re-submit.</span>
                              <button
                                onClick={async () => {
                                  setError('');
                                  setSuccess('');
                                  try {
                                    const res = await fetch(`/api/applications/${applicationId}`, {
                                      method: 'PUT',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({
                                        status: 'UNDER_REVIEW',
                                        onboardingStep: 4,
                                      }),
                                    });
                                    if (!res.ok) throw new Error('Failed to re-submit for review');
                                    setSuccess('Application successfully re-submitted for admin verification!');
                                    fetchData();
                                  } catch (err: any) {
                                    setError(err.message);
                                  }
                                }}
                                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-sm"
                              >
                                Re-submit for Review
                              </button>
                            </div>
                          )}

                          <div className="flex justify-between items-center pt-6 border-t border-slate-100">
                            <button
                              type="button"
                              onClick={() => setWizardStep(3)}
                              className="px-5 py-3 bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-700 font-bold rounded-xl flex items-center gap-2 text-xs"
                            >
                              <ArrowLeft className="w-4 h-4" /> Back to Uploads
                            </button>
                            
                            <button
                              type="button"
                              onClick={async () => {
                                await fetchData();
                                setSuccess('Verification statuses refreshed!');
                              }}
                              className="px-5 py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold rounded-xl flex items-center gap-2 text-xs"
                            >
                              <RefreshCw className="w-4 h-4" /> Refresh Approval Status
                            </button>
                          </div>
                        </div>
                      );
                    }

                    if (currentApp && currentApp.onboardingStep >= 5) {
                      return (
                        <div className="space-y-6 text-center py-6">
                          <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-250 text-emerald-600 flex items-center justify-center mx-auto text-3xl font-black">
                            ✓
                          </div>
                          <h3 className="text-xl font-black text-slate-900">Documents Verified!</h3>
                          <p className="text-slate-500 text-xs max-w-md mx-auto font-medium leading-relaxed">
                            The credit administrator has verified the uploaded documents and approved the onboarding request. You can now evaluate credit eligibility and proceed to configure the loan.
                          </p>
                          <button
                            type="button"
                            onClick={async () => {
                              // fetch eligibility details
                              const checkRes = await fetch(`/api/applications/${applicationId}`);
                              if (checkRes.ok) {
                                const checkData = await checkRes.json();
                                setEligibilityResult(checkData.application.eligibilityCheck);
                              }
                              setWizardStep(5);
                            }}
                            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl inline-flex items-center gap-2 text-xs shadow-md transition-all active:scale-95"
                          >
                            Proceed to Eligibility Decision <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-6">
                        <h3 className="text-md font-bold text-slate-800 flex items-center gap-2">
                          <FileText className="w-5 h-5 text-indigo-600" />
                          4. Employment, References & Address Proof
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-slate-500 text-xs font-bold mb-2 uppercase">Monthly Income (INR)</label>
                            <input
                              type="number"
                              value={personalForm.monthlyIncome}
                              onChange={(e) => setPersonalForm({ ...personalForm, monthlyIncome: Number(e.target.value) })}
                              className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-800 font-semibold"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-500 text-xs font-bold mb-2 uppercase">Existing EMI obligations</label>
                            <input
                              type="number"
                              value={personalForm.existingEmi}
                              onChange={(e) => setPersonalForm({ ...personalForm, existingEmi: Number(e.target.value) })}
                              className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-800 font-semibold"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-500 text-xs font-bold mb-2 uppercase">Employment Type</label>
                            <select
                              value={personalForm.employmentType}
                              onChange={(e) => setPersonalForm({ ...personalForm, employmentType: e.target.value })}
                              className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-800 font-semibold cursor-pointer"
                            >
                              <option value="SALARIED">Salaried Employee</option>
                              <option value="SELF_EMPLOYED">Self Employed</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-slate-500 text-xs font-bold mb-2 uppercase">Employment Duration (Months)</label>
                            <input
                              type="number"
                              value={personalForm.employmentDuration}
                              onChange={(e) => setPersonalForm({ ...personalForm, employmentDuration: Number(e.target.value) })}
                              className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-800 font-semibold"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-500 text-xs font-bold mb-2 uppercase">Address Proof Document Type</label>
                            <select
                              value={personalForm.addressProofType}
                              onChange={(e) => setPersonalForm({ ...personalForm, addressProofType: e.target.value })}
                              className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-800 font-semibold cursor-pointer"
                            >
                              <option value="VOTER_ID">Voter Identity Card</option>
                              <option value="RENT_AGREEMENT">Registered Rent Agreement</option>
                              <option value="UTILITY_BILL">Electricity/Utility Bill</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-slate-500 text-xs font-bold mb-2 uppercase">Upload Address Proof (Image)</label>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleOptimizeFileUpload('BANK_PROOF', file);
                              }}
                              className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border file:border-slate-300 file:bg-white file:text-indigo-600 hover:file:bg-slate-50 cursor-pointer"
                            />
                            {addressProofFile && (
                              <p className="text-[11px] text-emerald-600 font-bold mt-1">✓ Attached: {addressProofFile.name}</p>
                            )}
                          </div>

                          <div className="md:col-span-2 border-t border-slate-200 pt-4 mt-2">
                            <span className="block text-slate-500 text-xs font-extrabold uppercase tracking-wider mb-3">References</span>
                          </div>

                          <div>
                            <label className="block text-slate-500 text-xs font-bold mb-2 uppercase">Reference 1 Name</label>
                            <input
                              type="text"
                              value={personalForm.reference1Name}
                              onChange={(e) => setPersonalForm({ ...personalForm, reference1Name: e.target.value })}
                              className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-800 font-semibold focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-500 text-xs font-bold mb-2 uppercase">Reference 1 Mobile No.</label>
                            <input
                              type="text"
                              value={personalForm.reference1Mobile}
                              onChange={(e) => setPersonalForm({ ...personalForm, reference1Mobile: e.target.value })}
                              className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-800 font-semibold focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-500 text-xs font-bold mb-2 uppercase">Reference 2 Name</label>
                            <input
                              type="text"
                              value={personalForm.reference2Name}
                              onChange={(e) => setPersonalForm({ ...personalForm, reference2Name: e.target.value })}
                              className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-800 font-semibold focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-500 text-xs font-bold mb-2 uppercase">Reference 2 Mobile No.</label>
                            <input
                              type="text"
                              value={personalForm.reference2Mobile}
                              onChange={(e) => setPersonalForm({ ...personalForm, reference2Mobile: e.target.value })}
                              className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-800 font-semibold focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="flex justify-between pt-6 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => setWizardStep(3)}
                            className="px-5 py-3 bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-700 font-bold rounded-xl flex items-center gap-2 text-xs"
                          >
                            <ArrowLeft className="w-4 h-4" /> Back
                          </button>
                          <button
                            type="button"
                            onClick={handleSubmitProfileAndPersonal}
                            disabled={!addressProofFile || !personalForm.reference1Name || !personalForm.reference2Name}
                            className="px-6 py-3 bg-[#23356E] hover:bg-[#1E2E61] disabled:bg-slate-150 disabled:text-slate-400 text-white font-bold rounded-xl flex items-center gap-2 text-xs shadow-sm"
                          >
                            Submit for Verification <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* STEP 5: Loan Eligibility Results */}
              {wizardStep === 5 && (
                <div className="space-y-6">
                  <h3 className="text-md font-bold text-slate-800 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-indigo-600" />
                    5. Automated Underwriting Decision
                  </h3>

                  {eligibilityResult ? (
                    <div className="space-y-6">
                      <div className={`p-6 rounded-2xl border text-center space-y-2 ${
                        eligibilityResult.eligible 
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                          : 'bg-rose-50 border-rose-200 text-rose-700'
                      }`}>
                        <span className="text-3xl font-extrabold uppercase block tracking-wider">
                          {eligibilityResult.eligible ? 'LOAN ELIGIBLE' : 'LOAN REJECTED'}
                        </span>
                        <p className="text-xs text-slate-500 font-semibold">
                          {eligibilityResult.eligible 
                            ? 'The applicant satisfies all Dynamic Risk engine criteria.' 
                            : `The applicant was rejected due to risk flags: ${eligibilityResult.riskFlags.join(', ')}`}
                        </p>
                      </div>

                      <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Risk Parameters Assessment</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
                          {Object.entries(eligibilityResult.results).map(([key, value]: [string, any]) => (
                            <div key={key} className="flex justify-between items-center p-3 bg-white border border-slate-100 rounded-xl">
                              <span className="text-slate-500 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-slate-800 font-black">{value.value !== undefined ? String(value.value) : 'N/A'}</span>
                                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                                  value.passed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                }`}>
                                  {value.passed ? 'PASS' : 'FAIL'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-500 text-xs font-semibold">No eligibility evaluation details available.</p>
                  )}

                  <div className="flex justify-between pt-6 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setWizardStep(4)}
                      className="px-5 py-3 bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-700 font-bold rounded-xl flex items-center gap-2 text-xs"
                    >
                      <ArrowLeft className="w-4 h-4" /> Back
                    </button>
                    <button
                      type="button"
                      onClick={() => saveStepProgress(6)}
                      disabled={eligibilityResult && !eligibilityResult.eligible}
                      className="px-6 py-3 bg-[#23356E] hover:bg-[#1E2E61] disabled:bg-slate-150 disabled:text-slate-400 text-white font-bold rounded-xl flex items-center gap-2 text-xs shadow-sm"
                    >
                      Configure Product <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 6: Product Details */}
              {wizardStep === 6 && (
                <div className="space-y-6">
                  <h3 className="text-md font-bold text-slate-800 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-indigo-600" />
                    6. Loan Product details
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-500 text-xs font-bold mb-2 uppercase">Select Loan Product</label>
                      <select
                        value={productForm.productId}
                        onChange={(e) => setProductForm({ ...productForm, productId: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-800 font-semibold cursor-pointer"
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-500 text-xs font-bold mb-2 uppercase">Product Name</label>
                      <input
                        type="text"
                        placeholder="MacBook Pro"
                        value={productForm.productName}
                        onChange={(e) => setProductForm({ ...productForm, productName: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-800 font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 text-xs font-bold mb-2 uppercase">Product Brand Name</label>
                      <input
                        type="text"
                        placeholder="Apple"
                        value={productForm.productBrandName}
                        onChange={(e) => setProductForm({ ...productForm, productBrandName: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-800 font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 text-xs font-bold mb-2 uppercase">Product Model No.</label>
                      <input
                        type="text"
                        placeholder="M3 Max"
                        value={productForm.productModelNo}
                        onChange={(e) => setProductForm({ ...productForm, productModelNo: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-800 font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 text-xs font-bold mb-2 uppercase">Product Cost Value (INR)</label>
                      <input
                        type="number"
                        value={productForm.productValue}
                        onChange={(e) => setProductForm({ ...productForm, productValue: Number(e.target.value) })}
                        className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-800 font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 text-xs font-bold mb-2 uppercase">Product Insurance Plan</label>
                      <select
                        value={selectedInsurancePlanName}
                        onChange={(e) => {
                          const planName = e.target.value;
                          setSelectedInsurancePlanName(planName);
                          // Calculate the amount and set it to productInsurance
                          const activeProd = products.find((p) => p.id === productForm.productId);
                          if (activeProd && activeProd.insurancePlans) {
                            const plans = Array.isArray(activeProd.insurancePlans) ? activeProd.insurancePlans : [];
                            const plan = plans.find((p: any) => p.name === planName);
                            if (plan) {
                              let amt = 0;
                              if (plan.type === 'FIXED') {
                                amt = Number(plan.value);
                              } else if (plan.type === 'PERCENTAGE') {
                                amt = Math.round(Number(productForm.productValue) * (Number(plan.value) / 100));
                              }
                              setProductForm({ ...productForm, productInsurance: amt });
                            } else {
                              setProductForm({ ...productForm, productInsurance: 0 });
                            }
                          } else {
                            setProductForm({ ...productForm, productInsurance: 0 });
                          }
                        }}
                        className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-800 font-semibold cursor-pointer"
                      >
                        <option value="">-- No Insurance --</option>
                        {(() => {
                          const activeProd = products.find((p) => p.id === productForm.productId);
                          const plans = activeProd && Array.isArray(activeProd.insurancePlans) ? activeProd.insurancePlans : [];
                          return plans.map((plan: any) => (
                            <option key={plan.name} value={plan.name}>
                              {plan.name} ({plan.type === 'FIXED' ? `₹${plan.value}` : `${plan.value}%`})
                            </option>
                          ));
                        })()}
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-500 text-xs font-bold mb-2 uppercase">Product Insurance Cost (INR)</label>
                      <input
                        type="number"
                        value={productForm.productInsurance}
                        disabled
                        className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-400 font-semibold cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between pt-6 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setWizardStep(5)}
                      className="px-5 py-3 bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-700 font-bold rounded-xl flex items-center gap-2 text-xs"
                    >
                      <ArrowLeft className="w-4 h-4" /> Back
                    </button>
                    <button
                      type="button"
                      onClick={() => saveStepProgress(7, {
                        productId: productForm.productId,
                        productName: productForm.productName,
                        productBrandName: productForm.productBrandName,
                        productModelNo: productForm.productModelNo,
                        productValue: productForm.productValue,
                        productInsurance: productForm.productInsurance
                      })}
                      disabled={!productForm.productName || !productForm.productValue}
                      className="px-6 py-3 bg-[#23356E] hover:bg-[#1E2E61] text-white font-bold rounded-xl flex items-center gap-2 text-xs shadow-sm"
                    >
                      Proceed to EMI <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 7: Choose EMI scheme */}
              {wizardStep === 7 && (
                <div className="space-y-6">
                  <h3 className="text-md font-bold text-slate-800 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-indigo-600" />
                    7. Configure Repayment EMI tenure
                  </h3>

                  <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-4">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Choose Repayment Tenure</h4>
                    <div className="flex gap-4">
                      {(() => {
                        const activeProd = products.find((p) => p.id === productForm.productId);
                        const tenures = (() => {
                          if (!activeProd) return [6, 12, 18, 24];
                          const min = activeProd.minTenure;
                          const max = activeProd.maxTenure;
                          const options = [];
                          for (let i = min; i <= max; i++) {
                            if (i % 3 === 0 || i === min || i === max) {
                              options.push(i);
                            }
                          }
                          return Array.from(new Set(options)).sort((a, b) => a - b);
                        })();
                        return tenures.map((tenure) => (
                          <button
                            key={tenure}
                            type="button"
                            onClick={() => setSelectedTenure(tenure)}
                            className={`flex-1 py-4 rounded-xl border font-bold text-sm transition-all ${
                              selectedTenure === tenure
                                ? 'bg-indigo-650/10 border-indigo-605 text-indigo-700 shadow-sm'
                                : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                            }`}
                          >
                            {tenure} Months
                          </button>
                        ));
                      })()}
                    </div>

                    {emiCalculation && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-slate-200 pt-4 text-xs font-semibold">
                        <div className="bg-white p-4 border border-slate-100 rounded-xl">
                          <span className="block text-slate-400">Loan Amount</span>
                          <span className="text-slate-800 font-black">₹{emiCalculation.loanAmount.toLocaleString()}</span>
                        </div>
                        <div className="bg-white p-4 border border-slate-100 rounded-xl">
                          <span className="block text-slate-400">Down Payment</span>
                          <span className="text-slate-800 font-black">₹{emiCalculation.downPayment.toLocaleString()}</span>
                        </div>
                        <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 col-span-2">
                          <span className="block text-emerald-600">EMI Amount ({emiCalculation.frequency})</span>
                          <span className="text-emerald-700 font-black text-sm">₹{emiCalculation.emiAmount.toLocaleString()} ({emiCalculation.installmentsCount} installments)</span>
                        </div>
                        <div className="bg-white p-4 border border-slate-100 rounded-xl">
                          <span className="block text-slate-400">Processing Fee</span>
                          <span className="text-slate-800 font-black">₹{emiCalculation.processingFee.toLocaleString()}</span>
                        </div>
                        <div className="bg-white p-4 border border-slate-100 rounded-xl">
                          <span className="block text-slate-400">Payable At Store (Customer Upfront)</span>
                          <span className="text-slate-800 font-black">₹{emiCalculation.customerPayableAtStore.toLocaleString()}</span>
                        </div>
                        <div className="bg-white p-4 border border-slate-100 rounded-xl">
                          <span className="block text-slate-400">Insurance Amount</span>
                          <span className="text-slate-800 font-black">₹{emiCalculation.insuranceAmount.toLocaleString()}</span>
                        </div>
                        <div className="bg-white p-4 border border-slate-100 rounded-xl">
                          <span className="block text-slate-400">DBD (Subvention)</span>
                          <span className="text-slate-800 font-black">₹{emiCalculation.dbd.toLocaleString()}</span>
                        </div>
                        <div className="bg-indigo-50 p-4 border border-indigo-100 rounded-xl col-span-2">
                          <span className="block text-indigo-600">Net Store Disbursement</span>
                          <span className="text-indigo-750 font-black">₹{emiCalculation.payableToStore.toLocaleString()}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between pt-6 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setWizardStep(6)}
                      className="px-5 py-3 bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-700 font-bold rounded-xl flex items-center gap-2 text-xs"
                    >
                      <ArrowLeft className="w-4 h-4" /> Back
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleSendEmiOtp();
                        saveStepProgress(8, {
                          requestedTenure: selectedTenure,
                          downPayment: emiCalculation.downPayment,
                          processingFee: emiCalculation.processingFee,
                          emiAmount: emiCalculation.emiAmount,
                          payableToStore: emiCalculation.payableToStore,
                        });
                      }}
                      className="px-6 py-3 bg-[#23356E] hover:bg-[#1E2E61] text-white font-bold rounded-xl flex items-center gap-2 text-xs shadow-sm"
                    >
                      Confirm EMI Scheme <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 8 & 9: EMI OTP & Bank Details */}
              {wizardStep === 8 && (
                <div className="space-y-6">
                  <h3 className="text-md font-bold text-slate-800 flex items-center gap-2">
                    <Landmark className="w-5 h-5 text-indigo-600" />
                    8 & 9. EMI Authorization OTP & Customer Bank Account Details
                  </h3>

                  <form onSubmit={handleFinalizeOnboarding} className="space-y-6">
                    <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-3">
                      <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider">
                        EMI Authorization OTP (Sent via Email/SMS)
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        required
                        placeholder="000000"
                        value={emiOtp}
                        onChange={(e) => setEmiOtp(e.target.value)}
                        className="w-full max-w-xs px-4 py-2 bg-white border border-slate-350 rounded-xl text-slate-800 font-mono tracking-widest text-center text-lg font-black focus:outline-none focus:border-indigo-600"
                      />
                      {mockEmiOtpCode && (
                        <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider font-mono">Sandbox code: {mockEmiOtpCode}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-slate-500 text-xs font-bold mb-2 uppercase">Account Number</label>
                        <input
                          type="text"
                          required
                          value={bankForm.accountNumber}
                          onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })}
                          className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-800 font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-500 text-xs font-bold mb-2 uppercase">IFSC Code</label>
                        <input
                          type="text"
                          required
                          placeholder="ICIC0000001"
                          value={bankForm.ifsc}
                          onChange={(e) => setBankForm({ ...bankForm, ifsc: e.target.value.toUpperCase() })}
                          className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-800 font-mono uppercase font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-500 text-xs font-bold mb-2 uppercase">Account Type</label>
                        <select
                          value={bankForm.accountType}
                          onChange={(e) => setBankForm({ ...bankForm, accountType: e.target.value })}
                          className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-800 font-semibold cursor-pointer"
                        >
                          <option value="SAVINGS">Savings Account</option>
                          <option value="CURRENT">Current Account</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-slate-500 text-xs font-bold mb-2 uppercase">Bank Verified Name</label>
                        <input
                          type="text"
                          required
                          placeholder="Verified Name from Surepass"
                          value={bankForm.bankVerifiedName}
                          onChange={(e) => setBankForm({ ...bankForm, bankVerifiedName: e.target.value })}
                          className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-800 font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-500 text-xs font-bold mb-2 uppercase">Bank Name</label>
                        <input
                          type="text"
                          required
                          placeholder="HDFC Bank"
                          value={bankForm.bankName}
                          onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                          className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-800 font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-500 text-xs font-bold mb-2 uppercase">Bank Branch Address</label>
                        <input
                          type="text"
                          required
                          placeholder="Mumbai Central Branch"
                          value={bankForm.bankAddress}
                          onChange={(e) => setBankForm({ ...bankForm, bankAddress: e.target.value })}
                          className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-800 font-semibold"
                        />
                      </div>
                    </div>

                    <div className="flex justify-between pt-6 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setWizardStep(7)}
                        className="px-5 py-3 bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-700 font-bold rounded-xl flex items-center gap-2 text-xs"
                      >
                        <ArrowLeft className="w-4 h-4" /> Back
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-3 bg-[#23356E] hover:bg-[#1E2E61] text-white font-bold rounded-xl flex items-center gap-2 text-xs shadow-sm active:scale-95 transition-all"
                      >
                        Verify Bank & Submit Loan
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* STEP 10: Onboarding Completed Popup */}
              {wizardStep === 10 && (
                <div className="text-center space-y-6 py-8 animate-fadeIn">
                  <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto text-3xl font-black">
                    ✓
                  </div>
                  <h3 className="text-2xl font-black text-slate-900">Customer Onboard completed!</h3>
                  <p className="text-slate-500 text-xs max-w-md mx-auto font-medium leading-relaxed">
                    We have saved the details and generated the loan application. A notification containing the digital E-Sign Agreement link has been dispatched to the customer's verified email and mobile.
                  </p>
                  <div className="bg-slate-50 p-4 border border-slate-200 rounded-2xl text-xs font-bold max-w-sm mx-auto">
                    <span className="block text-slate-400 mb-1">Contract E-Sign Link (Simulator)</span>
                    <a
                      href={`/loan-agreement/${applicationId}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-650 hover:underline break-all"
                    >
                      /loan-agreement/{applicationId}
                    </a>
                  </div>

                  <button
                    onClick={() => { resetOnboarding(); }}
                    className="px-6 py-3.5 bg-[#23356E] hover:bg-[#1E2E61] text-white font-bold rounded-xl active:scale-95 transition-all text-xs shadow-md"
                  >
                    Start New Onboarding
                  </button>
                </div>
              )}

            </div>
          </div>
        )}

        {/* TAB 6: LOANS */}
        {currentTab === 'loans' && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h1 className="text-2xl font-black text-slate-900">Active Repayments</h1>
              <p className="text-slate-500 text-xs">Tracking store running loans and EMI cycles.</p>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
              {applications.filter(a => a.loan).length === 0 ? (
                <p className="text-slate-400 text-center py-8 text-xs font-semibold">No active loans found in registry.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-550 bg-slate-50 font-bold uppercase">
                        <th className="py-3 px-4">Customer</th>
                        <th className="py-3 px-4">Loan ID</th>
                        <th className="py-3 px-4">Disbursed</th>
                        <th className="py-3 px-4">Outstanding</th>
                        <th className="py-3 px-4">Tenure</th>
                        <th className="py-3 px-4">Loan Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                      {applications.filter(a => a.loan).map((app) => (
                        <tr key={app.id} className="hover:bg-slate-50/50">
                          <td className="py-4 px-4 font-bold text-slate-900">{app.customer.profile?.fullName}</td>
                          <td className="py-4 px-4 font-mono">{app.loan.id.substring(0,8)}...</td>
                          <td className="py-4 px-4 font-bold text-slate-900">₹{Number(app.loan.disbursedAmount).toLocaleString()}</td>
                          <td className="py-4 px-4 font-bold text-rose-600">₹{Number(app.loan.outstandingAmount).toLocaleString()}</td>
                          <td className="py-4 px-4">{app.loan.tenure} Months</td>
                          <td className="py-4 px-4">
                            <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-150 uppercase">
                              {app.loan.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 7: DISBURSAL TRACKER */}
        {currentTab === 'disbursal-tracker' && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h1 className="text-2xl font-black text-slate-900">Disbursal Tracker</h1>
              <p className="text-slate-500 text-xs">Verify customer invoice records and trigger disbursement orders.</p>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
              {applications.filter(app => app.status === 'MANDATE_ACTIVE' || app.status === 'APPROVED' || app.status === 'DOCUMENT_PENDING').length === 0 ? (
                <p className="text-slate-400 text-center py-8 text-xs font-semibold">No pending disbursal applications found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-550 bg-slate-50 font-bold uppercase">
                        <th className="py-3 px-4">Customer</th>
                        <th className="py-3 px-4">App ID</th>
                        <th className="py-3 px-4">Product</th>
                        <th className="py-3 px-4">Value</th>
                        <th className="py-3 px-4">ESign Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                      {applications.filter(app => app.status === 'MANDATE_ACTIVE' || app.status === 'APPROVED' || app.status === 'DOCUMENT_PENDING').map((app) => (
                        <tr key={app.id} className="hover:bg-slate-50/50">
                          <td className="py-4 px-4 font-bold text-slate-900">{app.customer.profile?.fullName}</td>
                          <td className="py-4 px-4 font-mono text-[10px] text-slate-500">{app.id.substring(0,8)}...</td>
                          <td className="py-4 px-4">{app.productName}</td>
                          <td className="py-4 px-4 font-bold text-slate-900">₹{Number(app.productValue || app.requestedAmount).toLocaleString()}</td>
                          <td className="py-4 px-4 space-y-0.5">
                            <span className={`block text-[10px] uppercase font-bold ${app.loanAgreementSigned ? 'text-emerald-600' : 'text-slate-400'}`}>
                              Agreement: {app.loanAgreementSigned ? 'SIGNED' : 'PENDING'}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right space-x-2 whitespace-nowrap">
                            <button
                              onClick={() => {
                                setSelectedPipelineApp(app);
                                setPipelineAction('DO_DOWNLOAD');
                              }}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all"
                            >
                              DO Details
                            </button>

                            {app.loanAgreementSigned && (
                              <button
                                onClick={() => {
                                  setSelectedPipelineApp(app);
                                  setPipelineAction('UPLOAD_INVOICE');
                                  setInvoiceForm({
                                    invoiceNo: app.invoiceNo || '',
                                    invoiceCost: Number(app.productValue || app.requestedAmount) + Number(app.productInsurance || 1500),
                                    imeiNumber: app.imeiNumber || '',
                                    productSerialNo: app.productSerialNo || '',
                                  });
                                }}
                                className="px-3 py-1.5 bg-[#23356E] hover:bg-[#1E2E61] text-white text-xs font-black rounded-xl shadow-sm transition-all"
                              >
                                Invoice Action
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {currentTab === 'loans-consumer' && (() => {
          // Filter by Tab
          const tabFiltered = applications.filter((app) => {
            const status = app.status;
            if (loansSubTab === 'PENDING') {
              return status !== 'APPROVED' && status !== 'DISBURSED' && status !== 'ACTIVE' && status !== 'CLOSED' && status !== 'REJECTED';
            } else if (loansSubTab === 'IN_PROCESS') {
              return status === 'APPROVED' || status === 'DISBURSED' || status === 'ACTIVE';
            } else { // REJECTED
              return status === 'REJECTED';
            }
          });

          // Filter by Search Text
          const searchFiltered = tabFiltered.filter((app) => {
            if (!loansSearchText) return true;
            const query = loansSearchText.toLowerCase();
            const profile = app.customer.profile;
            return (
              profile?.fullName?.toLowerCase().includes(query) ||
              profile?.panNumber?.toLowerCase().includes(query) ||
              app.customer.phoneNumber.includes(query) ||
              app.id.toLowerCase().includes(query)
            );
          });

          return (
            <div className="space-y-6 animate-fadeIn text-xs font-semibold text-slate-700">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-xl font-black text-slate-900">Consumer Loans</h1>
                </div>
              </div>

              {/* Tab navigation matching Pending, In-Process, Rejected capitalization exactly */}
              <div className="flex gap-4 border-b border-slate-200 pb-3">
                {(['PENDING', 'IN_PROCESS', 'REJECTED'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => {
                      setLoansSubTab(tab);
                      setLoansSearchText('');
                    }}
                    className={`pb-2 px-1 font-bold text-sm tracking-wide transition-all border-b-2 uppercase ${
                      loansSubTab === tab
                        ? 'border-indigo-650 text-indigo-700'
                        : 'border-transparent text-slate-400 hover:text-slate-650'
                    }`}
                  >
                    {tab === 'PENDING' ? 'Pending' : tab === 'IN_PROCESS' ? 'In-Process' : 'Rejected'}
                  </button>
                ))}
              </div>

              {/* Filters Panel matching screenshots exactly */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] text-slate-500 font-extrabold uppercase tracking-wide">Choose Data Range</label>
                  <select className="px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-800 font-bold focus:outline-none cursor-pointer w-60 text-xs shadow-sm">
                    <option>Last 7 Days</option>
                    <option>Last 30 Days</option>
                    <option>Last 90 Days</option>
                  </select>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center text-xs text-slate-500 border-t border-slate-100 pt-4">
                  <div className="flex items-center gap-2">
                    <span>Show</span>
                    <select 
                      value={entriesLimit}
                      onChange={(e) => setEntriesLimit(Number(e.target.value))}
                      className="px-2 py-1 bg-white border border-slate-300 rounded-lg font-bold text-slate-700 text-xs shadow-sm"
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                    <span>entries</span>
                    <button className="ml-3 px-3.5 py-1.5 bg-white border border-slate-350 hover:bg-slate-50 rounded-xl text-slate-700 font-extrabold flex items-center gap-1 shadow-sm text-xs">
                      Export ▾
                    </button>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <span>Search:</span>
                    <input
                      type="text"
                      placeholder="Search..."
                      value={loansSearchText}
                      onChange={(e) => setLoansSearchText(e.target.value)}
                      className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-800 font-semibold focus:outline-none w-full sm:w-48 text-xs"
                    />
                  </div>
                </div>

                {/* Table list */}
                {searchFiltered.length === 0 ? (
                  <p className="text-slate-400 text-center py-10 font-bold">No consumer loans matching criteria.</p>
                ) : (
                  <div className="overflow-x-auto border border-slate-150 rounded-2xl">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-550 bg-slate-50 font-bold uppercase">
                          <th className="py-2.5 px-4">PAN ⇅</th>
                          <th className="py-2.5 px-4">Merchant ⇅</th>
                          <th className="py-2.5 px-4">Name ⇅</th>
                          <th className="py-2.5 px-4">Mobile ⇅</th>
                          <th className="py-2.5 px-4">Application Date ⇅</th>
                          <th className="py-2.5 px-4">Last Action Date and Time ⇅</th>
                          <th className="py-2.5 px-4">Region ⇅</th>
                          <th className="py-2.5 px-4">Status ⇅</th>
                          <th className="py-2.5 px-4">Comment ⇅</th>
                          <th className="py-2.5 px-4 text-center">Action ⇅</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-semibold text-slate-700 bg-white">
                        {searchFiltered.map((app) => {
                          const latestNote = app.notes?.[0]?.content || '';
                          const isDraft = app.status === 'DRAFT';
                          
                          return (
                            <tr key={app.id} className="hover:bg-slate-50/50">
                              <td className="py-3 px-4 font-mono font-bold text-indigo-650 hover:underline cursor-pointer uppercase">
                                {app.customer.profile?.panNumber || 'N/A'}
                              </td>
                              <td className="py-3 px-4 text-slate-550 text-[11px] max-w-[150px] truncate">
                                {app.merchant?.email || 'Bagoda Mobile And Accessories'}
                              </td>
                              <td className="py-3 px-4 font-bold text-slate-900">
                                {app.customer.profile?.fullName || 'N/A'}
                              </td>
                              <td className="py-3 px-4 font-bold text-slate-800">
                                {app.customer.phoneNumber}
                              </td>
                              <td className="py-3 px-4 text-slate-550 font-bold">
                                {formatDate(app.createdAt)}
                              </td>
                              <td className="py-3 px-4 text-slate-400 text-[10px]">
                                {formatDateTime(app.updatedAt)}
                              </td>
                              <td className="py-3 px-4 text-slate-550 font-bold">
                                {app.customer.profile?.city || 'Jetfinx_jalore'}
                              </td>
                              <td className="py-3 px-4">
                                <span className={`px-2.5 py-0.5 rounded text-[10px] font-black border uppercase ${
                                  app.status === 'REJECTED'
                                    ? 'bg-rose-50 border-rose-150 text-rose-600'
                                    : app.status === 'DOCUMENT_PENDING' || app.status === 'UNDER_REVIEW'
                                    ? 'bg-blue-50 border-blue-150 text-blue-600'
                                    : app.status === 'APPROVED' || app.status === 'DISBURSED' || app.status === 'ACTIVE'
                                    ? 'bg-emerald-50 border-emerald-150 text-emerald-600'
                                    : 'bg-amber-50 border-amber-150 text-amber-600'
                                }`}>
                                  {app.status === 'DOCUMENT_PENDING' ? 'Collateral Data Added' : app.status}
                                </span>
                              </td>
                              <td className="py-2 px-4 max-w-[200px]">
                                <div className="flex gap-2 items-center">
                                  <textarea
                                    value={tempComments[app.id] !== undefined ? tempComments[app.id] : latestNote}
                                    onChange={(e) => setTempComments({ ...tempComments, [app.id]: e.target.value })}
                                    className="w-full px-2 py-1.5 border border-slate-205 rounded-lg text-[10px] font-bold focus:outline-none focus:border-indigo-500 h-10 resize-none bg-white"
                                    placeholder="Click to add note..."
                                  />
                                  <button
                                    onClick={() => handleSaveComment(app.id)}
                                    disabled={savingComment[app.id] || tempComments[app.id] === undefined}
                                    className="px-2 py-1 bg-[#23356E] hover:bg-[#1E2E61] disabled:bg-slate-200 text-white text-[9px] font-black rounded-lg transition-all"
                                  >
                                    {savingComment[app.id] ? '...' : 'Save'}
                                  </button>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <button
                                  onClick={() => {
                                    if (isDraft) {
                                      handleResumeDraft(app);
                                    } else {
                                      setSelectedPipelineApp(app);
                                      setPipelineAction('DO_DOWNLOAD');
                                    }
                                  }}
                                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl shadow-sm transition-all"
                                >
                                  {isDraft ? 'Resume' : 'Action'}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Footer Entries Count & Pagination */}
                <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold border-t border-slate-100 pt-3">
                  <span>Showing 1 to {searchFiltered.length} of {searchFiltered.length} entries</span>
                  <div className="flex gap-1.5">
                    <button className="px-2.5 py-1.5 bg-[#23356E] text-white rounded-lg">1</button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* TAB 9: DISBURSAL CONSUMER */}
        {currentTab === 'disbursal-consumer' && (() => {
          // Badges counts
          const countDocPending = applications.filter(app => app.status === 'DOCUMENT_PENDING').length;
          const countUnderReview = applications.filter(app => app.status === 'UNDER_REVIEW').length;
          const countDisbursal = applications.filter(app => app.status === 'APPROVED' || app.status === 'MANDATE_ACTIVE' || app.status === 'DISBURSED' || app.status === 'ACTIVE').length;

          // Filter by Tab
          const tabFiltered = applications.filter((app) => {
            const status = app.status;
            if (disbursalSubTab === 'DOCUMENT_UPLOAD') {
              return status === 'DOCUMENT_PENDING';
            } else if (disbursalSubTab === 'VERIFICATION') {
              return status === 'UNDER_REVIEW';
            } else { // DISBURSAL
              return status === 'APPROVED' || status === 'MANDATE_ACTIVE' || status === 'DISBURSED' || status === 'ACTIVE';
            }
          });

          // Filter by Search Text
          const searchFiltered = tabFiltered.filter((app) => {
            if (!disbursalSearchText) return true;
            const query = disbursalSearchText.toLowerCase();
            const profile = app.customer.profile;
            return (
              profile?.fullName?.toLowerCase().includes(query) ||
              app.customer.phoneNumber.includes(query) ||
              app.id.toLowerCase().includes(query)
            );
          });

          return (
            <div className="space-y-6 animate-fadeIn text-xs font-semibold text-slate-700">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-xl font-black text-slate-900">Disbursal Tracker</h1>
                </div>
              </div>

              {/* Stepper badge tabs matching screenshot exactly */}
              <div className="flex gap-4 border-b border-slate-200 pb-0.5 justify-start">
                <button
                  onClick={() => setDisbursalSubTab('DOCUMENT_UPLOAD')}
                  className={`pb-3 px-2 flex items-center gap-2 text-xs font-extrabold transition-all border-b-2 uppercase ${
                    disbursalSubTab === 'DOCUMENT_UPLOAD'
                      ? 'border-sky-500 text-sky-600'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                    disbursalSubTab === 'DOCUMENT_UPLOAD' ? 'bg-sky-100 text-sky-700' : 'bg-slate-100 text-slate-500'
                  }`}>
                    📄
                  </span>
                  DOCUMENT UPLOAD
                  <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black ${
                    disbursalSubTab === 'DOCUMENT_UPLOAD' ? 'bg-sky-500 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {countDocPending}
                  </span>
                </button>

                <button
                  onClick={() => setDisbursalSubTab('VERIFICATION')}
                  className={`pb-3 px-2 flex items-center gap-2 text-xs font-extrabold transition-all border-b-2 uppercase ${
                    disbursalSubTab === 'VERIFICATION'
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                    disbursalSubTab === 'VERIFICATION' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-500'
                  }`}>
                    ⚙
                  </span>
                  VERIFICATION
                  <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black ${
                    disbursalSubTab === 'VERIFICATION' ? 'bg-purple-500 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {countUnderReview}
                  </span>
                </button>

                <button
                  onClick={() => setDisbursalSubTab('DISBURSAL')}
                  className={`pb-3 px-2 flex items-center gap-2 text-xs font-extrabold transition-all border-b-2 uppercase ${
                    disbursalSubTab === 'DISBURSAL'
                      ? 'border-emerald-500 text-emerald-600'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                    disbursalSubTab === 'DISBURSAL' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                  }`}>
                    💸
                  </span>
                  DISBURSAL
                  <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black ${
                    disbursalSubTab === 'DISBURSAL' ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {countDisbursal}
                  </span>
                </button>
              </div>

              {/* Table card */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-5">
                {/* Date range configuration header */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-slate-400 uppercase font-black tracking-wider">DATE RANGE</label>
                  <div className="flex items-center gap-3">
                    <select className="px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-800 font-bold focus:outline-none cursor-pointer w-48 text-xs shadow-sm">
                      <option>Last 7 Days</option>
                      <option>Last 30 Days</option>
                    </select>
                    <button className="px-4 py-2.5 bg-indigo-650 hover:bg-indigo-750 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5">
                      <Search className="w-3.5 h-3.5" /> Find
                    </button>
                  </div>
                </div>

                {/* Show entries & Search controls */}
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center text-xs text-slate-500 border-t border-slate-100 pt-4">
                  <div className="flex items-center gap-3">
                    <span>Show</span>
                    <select 
                      value={entriesLimit}
                      onChange={(e) => setEntriesLimit(Number(e.target.value))}
                      className="px-2 py-1 bg-white border border-slate-300 rounded-lg font-bold text-slate-700 text-xs shadow-sm"
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                    </select>
                    <span>entries</span>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                    <div className="flex items-center gap-2">
                      <span>Search:</span>
                      <input
                        type="text"
                        placeholder="Search..."
                        value={disbursalSearchText}
                        onChange={(e) => setDisbursalSearchText(e.target.value)}
                        className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-800 font-semibold focus:outline-none w-48 text-xs"
                      />
                    </div>
                    <button className="px-3.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl text-slate-750 font-extrabold flex items-center gap-1.5 shadow-sm text-xs">
                      <Download className="w-3.5 h-3.5" /> Export ▾
                    </button>
                  </div>
                </div>

                {searchFiltered.length === 0 ? (
                  <p className="text-slate-400 text-center py-10 font-bold">No disbursal loan applications matching criteria.</p>
                ) : (
                  <div className="overflow-x-auto border border-slate-150 rounded-2xl">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-550 bg-slate-50 font-bold uppercase">
                          <th className="py-2.5 px-4">LOAN ID</th>
                          <th className="py-2.5 px-4">MERCHANT</th>
                          <th className="py-2.5 px-4">NAME</th>
                          <th className="py-2.5 px-4">APPLICATION DATE</th>
                          <th className="py-2.5 px-4">LAST ACTION DATE & TIME</th>
                          <th className="py-2.5 px-4">REGION</th>
                          <th className="py-2.5 px-4">COMMENT</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-semibold text-slate-700 bg-white">
                        {searchFiltered.map((app) => {
                          const latestNote = app.notes?.[0]?.content || '';
                          
                          return (
                            <tr key={app.id} className="hover:bg-slate-50/50">
                              <td className="py-3 px-4 font-mono font-bold">
                                <button
                                  onClick={() => {
                                    setSelectedPipelineApp(app);
                                    setPipelineAction('DO_DOWNLOAD');
                                  }}
                                  className="text-indigo-650 hover:underline text-left cursor-pointer"
                                >
                                  {app.id}
                                </button>
                              </td>
                              <td className="py-3 px-4 text-slate-550 text-[11px] max-w-[150px] truncate">
                                {app.merchant?.email || 'Bagoda Mobile And Accessories'}
                              </td>
                              <td className="py-3 px-4 font-bold text-slate-900">
                                {app.customer.profile?.fullName || 'N/A'}
                              </td>
                              <td className="py-3 px-4 text-slate-550 font-bold">
                                {formatDate(app.createdAt)}
                              </td>
                              <td className="py-3 px-4 text-slate-400 text-[10px]">
                                {formatDateTime(app.updatedAt)}
                              </td>
                              <td className="py-3 px-4 text-slate-550 font-bold">
                                {app.customer.profile?.city || 'Jetfinx_jalore'}
                              </td>
                              <td className="py-2 px-4 max-w-[200px]">
                                <div className="flex gap-2 items-center">
                                  <textarea
                                    value={tempComments[app.id] !== undefined ? tempComments[app.id] : latestNote}
                                    onChange={(e) => setTempComments({ ...tempComments, [app.id]: e.target.value })}
                                    className="w-full px-2 py-1.5 border border-slate-205 rounded-lg text-[10px] font-bold focus:outline-none focus:border-indigo-500 h-10 resize-none bg-white"
                                    placeholder="Click to add note..."
                                  />
                                  <button
                                    onClick={() => handleSaveComment(app.id)}
                                    disabled={savingComment[app.id] || tempComments[app.id] === undefined}
                                    className="px-2 py-1 bg-[#23356E] hover:bg-[#1E2E61] disabled:bg-slate-200 text-white text-[9px] font-black rounded-lg transition-all"
                                  >
                                    {savingComment[app.id] ? '...' : 'Save'}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold border-t border-slate-100 pt-3">
                  <span>Showing 1 to {searchFiltered.length} of {searchFiltered.length} records</span>
                  <div className="flex gap-1.5">
                    <button className="px-2.5 py-1.5 bg-[#23356E] text-white rounded-lg">1</button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
        
        {/* Footers matching screenshots exactly */}
        <footer className="mt-auto py-6 border-t border-slate-200 bg-white flex flex-col sm:flex-row justify-between items-center px-8 text-xs font-semibold text-slate-500 gap-4">
          <span>2026© Oroboro IT Team, All Right Reserved.</span>
          <span>Design & Develop by Vertex Tech</span>
        </footer>
      </main>
    </div>

      {/* PIPELINE DIALOG MODALS */}
      {selectedPipelineApp && pipelineAction === 'DO_DOWNLOAD' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl relative">
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Download className="w-5 h-5 text-[#23356E]" />
              Delivery Order (DO) Console
            </h3>
            
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-xs space-y-2 font-semibold text-slate-700">
              <div className="flex justify-between pb-1 border-b border-slate-150">
                <span className="text-slate-400">Customer:</span>
                <span className="text-slate-800">{selectedPipelineApp.customer.profile?.fullName}</span>
              </div>
              <div className="flex justify-between pb-1 border-b border-slate-150">
                <span className="text-slate-400">Loan ID:</span>
                <span className="text-indigo-600 font-mono font-bold">{selectedPipelineApp.id}</span>
              </div>
              <div className="flex justify-between pb-1 border-b border-slate-150">
                <span className="text-slate-400">Product:</span>
                <span className="text-slate-800">{selectedPipelineApp.productName || selectedPipelineApp.product.name}</span>
              </div>
              <div className="flex justify-between pb-1 border-b border-slate-150">
                <span className="text-slate-400">Disbursement Store:</span>
                <span className="text-emerald-600 font-black">₹{Number(selectedPipelineApp.payableToStore || selectedPipelineApp.requestedAmount - 5000).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">DO Status:</span>
                <span className="text-slate-800 font-black">{selectedPipelineApp.deliveryOrderStatus || 'IN_PROCESS'}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={async () => {
                  await fetch(`/api/applications/${selectedPipelineApp.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ deliveryOrderStatus: 'COMPLETED' }),
                  });
                  setSuccess('Delivery order downloaded and set to COMPLETED.');
                  setSelectedPipelineApp(null);
                  fetchData();
                }}
                className="flex-1 py-3 bg-[#23356E] hover:bg-[#1E2E61] text-white font-bold rounded-2xl text-xs transition-all shadow-sm"
              >
                Mark DO as Done / Handover
              </button>
              <button
                onClick={() => setSelectedPipelineApp(null)}
                className="px-5 py-3 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold rounded-2xl text-xs transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedPipelineApp && pipelineAction === 'UPLOAD_INVOICE' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto">
          <div className="max-w-lg w-full bg-white border border-slate-200 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl relative my-8">
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-[#23356E]" />
              Upload Invoice & Collateral Scans
            </h3>

            <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs p-4 rounded-xl flex items-start gap-2.5 font-bold">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-extrabold">Device Locker Key Installation Compulsory</p>
                <p className="text-slate-500 font-semibold mt-0.5 font-normal">
                  Disbursement requires verification of invoice matching product cost + insurance values, and collateral IMEI/Serial number image scans. Locker key installation is mandatory.
                </p>
              </div>
            </div>

            <form onSubmit={handleUploadInvoice} className="space-y-4 text-xs font-bold text-slate-700">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 mb-1 uppercase tracking-wide">Invoice Number</label>
                  <input
                    type="text"
                    required
                    value={invoiceForm.invoiceNo}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, invoiceNo: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-800 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1 uppercase tracking-wide">Invoice Cost (inc. GST)</label>
                  <input
                    type="number"
                    required
                    value={invoiceForm.invoiceCost}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, invoiceCost: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-800 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1 uppercase tracking-wide">IMEI Number (if mobile)</label>
                  <input
                    type="text"
                    placeholder="15-digit IMEI"
                    value={invoiceForm.imeiNumber}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, imeiNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-800 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1 uppercase tracking-wide">Product Serial No.</label>
                  <input
                    type="text"
                    required
                    placeholder="Serial code from package"
                    value={invoiceForm.productSerialNo}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, productSerialNo: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-800 font-semibold"
                  />
                </div>
              </div>

              {/* Scan attachments */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-200 pt-4 mt-2">
                <div>
                  <label className="block text-slate-500 mb-1 uppercase">1. Invoice Image Scan</label>
                  <input
                    type="file"
                    required
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleOptimizeFileUpload('INVOICE', file);
                    }}
                    className="w-full text-[10px] file:mr-2 file:bg-slate-100 file:border file:border-slate-300 file:py-1 file:px-2 file:rounded file:text-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1 uppercase">2. Collateral Image Scan</label>
                  <input
                    type="file"
                    required
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleOptimizeFileUpload('PAN', file);
                    }}
                    className="w-full text-[10px] file:mr-2 file:bg-slate-100 file:border file:border-slate-300 file:py-1 file:px-2 file:rounded file:text-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1 uppercase">3. Insurance Policy Scan</label>
                  <input
                    type="file"
                    required
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleOptimizeFileUpload('NOC', file);
                    }}
                    className="w-full text-[10px] file:mr-2 file:bg-slate-100 file:border file:border-slate-300 file:py-1 file:px-2 file:rounded file:text-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1 uppercase">4. Selfie with Product</label>
                  <input
                    type="file"
                    required
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleOptimizeFileUpload('SELFIE', file);
                    }}
                    className="w-full text-[10px] file:mr-2 file:bg-slate-100 file:border file:border-slate-300 file:py-1 file:px-2 file:rounded file:text-slate-700"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-[#23356E] hover:bg-[#1E2E61] text-white font-bold rounded-2xl text-xs active:scale-95 transition-all shadow-sm"
                >
                  Submit Scans - Set Out for Verification
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPipelineApp(null)}
                  className="px-5 py-3 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold rounded-2xl text-xs transition-all"
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
