'use client';

import React, { useState, useEffect } from 'react';
import { AuthUser } from '@/app/providers';
import { 
  FolderOpen, ShieldAlert, CheckCircle, FileText, XCircle, 
  Trash2, Plus, Edit2, User, Phone, Mail, Landmark, 
  Layers, DollarSign, Calendar, MessageSquare, AlertCircle, 
  Settings, Database, Award, Image, ChevronRight, LayoutDashboard,
  ShieldCheck, FileSpreadsheet, Lock, RefreshCw, ChevronDown, Users,
  Search, UploadCloud, FileUp, Check, Play, LogOut, CheckCircle2
} from 'lucide-react';

export default function AdminDashboard({ user }: { user: AuthUser }) {
  // Navigation Tabs state
  const [activeTab, setActiveTab] = useState<
    'ANALYTICS' | 'USER_AGENT' | 'USER_SYSTEM' | 'CLIENT_RECORDS' | 'CLIENT_UPLOAD' | 
    'APPLICATIONS' | 'PRODUCTS' | 'RULES' | 'AUDIT_LOGS' | 'REPORTS' | 
    'LOANS' | 'DISBURSAL_TRACKER' | 'LOANS_DISBURSEMENT'
  >('ANALYTICS');

  // Sidebar Submenus
  const [userMenuOpen, setUserMenuOpen] = useState(true);
  const [clientMenuOpen, setClientMenuOpen] = useState(true);
  const [reportMenuOpen, setReportMenuOpen] = useState(true);
  const [loansDisbursementMenuOpen, setLoansDisbursementMenuOpen] = useState(true);
  const [loansMenuOpen, setLoansMenuOpen] = useState(true);
  const [disbursalMenuOpen, setDisbursalMenuOpen] = useState(true);
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);

  // Sub-tabs for specific views
  const [loansDisbursementSubTab, setLoansDisbursementSubTab] = useState<'DISBURSAL'>('DISBURSAL');
  const [loansSubTab, setLoansSubTab] = useState<'PENDING' | 'IN_PROCESS' | 'REJECTED'>('PENDING');
  const [disbursalSubTab, setDisbursalSubTab] = useState<'DOCUMENT_UPLOAD' | 'VERIFICATION' | 'DISBURSAL'>('DOCUMENT_UPLOAD');

  // Invoice Upload modal state for Admin
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceModalApp, setInvoiceModalApp] = useState<any | null>(null);
  const [invoiceForm, setInvoiceForm] = useState({
    invoiceNo: '',
    invoiceCost: 0,
    imeiNumber: '',
    productSerialNo: '',
  });
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [uploadingInvoice, setUploadingInvoice] = useState(false);

  // Products state
  const [products, setProducts] = useState<any[]>([]);
  const [productForm, setProductForm] = useState<any>({
    id: '',
    name: '',
    description: '',
    minAmount: 10000,
    maxAmount: 100000,
    interestRate: 12.00,
    interestType: 'REDUCING',
    minTenure: 3,
    maxTenure: 24,
    processingFee: 1000,
    lateFeeRate: 2.00,
    bounceCharge: 350,
    isActive: true,
    downPaymentRate: 20.00,
    dbdRate: 2.00,
    supportedFrequencies: ['MONTHLY'],
    insurancePlans: [],
  });

  const [newInsPlanName, setNewInsPlanName] = useState('');
  const [newInsPlanType, setNewInsPlanType] = useState<'FIXED' | 'PERCENTAGE'>('PERCENTAGE');
  const [newInsPlanValue, setNewInsPlanValue] = useState<number>(2.0);

  // Rules state
  const [rules, setRules] = useState<any[]>([]);
  const [editingRule, setEditingRule] = useState<any | null>(null);

  // Applications state
  const [applications, setApplications] = useState<any[]>([]);
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [remarks, setRemarks] = useState('');
  const [newNote, setNewNote] = useState('');
  const [appFilter, setAppFilter] = useState<string>('ALL');

  // Reports state
  const [reportType, setReportType] = useState('PORTFOLIO');
  const [reportData, setReportData] = useState<any>(null);

  // Audit Logs state
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Users Directory state
  const [users, setUsers] = useState<any[]>([]);

  // Search/Filters
  const [analyticsSearch, setAnalyticsSearch] = useState('');
  const [entriesLimit, setEntriesLimit] = useState(10);
  const [agentSearch, setAgentSearch] = useState('');
  const [systemUserSearch, setSystemUserSearch] = useState('');
  const [dateRange, setDateRange] = useState('-SELECT-');

  // Client Master Search
  const [searchType, setSearchType] = useState('Select Search Type');
  const [searchValue, setSearchValue] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  // Docs Upload Hub state
  const [uploadHubFile, setUploadHubFile] = useState<File | null>(null);
  const [uploadHubProgress, setUploadHubProgress] = useState(false);
  const [uploadHubForm, setUploadHubForm] = useState({
    identityType: 'Customer ID',
    identityValue: '',
    docType: 'PAN',
  });

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [transitioning, setTransitioning] = useState(false);

  const fetchTabDetails = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      // Fetch core datasets needed for lists
      const appRes = await fetch(appFilter === 'ALL' ? '/api/applications' : `/api/applications?status=${appFilter}`);
      if (appRes.ok) {
        const appData = await appRes.json();
        setApplications(appData.applications);
      }

      const prodRes = await fetch('/api/admin/products');
      if (prodRes.ok) {
        const prodData = await prodRes.json();
        setProducts(prodData.products);
      }

      const ruleRes = await fetch('/api/admin/rules');
      if (ruleRes.ok) {
        const ruleData = await ruleRes.json();
        setRules(ruleData.rules);
      }

      const userRes = await fetch('/api/admin/users');
      if (userRes.ok) {
        const userData = await userRes.json();
        setUsers(userData.users);
      }

      const auditRes = await fetch('/api/reports?type=AUDIT_LOG');
      if (auditRes.ok) {
        const auditData = await auditRes.json();
        setAuditLogs(auditData.data.logs);
      }

      const reportRes = await fetch(`/api/reports?type=${reportType}`);
      if (reportRes.ok) {
        const rData = await reportRes.json();
        setReportData(rData.data);
      }

    } catch (e) {
      console.error(e);
      setError('Failed to refresh admin console data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTabDetails();
  }, [appFilter, reportType]);

  // View specific application details
  const handleSelectApplication = async (appId: string) => {
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`/api/applications/${appId}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedApp(data.application);
        // Switch tab to APPLICATIONS (Underwriting Queue) to review details
        setActiveTab('APPLICATIONS');
      }
    } catch (err: any) {
      setError('Failed to fetch application details');
    }
  };

  // Transition Loan Application Status
  const handleStatusTransition = async (status: string) => {
    if (!selectedApp) return;
    setError('');
    setSuccess('');
    setTransitioning(true);

    try {
      const res = await fetch(`/api/applications/${selectedApp.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, remarks }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update application');

      setSuccess(`Application status transitioned to ${status}!`);
      setRemarks('');
      handleSelectApplication(selectedApp.id);
      fetchTabDetails();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setTransitioning(false);
    }
  };

  // Disburse Loan directly (RazorpayX Payout Simulation)
  const handleDisburseLoan = async () => {
    if (!selectedApp) return;
    setError('');
    setSuccess('');
    setTransitioning(true);

    try {
      const res = await fetch(`/api/loans/${selectedApp.id}/disburse`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Disbursement payout execution failed');

      setSuccess(`Payout issued successfully! Loan is active and disbursed.`);
      handleSelectApplication(selectedApp.id);
      fetchTabDetails();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setTransitioning(false);
    }
  };

  // Verify / Reject individual documents
  const handleVerifyDocument = async (docId: string, status: 'VERIFIED' | 'REJECTED') => {
    setError('');
    setSuccess('');
    const reason = status === 'REJECTED' ? prompt('Enter reason for document rejection:') || 'Invalid document' : undefined;

    try {
      const res = await fetch(`/api/documents/${docId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, rejectionReason: reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Document status change failed');

      setSuccess(`Document marked as ${status}.`);
      if (selectedApp) handleSelectApplication(selectedApp.id);
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Add underwriting comment
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp || !newNote.trim()) return;
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`/api/applications/${selectedApp.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newNote, isInternal: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to append note');

      handleSelectApplication(selectedApp.id);
      setNewNote('');
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Product submission
  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...productForm,
          id: productForm.id || undefined,
          minAmount: Number(productForm.minAmount),
          maxAmount: Number(productForm.maxAmount),
          interestRate: Number(productForm.interestRate),
          minTenure: Number(productForm.minTenure),
          maxTenure: Number(productForm.maxTenure),
          processingFee: Number(productForm.processingFee),
          lateFeeRate: Number(productForm.lateFeeRate),
          bounceCharge: Number(productForm.bounceCharge),
          downPaymentRate: Number(productForm.downPaymentRate || 20.00),
          dbdRate: Number(productForm.dbdRate || 2.00),
          supportedFrequencies: productForm.supportedFrequencies || ['MONTHLY'],
          insurancePlans: productForm.insurancePlans || [],
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save product');

      setSuccess('Product saved successfully!');
      setProductForm({
        id: '', name: '', description: '', minAmount: 10000, maxAmount: 100000,
        interestRate: 12.00, interestType: 'REDUCING', minTenure: 3, maxTenure: 24,
        processingFee: 1000, lateFeeRate: 2.00, bounceCharge: 350, isActive: true,
        downPaymentRate: 20.00, dbdRate: 2.00, supportedFrequencies: ['MONTHLY'], insurancePlans: []
      });
      fetchTabDetails();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleEditProduct = (prod: any) => {
    setProductForm({
      id: prod.id, name: prod.name, description: prod.description || '',
      minAmount: Number(prod.minAmount), maxAmount: Number(prod.maxAmount),
      interestRate: Number(prod.interestRate), interestType: prod.interestType,
      minTenure: prod.minTenure, maxTenure: prod.maxTenure,
      processingFee: Number(prod.processingFee), lateFeeRate: Number(prod.lateFeeRate),
      bounceCharge: Number(prod.bounceCharge), isActive: prod.isActive,
      downPaymentRate: prod.downPaymentRate !== null ? Number(prod.downPaymentRate) : 20.00,
      dbdRate: prod.dbdRate !== null ? Number(prod.dbdRate) : 2.00,
      supportedFrequencies: Array.isArray(prod.supportedFrequencies) ? prod.supportedFrequencies : ['MONTHLY'],
      insurancePlans: Array.isArray(prod.insurancePlans) ? prod.insurancePlans : [],
    });
  };

  // Rule Update
  const handleRuleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRule) return;
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/admin/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingRule.name,
          value: editingRule.value,
          description: editingRule.description,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update rule');

      setSuccess(`Rule ${editingRule.name} updated successfully!`);
      setEditingRule(null);
      fetchTabDetails();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleRuleValueChange = (key: string, val: any) => {
    if (!editingRule) return;
    setEditingRule({
      ...editingRule,
      value: { ...editingRule.value, [key]: val }
    });
  };

  // Client local lookup
  const handleClientSearch = () => {
    setHasSearched(true);
    let results: any[] = [];
    const query = searchValue.trim().toLowerCase();

    if (!query) {
      setSearchResults([]);
      return;
    }

    if (searchType === 'Phone Number') {
      results = users.filter(u => u.phoneNumber.includes(query));
    } else if (searchType === 'Email ID') {
      results = users.filter(u => u.email?.toLowerCase().includes(query));
    } else if (searchType === 'PAN Number') {
      results = users.filter(u => u.profile?.panNumber?.toLowerCase().includes(query));
    } else if (searchType === 'Aadhaar Number') {
      results = users.filter(u => u.profile?.aadhaarNumber?.includes(query));
    } else if (searchType === 'Customer Code') {
      results = users.filter(u => u.id.toLowerCase().includes(query) || u.profile?.id.toLowerCase().includes(query));
    } else {
      results = users.filter(u => u.profile?.fullName?.toLowerCase().includes(query));
    }
    setSearchResults(results);
  };

  // Client Manual Docs upload
  const handleHubUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!uploadHubForm.identityValue || !uploadHubFile) {
      setError('Please provide identity value and choose a file');
      return;
    }
    setUploadHubProgress(true);
    try {
      let targetCustomerId = '';
      if (uploadHubForm.identityType === 'Loan ID') {
        const appRes = await fetch(`/api/applications/${uploadHubForm.identityValue}`);
        if (!appRes.ok) throw new Error('Loan application not found');
        const appData = await appRes.json();
        targetCustomerId = appData.application.customerId;
      } else {
        targetCustomerId = uploadHubForm.identityValue;
      }

      const formData = new FormData();
      formData.append('file', uploadHubFile);
      formData.append('type', uploadHubForm.docType);
      formData.append('customerId', targetCustomerId);

      const uploadRes = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });

      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.error || 'Failed to upload document');

      setSuccess(`Document successfully uploaded and saved! Path: ${uploadData.url}`);
      setUploadHubFile(null);
      fetchTabDetails();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploadHubProgress(false);
    }
  };

  // Admin upload invoice scan & details
  const handleUploadInvoiceAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!invoiceModalApp) return;
    setUploadingInvoice(true);

    try {
      let uploadedUrl = '';
      if (invoiceFile) {
        const formData = new FormData();
        formData.append('file', invoiceFile);
        formData.append('type', 'INVOICE');
        formData.append('customerId', invoiceModalApp.customerId);

        const uploadRes = await fetch('/api/documents/upload', {
          method: 'POST',
          body: formData,
        });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error || 'Failed to upload invoice scan');
        uploadedUrl = uploadData.url;
      }

      const res = await fetch(`/api/applications/${invoiceModalApp.id}`, {
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

      setSuccess('Invoice details and scan submitted successfully! Application is under verification review.');
      setShowInvoiceModal(false);
      setInvoiceModalApp(null);
      setInvoiceFile(null);
      fetchTabDetails();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploadingInvoice(false);
    }
  };

  // Calculate live counts
  const totalLoanCount = applications.length;
  const disbursedCount = applications.filter(a => a.status === 'DISBURSED').length;
  const inProcessCount = applications.filter(a => ['UNDER_REVIEW', 'DOCUMENT_PENDING', 'APPROVED', 'MANDATE_PENDING', 'MANDATE_ACTIVE'].includes(a.status)).length;
  const rejectedCount = applications.filter(a => a.status === 'REJECTED').length;

  // Filter list of recent loans
  const filteredRecentLoans = applications.filter(app => {
    if (!analyticsSearch) return true;
    const name = app.customer.profile?.fullName || '';
    const phone = app.customer.phoneNumber || '';
    const pan = app.customer.profile?.panNumber || '';
    const query = analyticsSearch.toLowerCase();
    return name.toLowerCase().includes(query) || phone.includes(query) || pan.toLowerCase().includes(query);
  }).slice(0, entriesLimit);

  // Filter Agents
  const agentUsers = users.filter(u => u.role === 'MERCHANT').filter(a => {
    if (!agentSearch) return true;
    const name = a.profile?.fullName || '';
    const phone = a.phoneNumber || '';
    const email = a.email || '';
    const query = agentSearch.toLowerCase();
    return name.toLowerCase().includes(query) || phone.includes(query) || email.toLowerCase().includes(query);
  });

  // Filter System Users
  const systemUsers = users.filter(u => u.role !== 'MERCHANT').filter(a => {
    if (!systemUserSearch) return true;
    const name = a.profile?.fullName || '';
    const phone = a.phoneNumber || '';
    const role = a.role || '';
    const query = systemUserSearch.toLowerCase();
    return name.toLowerCase().includes(query) || phone.includes(query) || role.toLowerCase().includes(query);
  });

  return (
    <div className="flex flex-1 min-h-[calc(100vh-65px)] bg-[#F1F3F9]">
      
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-68 bg-[#1E2B58] text-white flex flex-col justify-between shrink-0 shadow-2xl transition-all duration-300">
        <div className="flex flex-col">
          {/* Logo container */}
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <span className="text-2xl font-black tracking-wider text-white">oroboro</span>
            <span className="px-2 py-0.5 rounded text-[8px] bg-indigo-500/20 text-indigo-300 font-bold uppercase tracking-widest border border-indigo-500/30">Admin</span>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5 overflow-y-auto max-h-[80vh]">
            
            {/* Analytics Overview */}
            <button
              onClick={() => { setActiveTab('ANALYTICS'); setSelectedApp(null); }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'ANALYTICS' 
                  ? 'bg-white/10 text-white border-l-4 border-indigo-400 font-extrabold' 
                  : 'text-slate-350 hover:bg-white/5 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 shrink-0 text-indigo-400" />
              <span>AnalyticsDashboard</span>
            </button>

            {/* Collapsible User Management */}
            <div>
              <button 
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="w-full flex items-center justify-between px-4 py-3 text-xs font-bold text-slate-350 hover:bg-white/5 hover:text-white rounded-xl transition-all"
              >
                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4 text-indigo-400" />
                  <span>User Management</span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 transition-all ${userMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {userMenuOpen && (
                <div className="pl-9 pr-2 py-1 space-y-1 bg-white/5 rounded-xl mt-0.5">
                  <button 
                    onClick={() => { setActiveTab('USER_AGENT'); setSelectedApp(null); }}
                    className={`w-full text-left py-2 text-[11px] font-bold block ${activeTab === 'USER_AGENT' ? 'text-white font-extrabold' : 'text-slate-450 hover:text-white'}`}
                  >
                    - AGENT
                  </button>
                  <button 
                    onClick={() => { setActiveTab('USER_SYSTEM'); setSelectedApp(null); }}
                    className={`w-full text-left py-2 text-[11px] font-bold block ${activeTab === 'USER_SYSTEM' ? 'text-white font-extrabold' : 'text-slate-450 hover:text-white'}`}
                  >
                    - USERS
                  </button>
                </div>
              )}
            </div>

            {/* Collapsible Client Master */}
            <div>
              <button 
                onClick={() => setClientMenuOpen(!clientMenuOpen)}
                className="w-full flex items-center justify-between px-4 py-3 text-xs font-bold text-slate-350 hover:bg-white/5 hover:text-white rounded-xl transition-all"
              >
                <div className="flex items-center gap-3">
                  <Landmark className="w-4 h-4 text-indigo-400" />
                  <span>Client Master</span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 transition-all ${clientMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {clientMenuOpen && (
                <div className="pl-9 pr-2 py-1 space-y-1 bg-white/5 rounded-xl mt-0.5">
                  <button 
                    onClick={() => { setActiveTab('CLIENT_RECORDS'); setSelectedApp(null); }}
                    className={`w-full text-left py-2 text-[11px] font-bold block ${activeTab === 'CLIENT_RECORDS' ? 'text-white font-extrabold' : 'text-slate-450 hover:text-white'}`}
                  >
                    - CLIENT RECORDS
                  </button>
                  <button 
                    onClick={() => { setActiveTab('CLIENT_UPLOAD'); setSelectedApp(null); }}
                    className={`w-full text-left py-2 text-[11px] font-bold block ${activeTab === 'CLIENT_UPLOAD' ? 'text-white font-extrabold' : 'text-slate-450 hover:text-white'}`}
                  >
                    - DOCS UPLOAD HUB
                  </button>
                </div>
              )}
            </div>

            {/* Collapsible Report */}
            <div>
              <button 
                onClick={() => setReportMenuOpen(!reportMenuOpen)}
                className="w-full flex items-center justify-between px-4 py-3 text-xs font-bold text-slate-350 hover:bg-white/5 hover:text-white rounded-xl transition-all"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-indigo-400" />
                  <span>Report</span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 transition-all ${reportMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {reportMenuOpen && (
                <div className="pl-9 pr-2 py-1 space-y-1 bg-white/5 rounded-xl mt-0.5">
                  <button 
                    onClick={() => { setActiveTab('REPORTS'); setSelectedApp(null); }}
                    className={`w-full text-left py-2 text-[11px] font-bold block ${activeTab === 'REPORTS' ? 'text-white font-extrabold' : 'text-slate-450 hover:text-white'}`}
                  >
                    - REPORTS
                  </button>
                </div>
              )}
            </div>

            {/* Collapsible Loans Disbursement */}
            <div>
              <button 
                onClick={() => setLoansDisbursementMenuOpen(!loansDisbursementMenuOpen)}
                className="w-full flex items-center justify-between px-4 py-3 text-xs font-bold text-slate-350 hover:bg-white/5 hover:text-white rounded-xl transition-all"
              >
                <div className="flex items-center gap-3">
                  <Landmark className="w-4 h-4 text-indigo-400" />
                  <span>Loans Disbursement</span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 transition-all ${loansDisbursementMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {loansDisbursementMenuOpen && (
                <div className="pl-9 pr-2 py-1 space-y-1 bg-white/5 rounded-xl mt-0.5">
                  <button 
                    onClick={() => { setActiveTab('LOANS_DISBURSEMENT'); setSelectedApp(null); }}
                    className={`w-full text-left py-2 text-[11px] font-bold block ${activeTab === 'LOANS_DISBURSEMENT' ? 'text-white font-extrabold' : 'text-slate-455 hover:text-white'}`}
                  >
                    - CONSUMER LOANS
                  </button>
                </div>
              )}
            </div>

            {/* Collapsible Loans */}
            <div>
              <button 
                onClick={() => setLoansMenuOpen(!loansMenuOpen)}
                className="w-full flex items-center justify-between px-4 py-3 text-xs font-bold text-slate-350 hover:bg-white/5 hover:text-white rounded-xl transition-all"
              >
                <div className="flex items-center gap-3">
                  <DollarSign className="w-4 h-4 text-indigo-400" />
                  <span>Loans</span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 transition-all ${loansMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {loansMenuOpen && (
                <div className="pl-9 pr-2 py-1 space-y-1 bg-white/5 rounded-xl mt-0.5">
                  <button 
                    onClick={() => { setActiveTab('LOANS'); setSelectedApp(null); }}
                    className={`w-full text-left py-2 text-[11px] font-bold block ${activeTab === 'LOANS' ? 'text-white font-extrabold' : 'text-slate-455 hover:text-white'}`}
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
                className="w-full flex items-center justify-between px-4 py-3 text-xs font-bold text-slate-350 hover:bg-white/5 hover:text-white rounded-xl transition-all"
              >
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="w-4 h-4 text-indigo-400" />
                  <span>Disbursal Tracker</span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 transition-all ${disbursalMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {disbursalMenuOpen && (
                <div className="pl-9 pr-2 py-1 space-y-1 bg-white/5 rounded-xl mt-0.5">
                  <button 
                    onClick={() => { setActiveTab('DISBURSAL_TRACKER'); setSelectedApp(null); }}
                    className={`w-full text-left py-2 text-[11px] font-bold block ${activeTab === 'DISBURSAL_TRACKER' ? 'text-white font-extrabold' : 'text-slate-455 hover:text-white'}`}
                  >
                    - CONSUMER LOANS
                  </button>
                </div>
              )}
            </div>

            {/* Collapsible Administration Menu */}
            <div>
              <button 
                onClick={() => setAdminMenuOpen(!adminMenuOpen)}
                className="w-full flex items-center justify-between px-4 py-3 text-xs font-bold text-slate-350 hover:bg-white/5 hover:text-white rounded-xl transition-all border-t border-white/5 pt-3 mt-2"
              >
                <div className="flex items-center gap-3">
                  <Lock className="w-4 h-4 text-indigo-400" />
                  <span>Administration</span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 transition-all ${adminMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {adminMenuOpen && (
                <div className="pl-9 pr-2 py-1 space-y-1 bg-white/5 rounded-xl mt-0.5">
                  <button 
                    onClick={() => { setActiveTab('APPLICATIONS'); setSelectedApp(null); }}
                    className={`w-full text-left py-2 text-[11px] font-bold block ${activeTab === 'APPLICATIONS' ? 'text-white font-extrabold' : 'text-slate-450 hover:text-white'}`}
                  >
                    - UNDERWRITING QUEUE
                  </button>
                  <button 
                    onClick={() => { setActiveTab('PRODUCTS'); setSelectedApp(null); }}
                    className={`w-full text-left py-2 text-[11px] font-bold block ${activeTab === 'PRODUCTS' ? 'text-white font-extrabold' : 'text-slate-450 hover:text-white'}`}
                  >
                    - LOAN PRODUCTS
                  </button>
                  <button 
                    onClick={() => { setActiveTab('RULES'); setSelectedApp(null); }}
                    className={`w-full text-left py-2 text-[11px] font-bold block ${activeTab === 'RULES' ? 'text-white font-extrabold' : 'text-slate-450 hover:text-white'}`}
                  >
                    - ELIGIBILITY RULES
                  </button>
                  <button 
                    onClick={() => { setActiveTab('AUDIT_LOGS'); setSelectedApp(null); }}
                    className={`w-full text-left py-2 text-[11px] font-bold block ${activeTab === 'AUDIT_LOGS' ? 'text-white font-extrabold' : 'text-slate-450 hover:text-white'}`}
                  >
                    - SECURITY AUDIT LOGS
                  </button>
                </div>
              )}
            </div>
          </nav>
        </div>

        <div className="p-4 border-t border-white/10 text-[9px] text-slate-400 text-center font-bold uppercase tracking-widest">
          Console Version 1.0.4
        </div>
      </aside>

      {/* DYNAMIC CONTENT AREA */}
      <main className="flex-1 overflow-y-auto max-w-7xl mx-auto w-full flex flex-col">
        
        {/* PREMIUM TOP BAR */}
        <header className="bg-white border-b border-slate-200 py-3.5 px-6 flex justify-between items-center shadow-sm sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <span className="text-[13px] font-bold text-[#1E2B58] uppercase tracking-wider bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl shadow-xs">
              Branch: CK_JALORE-1
            </span>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">• Region Office</span>
          </div>

          <div className="flex items-center gap-6 text-slate-605">
            {/* Search Simulator */}
            <button className="hover:text-indigo-600 transition-colors p-1.5 rounded-lg hover:bg-slate-50">
              <Search className="w-4 h-4" />
            </button>

            {/* Notification Ring */}
            <div className="relative p-1.5 rounded-lg hover:bg-slate-50 cursor-pointer">
              <span className="absolute -top-0.5 -right-0.5 bg-rose-500 text-white font-extrabold text-[8px] px-1 py-0.2 rounded-full border border-white">
                100
              </span>
              <AlertCircle className="w-4.5 h-4.5" />
            </div>

            {/* Profile Summary Card */}
            <div className="flex items-center gap-2.5 border-l border-slate-200 pl-4 py-1">
              <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center font-bold text-xs">
                A
              </div>
              <div className="text-left hidden sm:block">
                <span className="block text-xs font-black text-slate-900 leading-tight">System Admin</span>
                <span className="block text-[9px] text-emerald-600 font-bold uppercase mt-0.5">Admin Role</span>
              </div>
            </div>
          </div>
        </header>

        {/* NOTIFICATION MESSAGES */}
        <div className="px-6 md:px-8 pt-6">
          {error && <div className="p-4 bg-rose-50 border border-rose-200 text-rose-600 rounded-2xl text-center text-xs font-bold shadow-sm mb-4">{error}</div>}
          {success && <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-2xl text-center text-xs font-bold shadow-sm mb-4">{success}</div>}
        </div>

        {/* DYNAMIC VIEWS */}
        <div className="p-6 md:p-8 flex-1">
          {loading ? (
            <div className="flex justify-center items-center py-20 min-h-[50vh]">
              <span className="w-8 h-8 border-4 border-[#1E2B58] border-t-transparent rounded-full animate-spin"></span>
            </div>
          ) : (
            <div className="space-y-8 animate-fadeIn">
              
              {/* TAB 1: ANALYTICS OVERVIEW */}
              {activeTab === 'ANALYTICS' && (
                <div className="space-y-8">
                  
                  {/* Top Bar with Time Selector */}
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-xl font-black text-slate-900 leading-tight">Analytics Dashboard</h2>
                      <p className="text-slate-500 text-xs">Overview of all active applications, repayments, and disbursals.</p>
                    </div>
                    <select className="bg-white border border-slate-250 text-xs font-bold text-slate-700 px-4 py-2.5 rounded-xl shadow-xs focus:outline-none">
                      <option>Last 7 Days</option>
                      <option>Last 30 Days</option>
                      <option>Current Quarter</option>
                      <option>All Time</option>
                    </select>
                  </div>

                  {/* 4 Summary Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Card 1: Total Loan */}
                    <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm flex items-center justify-between hover:scale-[1.02] transition-transform duration-350">
                      <div className="space-y-1">
                        <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block">Total Loan</span>
                        <span className="text-3xl font-black text-slate-900 block">{totalLoanCount}</span>
                      </div>
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-150 text-indigo-600 flex items-center justify-center text-xl font-bold">
                        💼
                      </div>
                    </div>

                    {/* Card 2: Disbursed */}
                    <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm flex items-center justify-between hover:scale-[1.02] transition-transform duration-350">
                      <div className="space-y-1">
                        <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block">Disbursed</span>
                        <span className="text-3xl font-black text-slate-900 block">{disbursedCount}</span>
                      </div>
                      <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-150 text-emerald-600 flex items-center justify-center text-xl font-bold">
                        🏦
                      </div>
                    </div>

                    {/* Card 3: In-Process */}
                    <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm flex items-center justify-between hover:scale-[1.02] transition-transform duration-350">
                      <div className="space-y-1">
                        <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block">In-Process</span>
                        <span className="text-3xl font-black text-slate-900 block">{inProcessCount}</span>
                      </div>
                      <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-150 text-amber-600 flex items-center justify-center text-xl font-bold">
                        ⚙️
                      </div>
                    </div>

                    {/* Card 4: Rejected */}
                    <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm flex items-center justify-between hover:scale-[1.02] transition-transform duration-350">
                      <div className="space-y-1">
                        <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block">Rejected</span>
                        <span className="text-3xl font-black text-slate-900 block">{rejectedCount}</span>
                      </div>
                      <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-150 text-rose-600 flex items-center justify-center text-xl font-bold">
                        ❌
                      </div>
                    </div>
                  </div>

                  {/* Recent Loans Section */}
                  <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                      <h3 className="font-extrabold text-slate-900 text-base">Recent Loans</h3>
                      
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-550 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
                          <span>Show</span>
                          <select 
                            value={entriesLimit} 
                            onChange={(e) => setEntriesLimit(Number(e.target.value))} 
                            className="bg-transparent border-none focus:outline-none font-extrabold cursor-pointer"
                          >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                          </select>
                          <span>entries</span>
                        </div>

                        <div className="relative">
                          <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input 
                            type="text" 
                            placeholder="Search customer, phone..." 
                            value={analyticsSearch}
                            onChange={(e) => setAnalyticsSearch(e.target.value)}
                            className="pl-9 pr-4 py-2 border border-slate-250 bg-white text-xs rounded-xl focus:border-indigo-500 focus:outline-none font-semibold text-slate-800"
                          />
                        </div>
                      </div>
                    </div>

                    {filteredRecentLoans.length === 0 ? (
                      <p className="text-slate-400 text-center py-8 text-xs font-bold">No application records found.</p>
                    ) : (
                      <div className="overflow-x-auto border border-slate-150 rounded-2xl">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-slate-200 text-slate-600 bg-slate-50/70 font-black uppercase tracking-wider">
                              <th className="py-4 px-4 font-bold text-[10px]">Agent</th>
                              <th className="py-4 px-4 font-bold text-[10px]">PAN</th>
                              <th className="py-4 px-4 font-bold text-[10px]">Customer</th>
                              <th className="py-4 px-4 font-bold text-[10px]">Loan No.</th>
                              <th className="py-4 px-4 font-bold text-[10px]">Amount</th>
                              <th className="py-4 px-4 font-bold text-[10px]">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-150 font-bold text-slate-700">
                            {filteredRecentLoans.map((app) => (
                              <tr key={app.id} onClick={() => handleSelectApplication(app.id)} className="hover:bg-slate-50/75 cursor-pointer transition-colors">
                                <td className="py-4.5 px-4 max-w-[180px] truncate">
                                  {app.merchant?.profile?.fullName || 'Vankal Mata Mobile And Electri'}
                                </td>
                                <td className="py-4.5 px-4 font-mono uppercase text-slate-600">{app.customer?.profile?.panNumber || 'GTHPR6733R'}</td>
                                <td className="py-4.5 px-4 text-slate-900">{app.customer?.profile?.fullName || 'Mancha Ram'}</td>
                                <td className="py-4.5 px-4 font-mono text-slate-500">ORO011C2284-{app.id.substring(0,5)}</td>
                                <td className="py-4.5 px-4 text-slate-900 font-extrabold">₹{Number(app.productValue || app.requestedAmount).toLocaleString()}</td>
                                <td className="py-4.5 px-4">
                                  <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase border tracking-wider inline-block ${
                                    app.status === 'DISBURSED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                    app.status === 'UNDER_REVIEW' ? 'bg-indigo-50 text-indigo-650 border-indigo-100' :
                                    app.status === 'REJECTED' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                    'bg-amber-50 text-amber-600 border-amber-100'
                                  }`}>
                                    {app.status === 'UNDER_REVIEW' ? 'UNDER REVIEW' : app.status}
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

              {/* TAB 2: AGENT USER DIRECTORY */}
              {activeTab === 'USER_AGENT' && (
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <div>
                      <h2 className="text-lg font-black text-slate-900 leading-tight">Existing Agents</h2>
                      <p className="text-slate-500 text-xs">Directory of partner stores and merchant operators.</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <div className="text-xs font-bold text-slate-600 flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
                        <span>Choose Data Range</span>
                        <select value={dateRange} onChange={(e) => setDateRange(e.target.value)} className="bg-transparent border-none focus:outline-none cursor-pointer font-black text-slate-800">
                          <option>-SELECT-</option>
                          <option>Current Month</option>
                          <option>Last Quarter</option>
                        </select>
                      </div>

                      <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                          type="text" 
                          placeholder="Search agents..." 
                          value={agentSearch}
                          onChange={(e) => setAgentSearch(e.target.value)}
                          className="pl-9 pr-4 py-2 border border-slate-250 bg-white text-xs rounded-xl focus:border-indigo-500 focus:outline-none font-semibold text-slate-800"
                        />
                      </div>
                    </div>
                  </div>

                  {agentUsers.length === 0 ? (
                    <p className="text-slate-400 text-center py-8 text-xs font-bold">No agents found.</p>
                  ) : (
                    <div className="overflow-x-auto border border-slate-150 rounded-2xl">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-600 bg-slate-50/70 font-black uppercase tracking-wider">
                            <th className="py-4 px-4 font-bold text-[10px]">Agent Code</th>
                            <th className="py-4 px-4 font-bold text-[10px]">Agent Name</th>
                            <th className="py-4 px-4 font-bold text-[10px]">Mobile Number</th>
                            <th className="py-4 px-4 font-bold text-[10px]">Email ID</th>
                            <th className="py-4 px-4 font-bold text-[10px]">Brand Name</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-150 font-bold text-slate-700">
                          {agentUsers.map((agent) => (
                            <tr key={agent.id} className="hover:bg-slate-50/50">
                              <td className="py-4 px-4 font-mono text-indigo-600">C{agent.id.substring(0,4).toUpperCase()}</td>
                              <td className="py-4 px-4 text-slate-900 font-extrabold">{agent.profile?.fullName || 'Raju Ram'}</td>
                              <td className="py-4 px-4 font-mono">{agent.phoneNumber}</td>
                              <td className="py-4 px-4 text-slate-600 font-normal">{agent.email || 'N/A'}</td>
                              <td className="py-4 px-4 text-slate-900 font-bold">{agent.profile?.bankName || `${agent.profile?.fullName || 'Agent'} Store`}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: SYSTEM USERS DIRECTORY */}
              {activeTab === 'USER_SYSTEM' && (
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <div>
                      <h2 className="text-lg font-black text-slate-900 leading-tight">Existing Users</h2>
                      <p className="text-slate-500 text-xs">Database profiles of active clients and administrative operators.</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <div className="text-xs font-bold text-slate-600 flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
                        <span>Choose Data Range</span>
                        <select value={dateRange} onChange={(e) => setDateRange(e.target.value)} className="bg-transparent border-none focus:outline-none cursor-pointer font-black text-slate-800">
                          <option>-SELECT-</option>
                          <option>Current Month</option>
                          <option>Last Quarter</option>
                        </select>
                      </div>

                      <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                          type="text" 
                          placeholder="Search users..." 
                          value={systemUserSearch}
                          onChange={(e) => setSystemUserSearch(e.target.value)}
                          className="pl-9 pr-4 py-2 border border-slate-250 bg-white text-xs rounded-xl focus:border-indigo-500 focus:outline-none font-semibold text-slate-800"
                        />
                      </div>
                    </div>
                  </div>

                  {systemUsers.length === 0 ? (
                    <p className="text-slate-400 text-center py-8 text-xs font-bold">No system users found.</p>
                  ) : (
                    <div className="overflow-x-auto border border-slate-150 rounded-2xl">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-600 bg-slate-50/70 font-black uppercase tracking-wider">
                            <th className="py-4 px-4 font-bold text-[10px]">Name</th>
                            <th className="py-4 px-4 font-bold text-[10px]">User Name</th>
                            <th className="py-4 px-4 font-bold text-[10px]">Mobile Number</th>
                            <th className="py-4 px-4 font-bold text-[10px]">Email ID</th>
                            <th className="py-4 px-4 font-bold text-[10px]">Role</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-150 font-bold text-slate-700">
                          {systemUsers.map((item) => (
                            <tr key={item.id} className="hover:bg-slate-50/50">
                              <td className="py-4 px-4 text-slate-900 font-extrabold">{item.profile?.fullName || 'Bhawara Ram'}</td>
                              <td className="py-4 px-4 font-mono">{item.phoneNumber}</td>
                              <td className="py-4 px-4 font-mono">{item.phoneNumber}</td>
                              <td className="py-4 px-4 text-slate-600 font-normal">{item.email || 'N/A'}</td>
                              <td className="py-4 px-4">
                                <span className={`px-2.5 py-0.5 rounded text-[9px] font-black border uppercase tracking-wider ${
                                  item.role === 'ADMIN' || item.role === 'SUPER_ADMIN' ? 'bg-indigo-55 text-indigo-700 border-indigo-200' :
                                  item.role === 'LOAN_OFFICER' || item.role === 'OPERATIONS' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                  'bg-slate-100 text-slate-500 border-slate-200'
                                }`}>
                                  {item.role}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: CLIENT RECORDS (SEARCH) */}
              {activeTab === 'CLIENT_RECORDS' && (
                <div className="space-y-6">
                  
                  {/* Search Form Card */}
                  <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
                    <div className="flex items-center gap-3 border-b border-slate-150 pb-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-[#1E2B58] flex items-center justify-center text-lg">
                        <Search className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-slate-900 text-md">Search Customer Records</h3>
                        <p className="text-slate-400 text-xs mt-0.5">Find customer profiles using various search criteria</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 items-end text-xs font-semibold text-slate-700">
                      <div>
                        <label className="block text-slate-500 text-xs font-bold mb-2 uppercase">Choose Search Type</label>
                        <select 
                          value={searchType}
                          onChange={(e) => setSearchType(e.target.value)}
                          className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-800 font-semibold cursor-pointer"
                        >
                          <option>Select Search Type</option>
                          <option>Customer Code</option>
                          <option>PAN Number</option>
                          <option>Aadhaar Number</option>
                          <option>Phone Number</option>
                          <option>Email ID</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-500 text-xs font-bold mb-2 uppercase">Enter Search Value</label>
                        <input 
                          type="text"
                          placeholder="Type here..."
                          value={searchValue}
                          onChange={(e) => setSearchValue(e.target.value)}
                          className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-850"
                        />
                      </div>

                      <button 
                        onClick={handleClientSearch}
                        className="px-6 py-2.5 bg-[#1E2B58] hover:bg-[#1a254c] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all h-[42px]"
                      >
                        <Search className="w-4 h-4" /> Search
                      </button>
                    </div>
                  </div>

                  {/* Search Results */}
                  {hasSearched && (
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6 animate-fadeIn">
                      <h3 className="font-extrabold text-slate-900 text-base">Search Results</h3>
                      
                      {searchResults.length === 0 ? (
                        <p className="text-slate-400 text-center py-8 text-xs font-bold">No customer records matching this search query were found.</p>
                      ) : (
                        <div className="space-y-6">
                          {searchResults.map((item) => (
                            <div key={item.id} className="border border-slate-200 p-5 rounded-2xl space-y-4 bg-slate-50/40">
                              <div className="flex justify-between items-start border-b border-slate-100 pb-2.5">
                                <div>
                                  <span className="text-sm font-black text-slate-900">{item.profile?.fullName || 'N/A'}</span>
                                  <span className="block text-[10px] text-slate-400 font-mono mt-0.5">UID: {item.id}</span>
                                </div>
                                <span className={`px-2 py-0.5 rounded text-[8px] font-black tracking-widest border border-indigo-200 uppercase text-indigo-700 bg-indigo-50`}>
                                  Active Record
                                </span>
                              </div>

                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-semibold text-slate-700">
                                <div>
                                  <span className="text-slate-450 block text-[10px] uppercase">Phone Number</span>
                                  <span className="text-slate-850 font-mono">{item.phoneNumber}</span>
                                </div>
                                <div>
                                  <span className="text-slate-450 block text-[10px] uppercase">Email Address</span>
                                  <span className="text-slate-850">{item.email || 'N/A'}</span>
                                </div>
                                <div>
                                  <span className="text-slate-450 block text-[10px] uppercase">PAN Number</span>
                                  <span className="text-slate-850 font-mono uppercase">{item.profile?.panNumber || 'N/A'}</span>
                                </div>
                                <div>
                                  <span className="text-slate-450 block text-[10px] uppercase">Aadhaar Number</span>
                                  <span className="text-slate-850 font-mono">{item.profile?.aadhaarNumber || 'N/A'}</span>
                                </div>
                                <div>
                                  <span className="text-slate-450 block text-[10px] uppercase">CIBIL Score</span>
                                  <span className={`font-black ${item.profile?.cibilScore >= 650 ? 'text-emerald-650' : 'text-rose-605'}`}>{item.profile?.cibilScore || 'N/A'}</span>
                                </div>
                                <div>
                                  <span className="text-slate-450 block text-[10px] uppercase">Monthly Income</span>
                                  <span className="text-slate-850 font-black">₹{Number(item.profile?.monthlyIncome || 0).toLocaleString()}</span>
                                </div>
                                <div className="sm:col-span-2">
                                  <span className="text-slate-455 block text-[10px] uppercase">Residential Address</span>
                                  <span className="text-slate-850 truncate block">{item.profile?.addressLine1}, {item.profile?.city}, {item.profile?.state} - {item.profile?.pincode}</span>
                                </div>
                              </div>

                              {/* Uploaded Documents checklist */}
                              <div className="pt-3 border-t border-slate-100">
                                <span className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-2">Linked Documents</span>
                                {item.profile?.documents?.length === 0 ? (
                                  <p className="text-slate-400 text-[11px] font-bold">No documents linked to this profile.</p>
                                ) : (
                                  <div className="flex flex-wrap gap-2.5">
                                    {item.profile?.documents?.map((doc: any) => (
                                      <a key={doc.id} href={`/uploads/${doc.s3Url}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-250 bg-white rounded-lg hover:bg-slate-50 transition-all font-semibold text-[10px] text-slate-700">
                                        <FileText className="w-3.5 h-3.5 text-indigo-500" />
                                        <span>{doc.type}</span>
                                        <span className={`px-1 py-0.2 rounded-[4px] text-[8px] font-black uppercase ${doc.status === 'VERIFIED' ? 'bg-emerald-50 text-emerald-600 border border-emerald-150' : 'bg-slate-100 text-slate-500'}`}>
                                          {doc.status}
                                        </span>
                                      </a>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: DOCS UPLOAD HUB */}
              {activeTab === 'CLIENT_UPLOAD' && (
                <div className="max-w-xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
                  <div className="flex items-center gap-3 border-b border-slate-150 pb-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-[#1E2B58] flex items-center justify-center text-lg">
                      <UploadCloud className="w-5 h-5 animate-bounce" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-md">Upload Document</h3>
                      <p className="text-slate-400 text-xs mt-0.5">Manually optimize and upload document files to user profiles</p>
                    </div>
                  </div>

                  <form onSubmit={handleHubUpload} className="space-y-4 text-xs font-semibold text-slate-700">
                    <div>
                      <label className="block text-slate-500 text-xs font-bold mb-2 uppercase">Identity Type</label>
                      <select 
                        value={uploadHubForm.identityType}
                        onChange={(e) => setUploadHubForm({ ...uploadHubForm, identityType: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-800 font-semibold cursor-pointer"
                      >
                        <option>Customer ID</option>
                        <option>Loan ID</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-500 text-xs font-bold mb-2 uppercase">Identity Value</label>
                      <input 
                        type="text"
                        required
                        placeholder="Paste ID code here..."
                        value={uploadHubForm.identityValue}
                        onChange={(e) => setUploadHubForm({ ...uploadHubForm, identityValue: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-500 text-xs font-bold mb-2 uppercase">Document Type</label>
                      <select 
                        value={uploadHubForm.docType}
                        onChange={(e) => setUploadHubForm({ ...uploadHubForm, docType: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-800 font-semibold cursor-pointer"
                      >
                        <option value="PAN">PAN Card</option>
                        <option value="AADHAAR">Aadhaar Card</option>
                        <option value="BANK_PROOF">Address Proof / Bank Statement</option>
                        <option value="SELFIE">Live Selfie Photo</option>
                        <option value="INVOICE">Product Invoice Statement</option>
                        <option value="AGREEMENT">E-Sign Loan Agreement</option>
                        <option value="NOC">No Objection Certificate (NOC)</option>
                      </select>
                    </div>

                    <div className="border border-dashed border-slate-300 hover:border-slate-400 bg-slate-50/50 p-6 rounded-2xl text-center space-y-3">
                      <span className="text-[10px] text-slate-550 block font-bold uppercase tracking-wide">Choose or drag Your File</span>
                      <label className="flex flex-col items-center justify-center p-4 border border-dashed border-slate-305 bg-white rounded-xl cursor-pointer transition-all hover:bg-slate-50/30">
                        <UploadCloud className="w-8 h-8 text-indigo-500 mb-2" />
                        <span className="text-[10px] text-slate-500 font-bold uppercase">
                          {uploadHubProgress ? 'Optimizing Buffer WebP...' : 'Drag & Drop your files or Browse'}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setUploadHubFile(e.target.files?.[0] || null)}
                          className="hidden"
                        />
                      </label>
                      {uploadHubFile && (
                        <p className="text-[11px] text-emerald-600 font-bold">✓ Attached File: {uploadHubFile.name} ({(uploadHubFile.size/1024).toFixed(1)} KB)</p>
                      )}
                    </div>

                    <button 
                      type="submit"
                      disabled={uploadHubProgress || !uploadHubFile || !uploadHubForm.identityValue}
                      className="w-full py-3 bg-[#1E2B58] hover:bg-[#1a254c] disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold rounded-xl transition-all shadow-sm active:scale-95 text-xs uppercase"
                    >
                      {uploadHubProgress ? 'Processing File...' : 'Proceed'}
                    </button>
                  </form>
                </div>
              )}

              {/* TAB 6: UNDERWRITING QUEUE (APPLICATIONS) */}
              {activeTab === 'APPLICATIONS' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  
                  {/* Applications Queue list */}
                  <div className="lg:col-span-1 bg-white border border-slate-200 rounded-3xl p-6 space-y-6 shadow-sm">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                      <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                        <FolderOpen className="w-4 h-4 text-indigo-650" />
                        Applications Queue
                      </h2>
                      <select
                        value={appFilter}
                        onChange={(e) => setAppFilter(e.target.value)}
                        className="bg-slate-50 border border-slate-250 text-[11px] font-bold text-slate-650 px-2.5 py-1.5 rounded-lg focus:outline-none cursor-pointer"
                      >
                        <option value="ALL">All Statuses</option>
                        <option value="UNDER_REVIEW">Under Review</option>
                        <option value="DOCUMENT_PENDING">Doc Pending</option>
                        <option value="APPROVED">Approved</option>
                        <option value="MANDATE_ACTIVE">Mandate Active</option>
                        <option value="DISBURSED">Disbursed</option>
                        <option value="REJECTED">Rejected</option>
                      </select>
                    </div>

                    {applications.length === 0 ? (
                      <p className="text-slate-400 text-xs text-center py-10 font-bold">No applications found in this queue.</p>
                    ) : (
                      <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                        {applications.map((app) => (
                          <div
                            key={app.id}
                            onClick={() => handleSelectApplication(app.id)}
                            className={`p-4 border rounded-2xl cursor-pointer transition-all ${
                              selectedApp?.id === app.id
                                ? 'bg-indigo-50/50 border-indigo-350 shadow-sm'
                                : 'bg-white border-slate-200 hover:border-slate-350'
                            }`}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <span className="font-extrabold text-slate-905 text-xs truncate max-w-[140px]">
                                {app.customer?.profile?.fullName || 'Prospect Customer'}
                              </span>
                              <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase border ${
                                app.status === 'DISBURSED' || app.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                app.status === 'REJECTED' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                app.status === 'UNDER_REVIEW' ? 'bg-indigo-50 text-indigo-650 border-indigo-100' :
                                'bg-slate-100 text-slate-500 border-slate-200'
                              }`}>
                                {app.status === 'UNDER_REVIEW' ? 'UNDER REVIEW' : app.status}
                              </span>
                            </div>
                            <div className="flex justify-between text-[11px] text-slate-500 font-semibold">
                              <span>₹{Number(app.productValue || app.requestedAmount).toLocaleString()}</span>
                              <span className="font-black text-indigo-605">Step {app.onboardingStep} of 10</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Underwriting File details panel */}
                  <div className="lg:col-span-2 space-y-6">
                    {selectedApp ? (
                      <div className="space-y-6">
                        
                        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
                          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                            <div>
                              <h2 className="text-base font-extrabold text-slate-900">Application File Details</h2>
                              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mt-0.5">App ID: {selectedApp.id}</p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black border uppercase ${
                              selectedApp.status === 'APPROVED' || selectedApp.status === 'DISBURSED' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                              selectedApp.status === 'REJECTED' ? 'bg-rose-50 text-rose-600 border-rose-200' :
                              selectedApp.status === 'UNDER_REVIEW' ? 'bg-indigo-50 text-indigo-650 border-indigo-200' :
                              'bg-amber-50 text-amber-600 border-amber-200'
                            }`}>
                              {selectedApp.status === 'UNDER_REVIEW' ? 'UNDER REVIEW' : selectedApp.status}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-semibold text-slate-700">
                            <div>
                              <span className="text-slate-400 block uppercase">Product Spec</span>
                              <span className="text-slate-900 font-extrabold">{selectedApp.productName || selectedApp.product?.name}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block uppercase">Requested Value</span>
                              <span className="text-slate-905 font-extrabold">₹{Number(selectedApp.productValue || selectedApp.requestedAmount).toLocaleString()}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block uppercase">Installment Tenure</span>
                              <span className="text-slate-900 font-bold">{selectedApp.requestedTenure} Months</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block uppercase">Applicant phone</span>
                              <span className="text-slate-900 font-mono font-bold">{selectedApp.customer?.phoneNumber}</span>
                            </div>
                          </div>

                          <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-3 font-semibold text-xs text-slate-700">
                            <h3 className="font-extrabold text-slate-800 uppercase tracking-wider mb-2 border-b border-slate-200/50 pb-1.5">Customer Profile Scan</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>Full Name: <span className="text-slate-900 font-extrabold">{selectedApp.customer?.profile?.fullName}</span></div>
                              <div>PAN Card: <span className="text-slate-900 font-mono font-bold uppercase">{selectedApp.customer?.profile?.panNumber}</span></div>
                              <div>Aadhaar ID: <span className="text-slate-900 font-mono">{selectedApp.customer?.profile?.aadhaarNumber}</span></div>
                              <div>Net Monthly Income: <span className="text-slate-900 font-bold">₹{Number(selectedApp.customer?.profile?.monthlyIncome || 0).toLocaleString()}</span></div>
                            </div>
                          </div>

                          {selectedApp.customer?.profile?.cibilScore && (
                            <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-3 font-semibold text-xs">
                              <h3 className="font-extrabold text-slate-800 uppercase tracking-wider mb-2 border-b border-slate-200/50 pb-1.5">Credit Bureau Evaluation</h3>
                              <div className="flex items-center gap-4">
                                <div className="bg-white p-3 rounded-xl border border-slate-200 text-center w-24">
                                  <span className="text-slate-400 block text-[10px]">CIBIL score</span>
                                  <span className={`text-xl font-black ${selectedApp.customer.profile.cibilScore >= 650 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {selectedApp.customer.profile.cibilScore}
                                  </span>
                                </div>
                                <div className="text-slate-650 leading-relaxed font-bold">
                                  {selectedApp.eligibilityCheck ? (
                                    <p>
                                      Rule engine validation result: {selectedApp.eligibilityCheck.eligible ? (
                                        <span className="text-emerald-600">PASSED AUTOMATED RISK CRITERIA</span>
                                      ) : (
                                        <span className="text-rose-600">REJECTED BY RISK POLICY ({selectedApp.eligibilityCheck.riskFlags.join(', ')})</span>
                                      )}
                                    </p>
                                  ) : (
                                    <p className="text-slate-405 font-normal">Onboarding documents pending admin review approval before eligibility check evaluates.</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-2 font-semibold text-xs text-slate-700">
                            <h3 className="font-extrabold text-slate-800 uppercase tracking-wider mb-2 border-b border-slate-200/50 pb-1.5">Family References</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>Reference 1: <span className="text-slate-900">{selectedApp.customer?.profile?.reference1Name} ({selectedApp.customer?.profile?.reference1Mobile || 'N/A'})</span></div>
                              <div>Reference 2: <span className="text-slate-900">{selectedApp.customer?.profile?.reference2Name} ({selectedApp.customer?.profile?.reference2Mobile || 'N/A'})</span></div>
                            </div>
                          </div>

                          {/* Document Checklist verification */}
                          <div className="space-y-4 border-t border-slate-150 pt-4">
                            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wide">Document Verification Checklist</h3>
                            
                            {!selectedApp.customer?.profile?.documents || selectedApp.customer.profile.documents.length === 0 ? (
                              <p className="text-slate-400 text-xs">No documents uploaded for this applicant.</p>
                            ) : (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {selectedApp.customer.profile.documents.map((doc: any) => (
                                  <div key={doc.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-between space-y-3 shadow-xs">
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <span className="font-extrabold text-xs block text-slate-800 uppercase">{doc.type}</span>
                                        <span className="text-[10px] text-slate-400 font-bold block mt-0.5">Version: {doc.version}</span>
                                      </div>
                                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase border ${
                                        doc.status === 'VERIFIED' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                                        doc.status === 'REJECTED' ? 'bg-rose-50 text-rose-600 border-rose-200' :
                                        'bg-amber-50 text-amber-600 border-amber-200'
                                      }`}>
                                        {doc.status}
                                      </span>
                                    </div>

                                    <div className="text-[11px] font-semibold flex items-center justify-between">
                                      <a
                                        href={`/uploads/${doc.s3Url}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-indigo-650 hover:underline font-extrabold flex items-center gap-1 bg-white border border-slate-200 px-2.5 py-1 rounded-lg"
                                      >
                                        <Search className="w-3 h-3" /> View Scan
                                      </a>

                                      {doc.status !== 'VERIFIED' && (
                                        <div className="space-x-1.5">
                                          <button
                                            onClick={() => handleVerifyDocument(doc.id, 'VERIFIED')}
                                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold shadow-sm"
                                          >
                                            Approve
                                          </button>
                                          <button
                                            onClick={() => handleVerifyDocument(doc.id, 'REJECTED')}
                                            className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-bold shadow-sm"
                                          >
                                            Reject
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Notes/Comments trail */}
                          <div className="space-y-3 border-t border-slate-150 pt-4">
                            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Underwriting Comments Trail</h3>
                            
                            <div className="space-y-2 max-h-40 overflow-y-auto bg-slate-50 border border-slate-200 p-4 rounded-xl text-xs font-medium">
                              {selectedApp.notes?.length === 0 ? (
                                <p className="text-slate-400">No notes written for this application.</p>
                              ) : (
                                selectedApp.notes?.map((n: any) => (
                                  <div key={n.id} className="pb-2 border-b border-slate-200/60 last:border-0 last:pb-0">
                                    <div className="flex justify-between text-[10px] text-slate-400 font-bold mb-0.5">
                                      <span>{n.author.email} ({n.author.role})</span>
                                      <span>{new Date(n.createdAt).toLocaleString()}</span>
                                    </div>
                                    <p className="text-slate-700 font-semibold">{n.content}</p>
                                  </div>
                                ))
                              )}
                            </div>

                            <form onSubmit={handleAddNote} className="flex gap-2">
                              <input
                                type="text"
                                required
                                placeholder="Type underwriters comment..."
                                value={newNote}
                                onChange={(e) => setNewNote(e.target.value)}
                                className="flex-1 px-4 py-2 border border-slate-300 bg-white text-xs rounded-xl focus:border-indigo-500 focus:outline-none font-semibold text-slate-800"
                              />
                              <button
                                type="submit"
                                className="px-4 py-2 bg-slate-900 hover:bg-slate-950 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
                              >
                                Add Note
                              </button>
                            </form>
                          </div>

                          {/* Action panel */}
                          <div className="border-t border-slate-150 pt-5 space-y-4">
                            <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider">Underwriter/Ops Action Panel</label>
                            
                            <div className="space-y-3">
                              <input
                                type="text"
                                placeholder="Enter audit remarks or rejection details (required for action)..."
                                value={remarks}
                                onChange={(e) => setRemarks(e.target.value)}
                                className="w-full px-4 py-3 border border-slate-300 bg-white text-xs rounded-xl focus:border-indigo-500 focus:outline-none font-semibold text-slate-800"
                              />

                              <div className="flex flex-wrap gap-2.5">
                                {/* If UNDER_REVIEW onboarding step - verify docs & Approve Onboarding */}
                                {selectedApp.status === 'UNDER_REVIEW' && selectedApp.onboardingStep === 4 && (
                                  <>
                                    {selectedApp.customer?.profile?.documents?.length > 0 &&
                                    selectedApp.customer.profile.documents.every((d: any) => d.status === 'VERIFIED') ? (
                                      <button
                                        onClick={async () => {
                                          setError('');
                                          setSuccess('');
                                          setTransitioning(true);
                                          try {
                                            const res = await fetch(`/api/applications/${selectedApp.id}`, {
                                              method: 'PUT',
                                              headers: { 'Content-Type': 'application/json' },
                                              body: JSON.stringify({
                                                status: 'DRAFT',
                                                onboardingStep: 5,
                                                remarks: remarks.trim() || 'Onboarding documents approved by administrator.',
                                              }),
                                            });
                                            const data = await res.json();
                                            if (!res.ok) throw new Error(data.error || 'Failed to approve onboarding');
                                            setSuccess('Onboarding request approved! The merchant can proceed with loan evaluation.');
                                            setRemarks('');
                                            handleSelectApplication(selectedApp.id);
                                            fetchTabDetails();
                                          } catch (err: any) {
                                            setError(err.message);
                                          } finally {
                                            setTransitioning(false);
                                          }
                                        }}
                                        disabled={transitioning}
                                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-750 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 hover:scale-[1.02]"
                                      >
                                        <CheckCircle2 className="w-4 h-4" /> Approve Onboarding & Proceed
                                      </button>
                                    ) : (
                                      <div className="text-[11px] text-amber-600 font-bold bg-amber-50 border border-amber-200 px-4 py-2.5 rounded-xl w-full">
                                        ⚠️ To approve customer onboarding, all uploaded files (Aadhaar, Address Proof) must be marked as Approved.
                                      </div>
                                    )}

                                    <button
                                      onClick={() => handleStatusTransition('REJECTED')}
                                      disabled={transitioning || !remarks.trim()}
                                      className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-45 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
                                    >
                                      Reject Application Onboarding
                                    </button>
                                  </>
                                )}

                                {/* If under standard underwriting status */}
                                {selectedApp.status === 'UNDER_REVIEW' && selectedApp.onboardingStep !== 4 && (
                                  <>
                                    <button
                                      onClick={() => handleStatusTransition('APPROVED')}
                                      disabled={transitioning || !remarks.trim()}
                                      className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
                                    >
                                      Approve Application
                                    </button>
                                    <button
                                      onClick={() => handleStatusTransition('REJECTED')}
                                      disabled={transitioning || !remarks.trim()}
                                      className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
                                    >
                                      Reject Application
                                    </button>
                                  </>
                                )}

                                {selectedApp.status === 'MANDATE_ACTIVE' && (
                                  <button
                                    onClick={handleDisburseLoan}
                                    disabled={transitioning}
                                    className="px-5 py-3 bg-indigo-600 hover:bg-indigo-750 text-white text-xs font-extrabold uppercase rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-2"
                                  >
                                    <Play className="w-4 h-4 fill-white" /> Disburse Loan Payout (RazorpayX Simulation)
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>

                        </div>

                      </div>
                    ) : (
                      <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-sm text-slate-400 font-semibold">
                        <FolderOpen className="w-16 h-16 text-slate-300 mx-auto mb-3" />
                        Select an application from the queue to start underwriting.
                      </div>
                    )}
                  </div>

                </div>
              )}

              {/* TAB 7: LOAN PRODUCTS */}
              {activeTab === 'PRODUCTS' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  
                  {/* Product creation form */}
                  <div className="lg:col-span-1 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                    <h2 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-3 mb-4">
                      {productForm.id ? 'Modify Product Configuration' : 'Create New Loan Product'}
                    </h2>

                    <form onSubmit={handleProductSubmit} className="space-y-4 text-xs font-semibold text-slate-700">
                      <div>
                        <label className="block text-slate-505 mb-1">Product Name</label>
                        <input
                          type="text"
                          required
                          value={productForm.name}
                          onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-800 font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-505 mb-1">Description</label>
                        <textarea
                          value={productForm.description}
                          onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-800 font-semibold"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-slate-505 mb-1">Min Amount (₹)</label>
                          <input
                            type="number"
                            required
                            value={productForm.minAmount}
                            onChange={(e) => setProductForm({ ...productForm, minAmount: Number(e.target.value) })}
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-800"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-505 mb-1">Max Amount (₹)</label>
                          <input
                            type="number"
                            required
                            value={productForm.maxAmount}
                            onChange={(e) => setProductForm({ ...productForm, maxAmount: Number(e.target.value) })}
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-800"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-slate-505 mb-1">Interest Rate (% p.a.)</label>
                          <input
                            type="number"
                            step="0.01"
                            required
                            value={productForm.interestRate}
                            onChange={(e) => setProductForm({ ...productForm, interestRate: Number(e.target.value) })}
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-800"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-505 mb-1">Interest Type</label>
                          <select
                            value={productForm.interestType}
                            onChange={(e) => setProductForm({ ...productForm, interestType: e.target.value })}
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-800 font-semibold cursor-pointer"
                          >
                            <option value="REDUCING">Reducing Balance</option>
                            <option value="FLAT">Flat rate</option>
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-slate-505 mb-1">Min Tenure (Months)</label>
                          <input
                            type="number"
                            required
                            value={productForm.minTenure}
                            onChange={(e) => setProductForm({ ...productForm, minTenure: Number(e.target.value) })}
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-800"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-505 mb-1">Max Tenure (Months)</label>
                          <input
                            type="number"
                            required
                            value={productForm.maxTenure}
                            onChange={(e) => setProductForm({ ...productForm, maxTenure: Number(e.target.value) })}
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-800"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-slate-505 mb-1">Fees (₹)</label>
                          <input
                            type="number"
                            required
                            value={productForm.processingFee}
                            onChange={(e) => setProductForm({ ...productForm, processingFee: Number(e.target.value) })}
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-800"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-505 mb-1">Late Rate (%)</label>
                          <input
                            type="number"
                            step="0.1"
                            required
                            value={productForm.lateFeeRate}
                            onChange={(e) => setProductForm({ ...productForm, lateFeeRate: Number(e.target.value) })}
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-800"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-505 mb-1">Bounce (₹)</label>
                          <input
                            type="number"
                            required
                            value={productForm.bounceCharge}
                            onChange={(e) => setProductForm({ ...productForm, bounceCharge: Number(e.target.value) })}
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-800"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-3">
                        <div>
                          <label className="block text-slate-505 mb-1">Downpayment (%)</label>
                          <input
                            type="number"
                            required
                            value={productForm.downPaymentRate}
                            onChange={(e) => setProductForm({ ...productForm, downPaymentRate: Number(e.target.value) })}
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-800"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-505 mb-1">DBD Subvention (%)</label>
                          <input
                            type="number"
                            required
                            value={productForm.dbdRate}
                            onChange={(e) => setProductForm({ ...productForm, dbdRate: Number(e.target.value) })}
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-800"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2 py-2">
                        <input
                          type="checkbox"
                          id="prod-active"
                          checked={productForm.isActive}
                          onChange={(e) => setProductForm({ ...productForm, isActive: e.target.checked })}
                          className="w-4 h-4 rounded text-indigo-650"
                        />
                        <label htmlFor="prod-active" className="text-slate-700 font-bold">Product is active and open for lending</label>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-750 text-white font-bold rounded-xl shadow-md transition-all active:scale-95 text-xs uppercase"
                      >
                        {productForm.id ? 'Modify Product configuration' : 'Publish Product'}
                      </button>

                      {productForm.id && (
                        <button
                          type="button"
                          onClick={() => setProductForm({
                            id: '', name: '', description: '', minAmount: 10000, maxAmount: 100000,
                            interestRate: 12.00, interestType: 'REDUCING', minTenure: 3, maxTenure: 24,
                            processingFee: 1000, lateFeeRate: 2.00, bounceCharge: 350, isActive: true,
                            downPaymentRate: 20.00, dbdRate: 2.00, supportedFrequencies: ['MONTHLY'], insurancePlans: []
                          })}
                          className="w-full py-2 bg-slate-100 border border-slate-200 text-slate-600 font-bold rounded-xl"
                        >
                          Cancel modification
                        </button>
                      )}
                    </form>
                  </div>

                  {/* Product list */}
                  <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
                    <h2 className="text-sm font-extrabold text-slate-900">Active Product Registries</h2>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {products.map((prod) => (
                        <div key={prod.id} className="p-5 border border-slate-200 rounded-2xl flex flex-col justify-between space-y-4 shadow-sm bg-white hover:border-slate-350">
                          <div>
                            <div className="flex justify-between items-start">
                              <h3 className="font-extrabold text-slate-900 text-sm tracking-wide">{prod.name}</h3>
                              <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${
                                prod.isActive ? 'bg-emerald-50 text-emerald-600 border border-emerald-150' : 'bg-slate-100 text-slate-400'
                              }`}>
                                {prod.isActive ? 'Active' : 'Disabled'}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 font-semibold mt-1">{prod.description || 'No description provided'}</p>
                            
                            <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-slate-605 mt-4 border-t border-slate-100 pt-3">
                              <div>Min-Max: <span className="text-slate-800">₹{Number(prod.minAmount).toLocaleString()} - ₹{Number(prod.maxAmount).toLocaleString()}</span></div>
                              <div>Interest: <span className="text-slate-800">{Number(prod.interestRate)}% ({prod.interestType})</span></div>
                              <div>Tenures: <span className="text-slate-800">{prod.minTenure} - {prod.maxTenure} Months</span></div>
                              <div>Fees: <span className="text-slate-800">₹{Number(prod.processingFee).toLocaleString()}</span></div>
                            </div>
                          </div>

                          <button
                            onClick={() => handleEditProduct(prod)}
                            className="w-full py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all"
                          >
                            <Edit2 className="w-3.5 h-3.5" /> Modify configuration
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 8: ELIGIBILITY RULES */}
              {activeTab === 'RULES' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  
                  {/* Rule modifier Form */}
                  <div className="lg:col-span-1 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                    <h2 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-3 mb-4">
                      {editingRule ? `Modify Rule: ${editingRule.name}` : 'Select a Rule parameter to configure'}
                    </h2>

                    {editingRule ? (
                      <form onSubmit={handleRuleUpdate} className="space-y-4 text-xs font-semibold text-slate-700">
                        <div>
                          <label className="block text-slate-550 mb-1">Rule Name (Constant)</label>
                          <input
                            type="text"
                            disabled
                            value={editingRule.name}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-250 text-slate-400 rounded-xl cursor-not-allowed font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-550 mb-1">Description</label>
                          <textarea
                            value={editingRule.description || ''}
                            onChange={(e) => setEditingRule({ ...editingRule, description: e.target.value })}
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl"
                          />
                        </div>

                        <div className="border-t border-slate-200 pt-4 space-y-3">
                          <span className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-2">Rule constraints values</span>
                          
                          {editingRule.name === 'MIN_CIBIL_SCORE' && (
                            <div>
                              <label className="block text-slate-400 mb-1">Minimum CIBIL Score required</label>
                              <input
                                type="number"
                                required
                                value={editingRule.value.minScore}
                                onChange={(e) => handleRuleValueChange('minScore', Number(e.target.value))}
                                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-800 font-extrabold"
                              />
                            </div>
                          )}

                          {editingRule.name === 'BLACKLISTED_PINCODES' && (
                            <div>
                              <label className="block text-slate-400 mb-1">Blacklisted Pin Codes (Comma separated)</label>
                              <input
                                type="text"
                                required
                                value={editingRule.value.pincodes.join(', ')}
                                onChange={(e) => handleRuleValueChange('pincodes', e.target.value.split(',').map(s => s.trim()))}
                                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-800 font-extrabold"
                              />
                            </div>
                          )}

                          {editingRule.name === 'MAX_FOIR' && (
                            <div>
                              <label className="block text-slate-400 mb-1">Maximum FOIR Limit (%)</label>
                              <input
                                type="number"
                                required
                                value={editingRule.value.maxFoirPercent}
                                onChange={(e) => handleRuleValueChange('maxFoirPercent', Number(e.target.value))}
                                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-800 font-extrabold"
                              />
                            </div>
                          )}

                          {editingRule.name === 'MIN_AGE' && (
                            <div>
                              <label className="block text-slate-400 mb-1">Minimum Age Required</label>
                              <input
                                type="number"
                                required
                                value={editingRule.value.minAge}
                                onChange={(e) => handleRuleValueChange('minAge', Number(e.target.value))}
                                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-800 font-extrabold"
                              />
                            </div>
                          )}

                          {editingRule.name === 'MAX_AGE' && (
                            <div>
                              <label className="block text-slate-400 mb-1">Maximum Age Required</label>
                              <input
                                type="number"
                                required
                                value={editingRule.value.maxAge}
                                onChange={(e) => handleRuleValueChange('maxAge', Number(e.target.value))}
                                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-800 font-extrabold"
                              />
                            </div>
                          )}

                          {editingRule.name === 'MIN_INCOME' && (
                            <div>
                              <label className="block text-slate-400 mb-1">Minimum Monthly Income (₹)</label>
                              <input
                                type="number"
                                required
                                value={editingRule.value.minIncome}
                                onChange={(e) => handleRuleValueChange('minIncome', Number(e.target.value))}
                                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-800 font-extrabold"
                              />
                            </div>
                          )}

                          {editingRule.name === 'MIN_EMPLOYMENT_DURATION' && (
                            <div>
                              <label className="block text-slate-400 mb-1">Minimum Employment Duration (Months)</label>
                              <input
                                type="number"
                                required
                                value={editingRule.value.minDuration}
                                onChange={(e) => handleRuleValueChange('minDuration', Number(e.target.value))}
                                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-800 font-extrabold"
                              />
                            </div>
                          )}
                        </div>

                        <button
                          type="submit"
                          className="w-full py-3 bg-[#1E2B58] hover:bg-[#1a254c] text-white font-bold rounded-xl shadow-md transition-all text-xs uppercase"
                        >
                          Save rule changes
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingRule(null)}
                          className="w-full py-2 bg-slate-100 border border-slate-200 text-slate-600 font-bold rounded-xl"
                        >
                          Cancel
                        </button>
                      </form>
                    ) : (
                      <p className="text-slate-400 text-xs font-semibold text-center py-6">Please select a rule parameter to modify its limits.</p>
                    )}
                  </div>

                  {/* Rule list */}
                  <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
                    <h2 className="text-sm font-extrabold text-slate-900">Underwriting Eligibility parameters</h2>
                    
                    <div className="space-y-4">
                      {rules.map((rule) => (
                        <div key={rule.id} className="p-5 border border-slate-200 rounded-2xl flex justify-between items-start bg-white hover:border-slate-350 shadow-xs">
                          <div className="space-y-1 font-semibold">
                            <h3 className="font-extrabold text-slate-900 text-sm tracking-wide">{rule.name}</h3>
                            <p className="text-[11px] text-slate-550">{rule.description || 'No description'}</p>
                            <div className="text-[10px] font-bold text-slate-700 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-150 inline-block font-mono mt-3">
                              Constraint Value: {JSON.stringify(rule.value)}
                            </div>
                          </div>

                          <button
                            onClick={() => setEditingRule(rule)}
                            className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all whitespace-nowrap"
                          >
                            <Edit2 className="w-3.5 h-3.5" /> Adjust constraints
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 9: LOANS DISBURSEMENT */}
              {activeTab === 'LOANS_DISBURSEMENT' && (
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
                  {/* Top Header tab pill */}
                  <div className="flex justify-start items-center pb-2 border-b border-slate-100">
                    <button className="px-5 py-2 bg-[#EEF2F6] border border-slate-200 text-[#1E2B58] text-xs font-bold rounded-lg shadow-xs">
                      Disbursal
                    </button>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <div className="text-xs font-bold text-slate-650 flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
                      <span>Choose Data Range</span>
                      <select value={dateRange} onChange={(e) => setDateRange(e.target.value)} className="bg-transparent border-none focus:outline-none cursor-pointer font-black text-slate-800">
                        <option>Last Days</option>
                        <option>Last 7 Days</option>
                        <option>Last 30 Days</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-550 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
                        <span>Show</span>
                        <select 
                          value={entriesLimit} 
                          onChange={(e) => setEntriesLimit(Number(e.target.value))} 
                          className="bg-transparent border-none focus:outline-none font-extrabold cursor-pointer"
                        >
                          <option value={5}>5</option>
                          <option value={10}>10</option>
                          <option value={20}>20</option>
                          <option value={50}>50</option>
                        </select>
                        <span>entries</span>
                      </div>

                      <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                          type="text" 
                          placeholder="Search..." 
                          value={analyticsSearch}
                          onChange={(e) => setAnalyticsSearch(e.target.value)}
                          className="pl-9 pr-4 py-2 border border-slate-250 bg-white text-xs rounded-xl focus:border-indigo-500 focus:outline-none font-semibold text-slate-850"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs pt-2">
                    <button className="px-4 py-2 bg-slate-100 border border-slate-200 text-slate-700 font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-xs hover:bg-slate-200">
                      Export <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {applications.filter(a => a.status === 'DISBURSED').length === 0 ? (
                    <p className="text-slate-400 text-center py-12 text-xs font-bold bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">No loans disbursement records found.</p>
                  ) : (
                    <div className="overflow-x-auto border border-slate-150 rounded-2xl">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-700 bg-slate-50/70 font-black uppercase text-[10px] tracking-wider">
                            <th className="py-4 px-4 font-bold">Loan Id</th>
                            <th className="py-4 px-4 font-bold">Merchant</th>
                            <th className="py-4 px-4 font-bold">Name</th>
                            <th className="py-4 px-4 font-bold">Application Date</th>
                            <th className="py-4 px-4 font-bold">Last Action Date and Time</th>
                            <th className="py-4 px-4 font-bold">Region</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-150 font-bold text-slate-700">
                          {applications.filter(a => a.status === 'DISBURSED').filter(app => {
                            if (!analyticsSearch) return true;
                            const q = analyticsSearch.toLowerCase();
                            return (app.customer?.profile?.fullName?.toLowerCase().includes(q) || app.merchant?.profile?.fullName?.toLowerCase().includes(q) || app.id.includes(q));
                          }).slice(0, entriesLimit).map((app) => (
                            <tr key={app.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="py-4.5 px-4 font-mono text-indigo-650">ORO011C2321-{app.id.substring(0, 5)}</td>
                              <td className="py-4.5 px-4 text-slate-900 font-extrabold">{app.merchant?.profile?.bankName || app.merchant?.profile?.fullName || 'N/A'}</td>
                              <td className="py-4.5 px-4 text-slate-900 font-bold">{app.customer?.profile?.fullName || 'N/A'}</td>
                              <td className="py-4.5 px-4 text-slate-600 font-semibold">{new Date(app.createdAt).toLocaleDateString('en-GB')}</td>
                              <td className="py-4.5 px-4 text-slate-650 font-mono text-[11px] font-semibold">{new Date(app.updatedAt).toLocaleString('en-GB')}</td>
                              <td className="py-4.5 px-4 font-bold text-slate-650">Ck_jalore-1</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-4 border-t border-slate-100 text-xs text-slate-500 font-bold">
                    <span>Showing 1 to {Math.min(entriesLimit, applications.filter(a => a.status === 'DISBURSED').length)} of {applications.filter(a => a.status === 'DISBURSED').length} entries</span>
                    <div className="flex gap-1">
                      <button className="px-3.5 py-1.5 bg-[#1E2B58] text-white rounded-lg font-black">1</button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 9_2: LOANS (CONSUMER LOANS DIRECTORY) */}
              {activeTab === 'LOANS' && (
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
                  <div>
                    <h2 className="text-lg font-black text-slate-900 leading-tight">Consumer Loans</h2>
                  </div>

                  {/* Pills Navigation */}
                  <div className="flex gap-2 border-b border-slate-150 pb-3">
                    {[
                      { id: 'PENDING', label: 'Pending' },
                      { id: 'IN_PROCESS', label: 'In-Process' },
                      { id: 'REJECTED', label: 'Rejected' },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setLoansSubTab(tab.id as any)}
                        className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                          loansSubTab === tab.id
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-xs'
                            : 'bg-white text-slate-550 border border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <div className="text-xs font-bold text-slate-650 flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
                      <span>Choose Data Range</span>
                      <select value={dateRange} onChange={(e) => setDateRange(e.target.value)} className="bg-transparent border-none focus:outline-none cursor-pointer font-black text-slate-800">
                        <option>Last 7 Days</option>
                        <option>Last 30 Days</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-550 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
                        <span>Show</span>
                        <select 
                          value={entriesLimit} 
                          onChange={(e) => setEntriesLimit(Number(e.target.value))} 
                          className="bg-transparent border-none focus:outline-none font-extrabold cursor-pointer"
                        >
                          <option value={5}>5</option>
                          <option value={10}>10</option>
                          <option value={20}>20</option>
                          <option value={50}>50</option>
                        </select>
                        <span>entries</span>
                      </div>

                      <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                          type="text" 
                          placeholder="Search..." 
                          value={analyticsSearch}
                          onChange={(e) => setAnalyticsSearch(e.target.value)}
                          className="pl-9 pr-4 py-2 border border-slate-250 bg-white text-xs rounded-xl focus:border-indigo-500 focus:outline-none font-semibold text-slate-850"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs pt-2">
                    <button className="px-4 py-2 bg-slate-100 border border-slate-200 text-slate-700 font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-xs hover:bg-slate-200">
                      Export <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {(() => {
                    const filteredApps = applications.filter(app => {
                      if (loansSubTab === 'PENDING') {
                        return ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'DOCUMENT_PENDING'].includes(app.status);
                      } else if (loansSubTab === 'IN_PROCESS') {
                        return ['APPROVED', 'MANDATE_PENDING', 'MANDATE_ACTIVE', 'DISBURSED'].includes(app.status);
                      } else {
                        return app.status === 'REJECTED';
                      }
                    }).filter(app => {
                      if (!analyticsSearch) return true;
                      const q = analyticsSearch.toLowerCase();
                      return (app.customer?.profile?.fullName?.toLowerCase().includes(q) || app.merchant?.profile?.fullName?.toLowerCase().includes(q) || app.customer?.phoneNumber?.includes(q) || app.customer?.profile?.panNumber?.toLowerCase().includes(q));
                    });

                    if (filteredApps.length === 0) {
                      return <p className="text-slate-400 text-center py-12 text-xs font-bold bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">No consumer loans records found for this section.</p>;
                    }

                    return (
                      <div className="overflow-x-auto border border-slate-150 rounded-2xl animate-fadeIn">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-slate-200 text-slate-700 bg-slate-50/70 font-black uppercase text-[10px] tracking-wider">
                              <th className="py-4 px-4 font-bold">PAN</th>
                              <th className="py-4 px-4 font-bold">Merchant</th>
                              <th className="py-4 px-4 font-bold">Name</th>
                              <th className="py-4 px-4 font-bold">Mobile</th>
                              <th className="py-4 px-4 font-bold">Application Date</th>
                              <th className="py-4 px-4 font-bold">Last Action Date and Time</th>
                              <th className="py-4 px-4 font-bold">Region</th>
                              <th className="py-4 px-4 font-bold">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-150 font-bold text-slate-700">
                            {filteredApps.slice(0, entriesLimit).map((app) => (
                              <tr key={app.id} onClick={() => handleSelectApplication(app.id)} className="hover:bg-slate-50/50 cursor-pointer transition-colors">
                                <td className="py-4.5 px-4 font-mono uppercase text-slate-650">{app.customer?.profile?.panNumber || 'NA'}</td>
                                <td className="py-4.5 px-4 text-slate-900 font-extrabold">{app.merchant?.profile?.bankName || app.merchant?.profile?.fullName || 'N/A'}</td>
                                <td className="py-4.5 px-4 text-slate-900 font-bold">{app.customer?.profile?.fullName || 'N/A'}</td>
                                <td className="py-4.5 px-4 font-mono text-slate-600">{app.customer?.phoneNumber || 'N/A'}</td>
                                <td className="py-4.5 px-4 text-slate-600 font-semibold">{new Date(app.createdAt).toLocaleDateString('en-GB')}</td>
                                <td className="py-4.5 px-4 text-slate-650 font-mono text-[11px] font-semibold">{new Date(app.updatedAt).toLocaleString('en-GB')}</td>
                                <td className="py-4.5 px-4 font-bold text-slate-650">Ck_jalore-1</td>
                                <td className="py-4.5 px-4">
                                  <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase border tracking-wider inline-block ${
                                    app.status === 'UNDER_REVIEW' ? 'bg-indigo-50 text-indigo-650 border-indigo-100' :
                                    app.status === 'REJECTED' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                    app.status === 'APPROVED' || app.status === 'MANDATE_ACTIVE' || app.status === 'DISBURSED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                    'bg-amber-50 text-amber-600 border-amber-100'
                                  }`}>
                                    {app.status === 'UNDER_REVIEW' ? 'Under Review' : app.status === 'APPROVED' ? 'Collateral Data Added' : app.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* TAB 10: REDESIGNED DISBURSAL TRACKER */}
              {activeTab === 'DISBURSAL_TRACKER' && (
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6 animate-fadeIn">
                  {/* Step Indicators at the top */}
                  <div className="grid grid-cols-3 gap-4 pb-4 border-b border-slate-100">
                    {[
                      { id: 'DOCUMENT_UPLOAD', step: 1, label: 'DOCUMENT UPLOAD', count: applications.filter(a => (a.status === 'APPROVED' || a.status === 'DOCUMENT_PENDING') && !a.invoiceUploaded).length },
                      { id: 'VERIFICATION', step: 2, label: 'VERIFICATION', count: applications.filter(a => a.status === 'UNDER_REVIEW' && a.invoiceUploaded).length },
                      { id: 'DISBURSAL', step: 3, label: 'DISBURSAL', count: applications.filter(a => a.status === 'MANDATE_ACTIVE' || a.status === 'DISBURSED').length },
                    ].map((step) => (
                      <button
                        key={step.id}
                        onClick={() => setDisbursalSubTab(step.id as any)}
                        className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                          disbursalSubTab === step.id
                            ? 'bg-indigo-50 border-indigo-300 text-[#1E2B58] font-black shadow-sm'
                            : 'bg-[#F8FAFC] border-slate-200 text-slate-450 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                            disbursalSubTab === step.id ? 'bg-[#1E2B58] text-white' : 'bg-slate-300 text-slate-650'
                          }`}>
                            {step.step}
                          </span>
                          <span className="text-[10px] font-black uppercase tracking-wider">{step.label}</span>
                        </div>
                        <span className="w-5 h-5 rounded-full bg-slate-200/80 text-slate-700 text-[10px] font-black flex items-center justify-center">
                          {step.count}
                        </span>
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <div className="flex items-center gap-3">
                      <div className="text-xs font-bold text-slate-600 flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
                        <span>DATE RANGE</span>
                        <select value={dateRange} onChange={(e) => setDateRange(e.target.value)} className="bg-transparent border-none focus:outline-none cursor-pointer font-black text-slate-800">
                          <option>Last 7 Days</option>
                          <option>Last 30 Days</option>
                        </select>
                      </div>
                      <button className="px-4 py-2 bg-[#1E2B58] hover:bg-[#1a254c] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all h-[38px]">
                        <Search className="w-3.5 h-3.5" /> Find
                      </button>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-550 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
                        <span>Show</span>
                        <select 
                          value={entriesLimit} 
                          onChange={(e) => setEntriesLimit(Number(e.target.value))} 
                          className="bg-transparent border-none focus:outline-none font-extrabold cursor-pointer"
                        >
                          <option value={5}>5</option>
                          <option value={10}>10</option>
                          <option value={20}>20</option>
                          <option value={50}>50</option>
                        </select>
                        <span>entries</span>
                      </div>

                      <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                          type="text" 
                          placeholder="Search..." 
                          value={analyticsSearch}
                          onChange={(e) => setAnalyticsSearch(e.target.value)}
                          className="pl-9 pr-4 py-2 border border-slate-250 bg-white text-xs rounded-xl focus:border-indigo-500 focus:outline-none font-semibold text-slate-850"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs pt-2">
                    <button className="px-4 py-2 bg-slate-100 border border-slate-200 text-slate-700 font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-xs hover:bg-slate-200">
                      Export <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {(() => {
                    const disbursalApps = applications.filter(app => {
                      if (disbursalSubTab === 'DOCUMENT_UPLOAD') {
                        return (app.status === 'APPROVED' || app.status === 'DOCUMENT_PENDING') && !app.invoiceUploaded;
                      } else if (disbursalSubTab === 'VERIFICATION') {
                        return app.status === 'UNDER_REVIEW' && app.invoiceUploaded;
                      } else {
                        return app.status === 'MANDATE_ACTIVE' || app.status === 'DISBURSED';
                      }
                    }).filter(app => {
                      if (!analyticsSearch) return true;
                      const q = analyticsSearch.toLowerCase();
                      return (app.customer?.profile?.fullName?.toLowerCase().includes(q) || app.merchant?.profile?.fullName?.toLowerCase().includes(q) || app.id.includes(q));
                    });

                    if (disbursalApps.length === 0) {
                      return <p className="text-slate-400 text-center py-12 text-xs font-bold bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">No application records found for this section.</p>;
                    }

                    return (
                      <div className="overflow-x-auto border border-slate-150 rounded-2xl animate-fadeIn">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-slate-200 text-slate-705 bg-slate-50/70 font-black uppercase text-[10px] tracking-wider">
                              <th className="py-4 px-4 font-bold">Loan Id</th>
                              <th className="py-4 px-4 font-bold">Merchant</th>
                              <th className="py-4 px-4 font-bold">Name</th>
                              <th className="py-4 px-4 font-bold">Application Date</th>
                              <th className="py-4 px-4 font-bold">Status</th>
                              <th className="py-4 px-4 font-bold">Upload Document</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-150 font-bold text-slate-700">
                            {disbursalApps.slice(0, entriesLimit).map((app) => (
                              <tr key={app.id} className="hover:bg-slate-50/50 transition-colors">
                                <td 
                                  className="py-4.5 px-4 font-mono text-indigo-650 cursor-pointer hover:underline"
                                  onClick={() => handleSelectApplication(app.id)}
                                >
                                  ORO011C2204-{app.id.substring(0, 5)}
                                </td>
                                <td className="py-4.5 px-4 text-slate-900 font-extrabold">{app.merchant?.profile?.fullName || 'N/A'}</td>
                                <td className="py-4.5 px-4 text-slate-900 font-bold">{app.customer?.profile?.fullName || 'N/A'}</td>
                                <td className="py-4.5 px-4 text-slate-650 font-semibold">{new Date(app.createdAt).toLocaleDateString('en-GB')}</td>
                                <td className="py-4.5 px-4">
                                  <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase bg-blue-50 text-blue-700 border border-blue-100">
                                    {app.status === 'APPROVED' ? 'Application status updated to-do-downloaded' : app.status}
                                  </span>
                                </td>
                                <td className="py-4.5 px-4">
                                  {disbursalSubTab === 'DOCUMENT_UPLOAD' && (
                                    <button
                                      onClick={() => {
                                        setInvoiceModalApp(app);
                                        setInvoiceForm({
                                          invoiceNo: app.invoiceNo || '',
                                          invoiceCost: Number(app.productValue || app.requestedAmount) + Number(app.productInsurance || 1500),
                                          imeiNumber: app.imeiNumber || '',
                                          productSerialNo: app.productSerialNo || '',
                                        });
                                        setShowInvoiceModal(true);
                                      }}
                                      className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-250 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-xs"
                                    >
                                      <FileUp className="w-3.5 h-3.5 animate-pulse" /> Upload Invoice
                                    </button>
                                  )}
                                  {disbursalSubTab === 'VERIFICATION' && (
                                    <button
                                      onClick={() => handleSelectApplication(app.id)}
                                      className="px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-xs font-bold rounded-xl transition-all shadow-xs"
                                    >
                                      Verify Invoice & Details
                                    </button>
                                  )}
                                  {disbursalSubTab === 'DISBURSAL' && (
                                    app.status === 'DISBURSED' ? (
                                      <span className="text-[11px] text-emerald-600 font-black uppercase tracking-wider flex items-center gap-1">
                                        ✓ Disbursed
                                      </span>
                                    ) : (
                                      <button
                                        onClick={() => {
                                          setSelectedApp(app);
                                          handleDisburseLoan();
                                        }}
                                        className="px-4 py-2 bg-[#1E2B58] hover:bg-[#1a254c] text-white text-xs font-bold rounded-xl transition-all shadow-xs"
                                      >
                                        Disburse Payout
                                      </button>
                                    )
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* TAB 11: PORTFOLIO REPORTS */}
              {activeTab === 'REPORTS' && (
                <div className="space-y-8">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-4">
                    <div>
                      <h2 className="text-lg font-black text-slate-900 leading-tight">Portfolio Analytics Reports</h2>
                      <p className="text-slate-500 text-xs">Analyze recovery rates, store subvention, and merchant default exposures.</p>
                    </div>
                    
                    <div className="flex gap-2">
                      {['PORTFOLIO', 'MERCHANT_VOLUME', 'DELINQUENCY'].map((type) => (
                        <button
                          key={type}
                          onClick={() => setReportType(type)}
                          className={`px-4 py-2 border text-xs font-bold rounded-xl transition-all ${
                            reportType === type
                              ? 'bg-[#1E2B58] text-white border-[#1E2B58] shadow-sm'
                              : 'bg-white border-slate-250 text-slate-650 hover:bg-slate-50'
                          }`}
                        >
                          {type.replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>

                  {reportData ? (
                    <div className="space-y-6">
                      {reportType === 'PORTFOLIO' && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                          <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm text-center">
                            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block">Total Disbursement Amount</span>
                            <span className="text-3xl font-black text-slate-900 mt-2 block">₹{Number(reportData.totalDisbursedAmount || 0).toLocaleString()}</span>
                            <span className="text-[10px] text-emerald-600 font-bold block mt-3 uppercase">Net payouts simulated</span>
                          </div>
                          <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm text-center">
                            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block">Outstanding Receivables</span>
                            <span className="text-3xl font-black text-rose-600 mt-2 block">₹{Number(reportData.outstandingReceivables || 0).toLocaleString()}</span>
                            <span className="text-[10px] text-slate-500 font-bold block mt-3 uppercase">Principal + interest balances</span>
                          </div>
                          <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm text-center">
                            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block">Total Active Contracts</span>
                            <span className="text-3xl font-black text-slate-900 mt-2 block">{reportData.activeLoansCount || 0}</span>
                            <span className="text-[10px] text-indigo-650 font-bold block mt-3 uppercase">Total consumer lending profiles</span>
                          </div>
                        </div>
                      )}

                      {reportType === 'MERCHANT_VOLUME' && (
                        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                          <h3 className="text-md font-extrabold text-slate-900">Partner Merchant Volume stats</h3>
                          <div className="overflow-x-auto border border-slate-150 rounded-2xl">
                            <table className="w-full text-left text-xs border-collapse">
                              <thead>
                                <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase bg-slate-50/50">
                                  <th className="py-3 px-4">Merchant Account ID</th>
                                  <th className="py-3 px-4">Applications Submitted</th>
                                  <th className="py-3 px-4">Disbursement Value</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 font-bold">
                                {reportData.merchantSummaries?.map((item: any) => (
                                  <tr key={item.merchantId} className="hover:bg-slate-50/50">
                                    <td className="py-3.5 px-4 font-mono text-slate-650">{item.merchantId}</td>
                                    <td className="py-3.5 px-4 text-slate-800">{item.applicationsCount}</td>
                                    <td className="py-3.5 px-4 text-slate-900 font-black">₹{Number(item.disbursementSum).toLocaleString()}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {reportType === 'DELINQUENCY' && (
                        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                          <h3 className="text-md font-extrabold text-slate-900">PAR Delinquency report (Overdue installments)</h3>
                          <div className="overflow-x-auto border border-slate-150 rounded-2xl">
                            <table className="w-full text-left text-xs border-collapse">
                              <thead>
                                <tr className="border-b border-slate-200 text-slate-550 font-bold uppercase bg-slate-50/50">
                                  <th className="py-3 px-4">Customer Phone</th>
                                  <th className="py-3 px-4">EMI Installment No.</th>
                                  <th className="py-3 px-4">Scheduled Due Date</th>
                                  <th className="py-3 px-4">Principal Due</th>
                                  <th className="py-3 px-4">Overdue Late / Penalty fees</th>
                                  <th className="py-3 px-4">Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 font-bold">
                                {reportData.delinquentSchedules?.map((item: any) => (
                                  <tr key={item.id} className="hover:bg-slate-50/50">
                                    <td className="py-3.5 px-4 text-slate-900 font-black">{item.loan.application.customer.phoneNumber}</td>
                                    <td className="py-3.5 px-4 text-slate-600">EMI #{item.installmentNo}</td>
                                    <td className="py-3.5 px-4 text-slate-700">{new Date(item.dueDate).toLocaleDateString()}</td>
                                    <td className="py-3.5 px-4 text-slate-900 font-black">₹{Number(item.amountDue).toLocaleString()}</td>
                                    <td className="py-3.5 px-4 text-rose-600 font-black">₹{(Number(item.penaltyAccrued) + Number(item.lateFeeAccrued)).toLocaleString()}</td>
                                    <td className="py-3.5 px-4 font-extrabold text-rose-600">OVERDUE</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-slate-400 text-xs font-bold text-center py-10">Select a report filter criteria to retrieve data.</p>
                  )}
                </div>
              )}

              {/* TAB 12: SECURITY AUDIT LOGS */}
              {activeTab === 'AUDIT_LOGS' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-black text-slate-900 leading-tight">Security Audit Logs</h2>
                    <p className="text-slate-505 text-xs">Immutable system event log for verification checks.</p>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                    <div className="overflow-x-auto border border-slate-150 rounded-2xl">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-600 bg-slate-50/50 font-black uppercase">
                            <th className="py-3 px-4">Timestamp</th>
                            <th className="py-3 px-4">Staff ID</th>
                            <th className="py-3 px-4">Operation Action</th>
                            <th className="py-3 px-4">Entity</th>
                            <th className="py-3 px-4">IP Address</th>
                            <th className="py-3 px-4">State Details</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-150 font-bold text-slate-700">
                          {auditLogs.map((log) => (
                            <tr key={log.id} className="hover:bg-slate-50/50">
                              <td className="py-3.5 px-4 text-slate-500 font-normal">{new Date(log.createdAt).toLocaleString()}</td>
                              <td className="py-3.5 px-4 font-mono text-[10px] text-slate-650">{log.userId ? log.userId.substring(0,8) : 'SYSTEM'}</td>
                              <td className="py-3.5 px-4 text-slate-900 font-extrabold uppercase">{log.action}</td>
                              <td className="py-3.5 px-4 text-slate-700 font-semibold">{log.entity} ({log.entityId.substring(0,6)})</td>
                              <td className="py-3.5 px-4 text-slate-500 font-mono font-normal">{log.ipAddress || '127.0.0.1'}</td>
                              <td className="py-3.5 px-4 font-mono text-[10px] text-slate-400 truncate max-w-xs" title={JSON.stringify(log.newValue)}>
                                {JSON.stringify(log.newValue)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      </main>

      {/* Upload Invoice & Collateral Modal */}
      {showInvoiceModal && invoiceModalApp && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-55 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 w-full max-w-lg space-y-6 animate-scaleUp text-slate-705">
            <div className="flex justify-between items-center border-b border-slate-150 pb-3">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <FileUp className="w-5 h-5 text-indigo-650" />
                Upload Invoice & Collateral Scans
              </h3>
              <button 
                onClick={() => { setShowInvoiceModal(false); setInvoiceModalApp(null); }}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-slate-500 text-xs">
              Disbursement requires verification of invoice matching product cost + insurance values, and collateral IMEI/Serial number image scans.
            </p>

            <form onSubmit={handleUploadInvoiceAdmin} className="space-y-4 text-xs font-bold text-slate-700">
              <div>
                <label className="block text-slate-500 mb-1 uppercase tracking-wide">Invoice Number</label>
                <input 
                  type="text" 
                  required
                  value={invoiceForm.invoiceNo}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, invoiceNo: e.target.value })}
                  placeholder="e.g. INV-98765"
                  className="w-full px-4 py-2.5 bg-white border border-slate-350 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1 uppercase tracking-wide">Invoice Cost (inc. GST)</label>
                <input 
                  type="number" 
                  required
                  value={invoiceForm.invoiceCost}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, invoiceCost: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 bg-white border border-slate-355 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1 uppercase tracking-wide">IMEI Number (Key Collateral)</label>
                <input 
                  type="text" 
                  required
                  value={invoiceForm.imeiNumber}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, imeiNumber: e.target.value })}
                  placeholder="e.g. 861234567890123"
                  className="w-full px-4 py-2.5 bg-white border border-slate-355 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1 uppercase tracking-wide">Product Serial Number</label>
                <input 
                  type="text" 
                  required
                  value={invoiceForm.productSerialNo}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, productSerialNo: e.target.value })}
                  placeholder="e.g. SER-ABCD-1234"
                  className="w-full px-4 py-2.5 bg-white border border-slate-355 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1 uppercase">1. Invoice Image Scan</label>
                <input 
                  type="file" 
                  required
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setInvoiceFile(file);
                  }}
                  className="w-full p-2 border border-slate-300 bg-white rounded-xl text-[11px]"
                />
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setShowInvoiceModal(false); setInvoiceModalApp(null); }}
                  className="px-4 py-2.5 border border-slate-250 bg-white hover:bg-slate-50 rounded-xl text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadingInvoice}
                  className="px-5 py-2.5 bg-[#1E2B58] hover:bg-[#1a254c] disabled:bg-slate-305 text-white font-bold rounded-xl shadow-md flex items-center gap-1.5"
                >
                  {uploadingInvoice ? 'Uploading...' : 'Submit Invoice Details'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
