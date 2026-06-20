'use client';

import React, { useState, useEffect, useRef } from 'react';
import { AuthUser } from '@/app/providers';
import DashboardLayout from './DashboardLayout';
import { 
  FolderOpen, ShieldAlert, CheckCircle, FileText, XCircle, 
  Trash2, Plus, Edit2, User, Phone, Mail, Landmark, 
  Layers, DollarSign, Calendar, MessageSquare, AlertCircle, 
  Settings, Database, Award, Image, ChevronRight, LayoutDashboard,
  ShieldCheck, FileSpreadsheet, Lock, RefreshCw, ChevronDown, Users,
  Search, UploadCloud, FileUp, Check, Play, LogOut, CheckCircle2,
  Activity, Bell
} from 'lucide-react';

const formatDateAndDay = (dateInput: string | Date | null | undefined) => {
  if (!dateInput) return 'N/A';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return 'N/A';
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayName = days[d.getDay()];
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year} (${dayName})`;
};

export default function AdminDashboard({ user }: { user: AuthUser }) {
  const [activeTab, setActiveTab] = useState<
    'ANALYTICS' | 'USER_AGENT' | 'USER_SYSTEM' | 'CLIENT_RECORDS' | 'CLIENT_UPLOAD' | 
    'APPLICATIONS' | 'PRODUCTS' | 'RULES' | 'AUDIT_LOGS' | 'REPORTS' | 
    'LOANS' | 'DISBURSAL_TRACKER' | 'LOANS_DISBURSEMENT' | 'MESSAGES' | 'CREDENTIALS' | 'LIVE_NOTIFICATIONS'
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

  // Live Operations Feed states
  const [liveNotifications, setLiveNotifications] = useState<any[]>([]);
  const [liveAudits, setLiveAudits] = useState<any[]>([]);

  // Comments / Communication states
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentRecipient, setCommentRecipient] = useState<'CUSTOMER' | 'MERCHANT'>('CUSTOMER');
  const [commentTab, setCommentTab] = useState<'INTERNAL' | 'CHAT'>('INTERNAL');

  const commentsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
    return () => clearTimeout(timer);
  }, [comments]);

  // Credentials Vault states
  const [adminCredentials, setAdminCredentials] = useState<any[]>([]);
  const [loadingAdminCredentials, setLoadingAdminCredentials] = useState(false);
  const [resendingAdminCredentials, setResendingAdminCredentials] = useState<Record<string, boolean>>({});
  const [adminCredentialsSearch, setAdminCredentialsSearch] = useState('');
  const [adminCredentialsTab, setAdminCredentialsTab] = useState<'MERCHANT' | 'CUSTOMER'>('MERCHANT');

  // Password change modal states
  const [showPasswordChangeModal, setShowPasswordChangeModal] = useState(false);
  const [passwordChangeUserId, setPasswordChangeUserId] = useState('');
  const [passwordChangeName, setPasswordChangeName] = useState('');
  const [passwordChangeNewVal, setPasswordChangeNewVal] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // Manual EMI schedule edit states & handlers
  const [selectedEmiSchedule, setSelectedEmiSchedule] = useState<any | null>(null);
  const [showEmiEditModal, setShowEmiEditModal] = useState(false);
  const [emiForm, setEmiForm] = useState({
    status: 'PENDING',
    amountPaid: 0,
    penaltyAccrued: 0,
    lateFeeAccrued: 0,
    amountDue: 0,
    paidAt: '',
  });
  const [updatingEmi, setUpdatingEmi] = useState(false);

  const handleOpenEmiEdit = (sch: any) => {
    setSelectedEmiSchedule(sch);
    setEmiForm({
      status: sch.status,
      amountPaid: Number(sch.amountPaid),
      penaltyAccrued: Number(sch.penaltyAccrued),
      lateFeeAccrued: Number(sch.lateFeeAccrued),
      amountDue: Number(sch.amountDue),
      paidAt: sch.paidAt ? new Date(sch.paidAt).toISOString().split('T')[0] : '',
    });
    setShowEmiEditModal(true);
  };

  const handleUpdateEmiSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmiSchedule) return;
    setUpdatingEmi(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/admin/loans/schedules', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduleId: selectedEmiSchedule.id,
          status: emiForm.status,
          amountPaid: Number(emiForm.amountPaid),
          penaltyAccrued: Number(emiForm.penaltyAccrued),
          lateFeeAccrued: Number(emiForm.lateFeeAccrued),
          amountDue: Number(emiForm.amountDue),
          paidAt: emiForm.paidAt ? new Date(emiForm.paidAt).toISOString() : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update EMI installment');

      setSuccess('EMI repayment schedule ledger updated successfully!');
      setShowEmiEditModal(false);
      setSelectedEmiSchedule(null);
      await handleSelectApplication(selectedApp.id);
      fetchTabDetails();
    } catch (err: any) {
      setError(err.message || 'Error updating EMI');
    } finally {
      setUpdatingEmi(false);
    }
  };

  // Chat isolations
  const [chatChannel, setChatChannel] = useState<'CUSTOMER_SUPPORT' | 'STORE_ESCALATION' | 'DIRECT_SUPPORT'>('CUSTOMER_SUPPORT');

  // Create Pre-Approved Merchant states
  const [isCreateMerchantOpen, setIsCreateMerchantOpen] = useState(false);
  const [submittingMerchant, setSubmittingMerchant] = useState(false);
  const [merchantForm, setMerchantForm] = useState({
    email: '',
    phoneNumber: '',
    password: '',
    fullName: '',
    dob: '1990-01-01',
    panNumber: '',
    aadhaarNumber: '',
    shopName: '',
    gstNumber: '',
    bankAccountNo: '',
    bankIfsc: '',
    bankName: '',
    addressLine1: '',
    addressLine2: '',
    pincode: '',
    city: '',
    state: '',
  });

  const fetchLiveLogs = async () => {
    try {
      const res = await fetch('/api/admin/notifications');
      if (res.ok) {
        const data = await res.json();
        setLiveNotifications(data.notifications || []);
        setLiveAudits(data.auditLogs || []);
      }
    } catch (err) {
      console.error('Failed to fetch live notifications:', err);
    }
  };

  const fetchComments = async (appId: string) => {
    try {
      const res = await fetch(`/api/comments?applicationId=${appId}`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments || []);
      }
    } catch (e) {
      console.error('Failed to fetch comments:', e);
    }
  };

  const handlePostComment = async (appId: string) => {
    if (!commentText.trim()) return;
    if (activeTab === 'MESSAGES' && chatChannel === 'CUSTOMER_SUPPORT') return; // Read-only

    setSubmittingComment(true);
    try {
      let isToAdmin = false;
      let isToMerchant = false;
      let receiverId = null;

      if (activeTab === 'MESSAGES') {
        isToAdmin = chatChannel === 'STORE_ESCALATION';
        isToMerchant = chatChannel === 'STORE_ESCALATION';
        receiverId = chatChannel === 'STORE_ESCALATION' ? selectedApp?.merchantId : selectedApp?.customerId;
      } else {
        isToAdmin = false;
        isToMerchant = commentRecipient === 'MERCHANT';
        receiverId = commentRecipient === 'CUSTOMER' ? selectedApp?.customerId : selectedApp?.merchantId;
      }

      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: appId,
          text: commentText.trim(),
          isToAdmin,
          isToMerchant,
          receiverId,
        }),
      });

      if (res.ok) {
        setCommentText('');
        fetchComments(appId);
      } else {
        const d = await res.json();
        setError(d.error || 'Failed to post comment');
      }
    } catch (e) {
      console.error('Failed to post comment:', e);
      setError('Failed to send comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  // Poll live feed
  useEffect(() => {
    if (activeTab === 'ANALYTICS' || activeTab === 'LIVE_NOTIFICATIONS') {
      fetchLiveLogs();
      const interval = setInterval(() => {
        if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
          fetchLiveLogs();
        }
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  // Poll comments for selected application
  useEffect(() => {
    if (!selectedApp) return;
    fetchComments(selectedApp.id);
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        fetchComments(selectedApp.id);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [selectedApp]);

  // Search/Filters
  const [analyticsSearch, setAnalyticsSearch] = useState('');
  const [entriesLimit, setEntriesLimit] = useState(10);
  const [agentSearch, setAgentSearch] = useState('');
  const [systemUserSearch, setSystemUserSearch] = useState('');
  const [dateRange, setDateRange] = useState('-SELECT-');
  const [chatSearchQuery, setChatSearchQuery] = useState('');

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

  // Merchant Onboarding Approval States
  const [showMerchantModal, setShowMerchantModal] = useState(false);
  const [selectedMerchant, setSelectedMerchant] = useState<any | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [verifyingMerchant, setVerifyingMerchant] = useState(false);

  // Onboarding feedback comments timeline states
  const [onboardingTimeline, setOnboardingTimeline] = useState<any[]>([]);
  const [loadingTimeline, setLoadingTimeline] = useState(false);
  const [onboardingCommentText, setOnboardingCommentText] = useState('');
  const [submittingOnboardingComment, setSubmittingOnboardingComment] = useState(false);

  const onboardingEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      onboardingEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
    return () => clearTimeout(timer);
  }, [onboardingTimeline]);

  const fetchOnboardingTimeline = async (merchantId: string) => {
    setLoadingTimeline(true);
    try {
      const res = await fetch(`/api/merchant/onboarding-comments?merchantId=${merchantId}`);
      if (res.ok) {
        const data = await res.json();
        setOnboardingTimeline(data.timeline || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTimeline(false);
    }
  };

  const handlePostOnboardingComment = async (merchantId: string) => {
    if (!onboardingCommentText.trim()) return;
    setSubmittingOnboardingComment(true);
    try {
      const res = await fetch('/api/merchant/onboarding-comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merchantId, text: onboardingCommentText.trim() }),
      });
      if (res.ok) {
        setOnboardingCommentText('');
        fetchOnboardingTimeline(merchantId);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingOnboardingComment(false);
    }
  };

  const handleReviewMerchant = (merchant: any) => {
    setSelectedMerchant(merchant);
    setRejectionReason('');
    setOnboardingCommentText('');
    setShowMerchantModal(true);
    fetchOnboardingTimeline(merchant.id);
  };

  const handleVerifyMerchantStatus = async (status: 'APPROVED' | 'REJECTED') => {
    if (!selectedMerchant) return;
    setError('');
    setSuccess('');
    setVerifyingMerchant(true);

    try {
      const res = await fetch(`/api/admin/users/${selectedMerchant.id}/verify-merchant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, rejectionReason }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update merchant status');

      setSuccess(`Merchant has been successfully ${status.toLowerCase()}!`);
      setShowMerchantModal(false);
      setSelectedMerchant(null);
      fetchTabDetails(); // Refresh list of users
    } catch (err: any) {
      setError(err.message);
    } finally {
      setVerifyingMerchant(false);
    }
  };

  const fetchTabDetails = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const [appRes, prodRes, ruleRes, userRes, auditRes, reportRes] = await Promise.all([
        fetch(appFilter === 'ALL' ? '/api/applications' : `/api/applications?status=${appFilter}`),
        fetch('/api/admin/products'),
        fetch('/api/admin/rules'),
        fetch('/api/admin/users'),
        fetch('/api/reports?type=AUDIT_LOG'),
        fetch(`/api/reports?type=${reportType}`)
      ]);

      const [appData, prodData, ruleData, userData, auditData, reportData] = await Promise.all([
        appRes.ok ? appRes.json() : null,
        prodRes.ok ? prodRes.json() : null,
        ruleRes.ok ? ruleRes.json() : null,
        userRes.ok ? userRes.json() : null,
        auditRes.ok ? auditRes.json() : null,
        reportRes.ok ? reportRes.json() : null,
      ]);

      if (appData) setApplications(appData.applications);
      if (prodData) setProducts(prodData.products);
      if (ruleData) setRules(ruleData.rules);
      if (userData) setUsers(userData.users);
      if (auditData) setAuditLogs(auditData.data.logs);
      if (reportData) setReportData(reportData.data);
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

  const fetchAdminCredentials = async () => {
    setLoadingAdminCredentials(true);
    try {
      const res = await fetch('/api/admin/credentials');
      const data = await res.json();
      if (res.ok && data.success) {
        setAdminCredentials(data.credentials || []);
      }
    } catch (err) {
      console.error('Failed to fetch admin credentials:', err);
    } finally {
      setLoadingAdminCredentials(false);
    }
  };

  const handleAdminResendCredentials = async (userId: string) => {
    setResendingAdminCredentials(prev => ({ ...prev, [userId]: true }));
    try {
      const res = await fetch('/api/admin/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess('Credentials email sent successfully!');
      } else {
        setError(data.error || 'Failed to send credentials email');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to send credentials email');
    } finally {
      setResendingAdminCredentials(prev => ({ ...prev, [userId]: false }));
    }
  };

  const handleChangePassword = async () => {
    if (!passwordChangeNewVal.trim()) return;
    setUpdatingPassword(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: passwordChangeUserId,
          password: passwordChangeNewVal.trim()
        })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(`Password for ${passwordChangeName} updated successfully!`);
        setShowPasswordChangeModal(false);
        setPasswordChangeNewVal('');
        fetchAdminCredentials();
        fetchTabDetails();
      } else {
        setError(data.error || 'Failed to change password');
      }
    } catch (err: any) {
      console.error(err);
      setError('Failed to change password');
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleToggleBan = async (userId: string, isBanned: boolean, name: string) => {
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          isBanned
        })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(`User ${name} has been ${isBanned ? 'banned' : 'unbanned'} successfully!`);
        fetchAdminCredentials();
        fetchTabDetails();
      } else {
        setError(data.error || 'Failed to update user status');
      }
    } catch (err: any) {
      console.error(err);
      setError('Failed to update user status');
    }
  };

  const handleCreateMerchant = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingMerchant(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/admin/users/create-merchant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...merchantForm,
          addressLine2: merchantForm.addressLine2 || undefined,
          password: merchantForm.password || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess('Merchant account created and pre-approved successfully!');
        setIsCreateMerchantOpen(false);
        setMerchantForm({
          email: '',
          phoneNumber: '',
          password: '',
          fullName: '',
          dob: '1990-01-01',
          panNumber: '',
          aadhaarNumber: '',
          shopName: '',
          gstNumber: '',
          bankAccountNo: '',
          bankIfsc: '',
          bankName: '',
          addressLine1: '',
          addressLine2: '',
          pincode: '',
          city: '',
          state: '',
        });
        fetchTabDetails();
      } else {
        setError(data.error || 'Failed to create merchant');
      }
    } catch (err: any) {
      console.error(err);
      setError('Failed to create merchant');
    } finally {
      setSubmittingMerchant(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'CREDENTIALS') {
      fetchAdminCredentials();
    }
  }, [activeTab]);

  useEffect(() => {
    const handleSearch = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { text, tab, notifText } = customEvent.detail;
      setAnalyticsSearch(text);
      
      if (tab === 'DISBURSAL_TRACKER') {
        if (notifText?.includes('DISBURSAL')) {
          setDisbursalSubTab('DISBURSAL');
        } else if (notifText?.includes('VERIFICATION')) {
          setDisbursalSubTab('VERIFICATION');
        } else if (notifText?.includes('UNDER_REVIEW')) {
          setDisbursalSubTab('DOCUMENT_UPLOAD');
        }
      } else if (tab === 'LOANS') {
        if (notifText?.includes('UNDER_REVIEW') || notifText?.includes('VERIFICATION')) {
          setLoansSubTab('PENDING');
        } else if (notifText?.includes('DISBURSAL')) {
          setLoansSubTab('IN_PROCESS');
        }
      }
    };
    window.addEventListener('notification-search', handleSearch);
    return () => window.removeEventListener('notification-search', handleSearch);
  }, []);

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

  // Filter Conversations
  const filteredChatApps = applications.filter((app) => {
    if (!chatSearchQuery.trim()) return true;
    const query = chatSearchQuery.toLowerCase();
    const customerName = (app.customer?.profile?.fullName || '').toLowerCase();
    const merchantShop = (app.merchant?.profile?.shopName || '').toLowerCase();
    const appIdStr = app.id.toLowerCase();
    return customerName.includes(query) || merchantShop.includes(query) || appIdStr.includes(query);
  });

  return (
    <DashboardLayout
      user={user}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      error={error}
      success={success}
    >

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
                              <th className="py-4 px-4 font-bold text-[10px]">Shop Name</th>
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
                                  {app.merchant?.profile?.shopName || app.merchant?.profile?.fullName || 'Vankal Mata Mobile And Electri'}
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

                  {/* Real-time System Operations Monitor */}
                  <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
                    <div className="flex justify-between items-center border-b border-slate-150 pb-3">
                      <div>
                        <h3 className="font-extrabold text-[#1E2B58] text-base flex items-center gap-2">
                          <Activity className="w-5 h-5 text-rose-500 animate-pulse" />
                          Live Operations Monitor & Notification Log
                        </h3>
                        <p className="text-slate-405 text-xs mt-0.5">Real-time application execution and security audit logs across the lending system.</p>
                      </div>
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-600 border border-emerald-100 rounded-xl text-[10px] font-black uppercase">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping"></span> Live Monitoring
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-xs font-semibold">
                      {/* Real-time System Notifications */}
                      <div className="space-y-4">
                        <h4 className="font-black text-indigo-950 text-xs uppercase tracking-wider flex items-center justify-between">
                          <span>Global System Notifications Dispatch</span>
                          <span className="text-[10px] text-slate-400 font-bold">Latest 40 Records</span>
                        </h4>
                        <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1 bg-slate-50 border border-slate-200 p-4 rounded-2xl">
                          {liveNotifications.length === 0 ? (
                            <p className="text-slate-400 text-xs font-bold text-center py-10">No system notifications dispatched.</p>
                          ) : (
                            liveNotifications.map((notif) => (
                              <div key={notif.id} className="bg-white border border-slate-150 p-3 rounded-xl shadow-2xs flex flex-col space-y-1 hover:border-indigo-205 transition-all">
                                <div className="flex justify-between text-[9px] text-slate-400 font-black">
                                  <span>Recipient: {notif.recipient} ({notif.channel})</span>
                                  <span>{new Date(notif.createdAt).toLocaleTimeString()}</span>
                                </div>
                                <p className="text-slate-800 font-bold leading-normal text-[11px]">{notif.content.replace(/ORO/g, 'OYSTER')}</p>
                                <div className="flex justify-between items-center pt-1 text-[8px] font-black uppercase tracking-wider border-t border-slate-50 text-slate-450">
                                  <span>User Role: {notif.user?.role || 'N/A'}</span>
                                  <span className={notif.status === 'SENT' ? 'text-emerald-650' : 'text-rose-650'}>{notif.status}</span>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      {/* Real-time Security Audit Logs */}
                      <div className="space-y-4">
                        <h4 className="font-black text-indigo-950 text-xs uppercase tracking-wider flex items-center justify-between">
                          <span>Security Audit Trail & User Actions</span>
                          <span className="text-[10px] text-slate-400 font-bold">Latest 40 Records</span>
                        </h4>
                        <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1 bg-slate-50 border border-slate-200 p-4 rounded-2xl">
                          {liveAudits.length === 0 ? (
                            <p className="text-slate-400 text-xs font-bold text-center py-10">No audit log events recorded.</p>
                          ) : (
                            liveAudits.map((log) => (
                              <div key={log.id} className="bg-white border border-slate-150 p-3 rounded-xl shadow-2xs flex flex-col space-y-1 hover:border-indigo-205 transition-all">
                                <div className="flex justify-between text-[9px] text-slate-400 font-black">
                                  <span>IP: {log.ipAddress || '127.0.0.1'}</span>
                                  <span>{new Date(log.createdAt).toLocaleTimeString()}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className="px-2 py-0.5 rounded bg-indigo-50 border border-indigo-200 text-indigo-705 text-[8px] font-black uppercase tracking-widest">{log.action}</span>
                                  <span className="text-[10px] font-bold text-slate-500">on {log.entity}</span>
                                </div>
                                <p className="text-slate-705 text-[10px] font-bold mt-1">Performed by: <span className="text-slate-900 font-extrabold">{log.user?.profile?.fullName || log.user?.email || 'System / Guest'}</span> ({log.user?.role || 'GUEST'})</p>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Underwriting Queue Insights */}
                  <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
                    <h3 className="font-extrabold text-[#1E2B58] text-base flex items-center gap-2">
                      <Layers className="w-5 h-5 text-indigo-550" />
                      Underwriting Queue Insights
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {applications.filter(a => ['UNDER_REVIEW', 'SUBMITTED', 'DOCUMENT_PENDING'].includes(a.status)).length === 0 ? (
                        <p className="text-slate-400 text-xs font-bold col-span-full py-4 text-center">No applications currently in underwriting queue.</p>
                      ) : (
                        applications.filter(a => ['UNDER_REVIEW', 'SUBMITTED', 'DOCUMENT_PENDING'].includes(a.status)).slice(0, 6).map((app) => (
                          <div
                            key={app.id}
                            onClick={() => handleSelectApplication(app.id)}
                            className="border border-slate-200 hover:border-indigo-400 rounded-2xl p-5 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all cursor-pointer space-y-3 relative overflow-hidden"
                          >
                            <div className="absolute top-0 right-0 h-1.5 w-12 bg-indigo-505"></div>
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-black text-slate-900 text-xs">{app.customer?.profile?.fullName || 'Prospect Customer'}</h4>
                                <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">{app.customer?.phoneNumber}</span>
                              </div>
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border tracking-wider ${
                                app.status === 'UNDER_REVIEW' ? 'bg-indigo-50 text-indigo-650 border-indigo-100' :
                                app.status === 'DOCUMENT_PENDING' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                'bg-slate-100 text-slate-650 border-slate-200'
                              }`}>
                                {app.status}
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-xs font-bold pt-1 border-t border-slate-150 text-slate-500">
                              <div>
                                <span className="text-[9px] text-slate-400 uppercase block">Requested Limit</span>
                                <span className="text-slate-900 font-extrabold">₹{Number(app.productValue || app.requestedAmount).toLocaleString()}</span>
                              </div>
                              <div>
                                <span className="text-[9px] text-slate-400 uppercase block">Merchant Store</span>
                                <span className="text-slate-700 truncate block max-w-[120px]">{app.merchant?.profile?.fullName || 'Self Registered'}</span>
                              </div>
                            </div>
                            <div className="text-[10px] text-slate-400 font-bold flex justify-between items-center bg-indigo-50/30 p-2 rounded-xl border border-indigo-100/30">
                              <span>Onboarding Step: {app.onboardingStep}/10</span>
                              <span className="text-indigo-605 flex items-center gap-0.5">Review Files <ChevronRight className="w-3.5 h-3.5" /></span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Merchant Approvals Hub */}
                  <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
                    <h3 className="font-extrabold text-[#1E2B58] text-base flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-indigo-550" />
                      Merchant Onboarding & Approvals Hub
                    </h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Pending Approvals */}
                      <div className="space-y-4">
                        <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider text-slate-400 flex items-center justify-between">
                          <span>Pending Approval Requests</span>
                          <span className="px-2 py-0.5 bg-amber-500/10 text-amber-600 rounded-full text-[10px] font-black">{users.filter(u => u.role === 'MERCHANT' && u.merchantStatus === 'PENDING_APPROVAL').length} Requests</span>
                        </h4>
                        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                          {users.filter(u => u.role === 'MERCHANT' && u.merchantStatus === 'PENDING_APPROVAL').length === 0 ? (
                            <p className="text-slate-405 text-xs font-bold bg-slate-50 border border-slate-200 rounded-2xl py-6 text-center">No pending merchant approval requests.</p>
                          ) : (
                            users.filter(u => u.role === 'MERCHANT' && u.merchantStatus === 'PENDING_APPROVAL').map((item) => (
                              <div key={item.id} className="border border-slate-200 bg-white p-4.5 rounded-2xl flex justify-between items-center shadow-xs hover:border-slate-350 transition-all">
                                <div className="space-y-1">
                                  <span className="font-black text-slate-900 text-xs block">{item.profile?.fullName || 'Merchant Partner'}</span>
                                  <span className="text-[10px] text-slate-500 block font-mono">{item.phoneNumber} • {item.email || 'No email'}</span>
                                  {item.profile?.shopName && (
                                    <span className="text-[10px] font-bold text-slate-400 block">Store: {item.profile.shopName}</span>
                                  )}
                                </div>
                                <button
                                  onClick={() => handleReviewMerchant(item)}
                                  className="px-3.5 py-2 bg-[#1E2B58] hover:bg-[#1a254c] text-white text-[10px] font-black rounded-xl shadow-xs transition-colors flex items-center gap-1 uppercase tracking-wider"
                                >
                                  Review Request
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      {/* Past Merchant Logs */}
                      <div className="space-y-4">
                        <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider text-slate-400 flex items-center justify-between">
                          <span>Past Approvals / Rejections</span>
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-650 rounded-full text-[10px] font-black">{users.filter(u => u.role === 'MERCHANT' && ['APPROVED', 'REJECTED'].includes(u.merchantStatus || '')).length} Logged</span>
                        </h4>
                        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                          {users.filter(u => u.role === 'MERCHANT' && ['APPROVED', 'REJECTED'].includes(u.merchantStatus || '')).length === 0 ? (
                            <p className="text-slate-405 text-xs font-bold bg-slate-50 border border-slate-200 rounded-2xl py-6 text-center">No past merchant onboarding decisions recorded.</p>
                          ) : (
                            users.filter(u => u.role === 'MERCHANT' && ['APPROVED', 'REJECTED'].includes(u.merchantStatus || '')).map((item) => (
                              <div key={item.id} className="border border-slate-150 bg-slate-50/50 p-4.5 rounded-2xl flex justify-between items-center">
                                <div className="space-y-1">
                                  <span className="font-black text-slate-900 text-xs block">{item.profile?.fullName || 'Merchant Partner'}</span>
                                  <span className="text-[10px] text-slate-500 block font-mono">{item.phoneNumber}</span>
                                  {item.profile?.shopName && (
                                    <span className="text-[10px] font-bold text-slate-400 block">Store: {item.profile.shopName}</span>
                                  )}
                                </div>
                                <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                                  item.merchantStatus === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                                }`}>
                                  {item.merchantStatus}
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Loan Products Directory */}
                  <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
                    <h3 className="font-extrabold text-[#1E2B58] text-base flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-indigo-550" />
                      Active Loan Products
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {products.length === 0 ? (
                        <p className="text-slate-405 text-xs font-bold col-span-full py-4 text-center">No products configured.</p>
                      ) : (
                        products.map((prod) => (
                          <div key={prod.id} className="border border-slate-200 p-5 rounded-2xl bg-white hover:shadow-md transition-all relative overflow-hidden flex flex-col justify-between space-y-4">
                            <div className="space-y-2">
                              <div className="flex justify-between items-start">
                                <span className="font-black text-slate-900 text-xs uppercase tracking-wide block">{prod.name}</span>
                                <span className={`px-2 py-0.5 rounded text-[8px] font-black border uppercase tracking-wider ${
                                  prod.isActive ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-100 text-slate-500 border-slate-200'
                                }`}>
                                  {prod.isActive ? 'Active' : 'Inactive'}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 leading-normal">{prod.description || 'No description available.'}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-[11px] font-bold text-slate-650 bg-slate-50 p-3.5 rounded-xl border border-slate-150">
                              <div>Interest Rate: <span className="text-slate-900 font-extrabold">{Number(prod.interestRate)}% ({prod.interestType})</span></div>
                              <div>Tenure Range: <span className="text-slate-900 font-extrabold">{prod.minTenure}-{prod.maxTenure} mo</span></div>
                              <div>Limit Range: <span className="text-slate-900 font-extrabold">₹{Number(prod.minAmount).toLocaleString()}-₹{Number(prod.maxAmount).toLocaleString()}</span></div>
                              <div>Processing Fee: <span className="text-slate-900 font-extrabold">₹{Number(prod.processingFee).toLocaleString()}</span></div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* System Users & Merchant Customer Relations Directory */}
                  <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
                    <h3 className="font-extrabold text-[#1E2B58] text-base flex items-center gap-2">
                      <Users className="w-5 h-5 text-indigo-550" />
                      User & Merchant-Customer Relations Directory
                    </h3>
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                      {/* Merchant - Customer relations mapping */}
                      <div className="space-y-4">
                        <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider text-slate-400">Merchants & Linked Customers</h4>
                        <div className="space-y-4 max-h-[450px] overflow-y-auto pr-1">
                          {users.filter(u => u.role === 'MERCHANT').length === 0 ? (
                            <p className="text-slate-405 text-xs font-bold bg-slate-50 border border-slate-200 rounded-2xl py-6 text-center">No merchants found in database.</p>
                          ) : (
                            users.filter(u => u.role === 'MERCHANT').map((m) => {
                              // Find customers linked to this merchant via applications
                              const linkedCustomers = applications
                                .filter(app => app.merchantId === m.id)
                                .map(app => app.customer)
                                .filter((v, i, a) => v && a.findIndex(t => t && t.id === v.id) === i); // unique customers

                              return (
                                <div key={m.id} className="border border-slate-200 p-4.5 rounded-2xl bg-slate-50/50 space-y-3">
                                  <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                                    <div>
                                      <span className="font-black text-indigo-950 text-xs block">{m.profile?.fullName || m.email || 'Merchant Store'}</span>
                                      <span className="text-[10px] text-slate-400 block font-mono">Store: {m.profile?.shopName || 'N/A'}</span>
                                    </div>
                                    <span className="px-2 py-0.5 rounded bg-indigo-50 border border-indigo-200 text-indigo-750 text-[9px] font-black">
                                      {linkedCustomers.length} Customers Linked
                                    </span>
                                  </div>
                                  <div className="space-y-2">
                                    {linkedCustomers.length === 0 ? (
                                      <p className="text-slate-405 text-[10px] font-semibold">No customers registered under this store yet.</p>
                                    ) : (
                                      linkedCustomers.map((c: any) => (
                                        <div key={c.id} className="bg-white border border-slate-150 p-2.5 rounded-xl flex justify-between items-center text-[10px] font-bold text-slate-700 shadow-2xs">
                                          <div>
                                            <span className="text-slate-900 block font-extrabold">{c.profile?.fullName || 'Customer User'}</span>
                                            <span className="text-slate-450 text-[9px] block font-mono">{c.phoneNumber}</span>
                                          </div>
                                          <span className="text-slate-400 font-normal">Joined Store: {new Date(c.profile?.createdAt || m.createdAt).toLocaleDateString()}</span>
                                        </div>
                                      ))
                                    )}
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>

                      {/* All Users with detailed profile, timing, documents checklist, recent updates */}
                      <div className="space-y-4">
                        <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider text-slate-400">All User Profiles & KYC Documents</h4>
                        <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
                          {users.map((item) => (
                            <div key={item.id} className="border border-slate-200 p-4.5 rounded-2xl bg-white space-y-3 shadow-2xs hover:border-indigo-200 transition-all">
                              <div className="flex justify-between items-start border-b border-slate-100 pb-2">
                                <div>
                                  <span className="font-extrabold text-slate-900 text-xs block">{item.profile?.fullName || 'User Profile (Pending KYC)'}</span>
                                  <span className="text-[9px] text-slate-400 block font-mono">{item.role} • {item.phoneNumber}</span>
                                </div>
                                <span className="text-[9px] text-slate-400 font-bold block text-right">
                                  Joined: {new Date(item.createdAt).toLocaleDateString()}<br/>
                                  Updated: {new Date(item.updatedAt || item.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              {/* Details */}
                              {item.profile && (
                                <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-slate-550 bg-slate-50 p-2.5 rounded-xl border border-slate-150">
                                  <div>PAN: <span className="text-slate-800 font-mono font-extrabold uppercase">{item.profile.panNumber || 'N/A'}</span></div>
                                  <div>Aadhaar: <span className="text-slate-800 font-mono font-extrabold">{item.profile.aadhaarNumber || 'N/A'}</span></div>
                                  <div>Monthly Income: <span className="text-slate-800 font-extrabold">₹{Number(item.profile.monthlyIncome || 0).toLocaleString()}</span></div>
                                  <div>Bank Account: <span className="text-slate-800 font-mono font-extrabold">{item.profile.bankAccountNo || 'N/A'}</span></div>
                                </div>
                              )}
                              {/* Documents Checklist */}
                              <div className="space-y-1">
                                <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">Uploaded KYC Verification Documents</span>
                                {(!item.profile?.documents || item.profile.documents.length === 0) ? (
                                  <span className="text-[10px] text-slate-400 font-bold block">No KYC documents uploaded.</span>
                                ) : (
                                  <div className="flex flex-wrap gap-1.5">
                                    {item.profile.documents.map((doc: any) => (
                                      <a
                                        key={doc.id}
                                        href={`/uploads/${doc.s3Url}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1 px-2 py-1 border border-slate-200 bg-slate-50 hover:bg-slate-100 rounded-lg text-[9px] font-extrabold text-slate-650 transition-colors"
                                      >
                                        <FileText className="w-2.5 h-2.5 text-indigo-500" />
                                        <span>{doc.type}</span>
                                        <span className={`px-1 py-0.2 rounded text-[7px] font-black uppercase ${
                                          doc.status === 'VERIFIED' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                          doc.status === 'REJECTED' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                          'bg-amber-50 text-amber-600 border-amber-105'
                                        }`}>
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
                      </div>
                    </div>
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
                      <button
                        onClick={() => setIsCreateMerchantOpen(true)}
                        className="px-4 py-2 bg-[#1E2B58] hover:bg-[#1a254c] text-white text-xs font-bold rounded-xl shadow-sm transition-all"
                      >
                        Create Pre-Approved Merchant
                      </button>

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
                            <th className="py-4 px-4 font-bold text-[10px]">Status / Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-150 font-bold text-slate-700">
                          {agentUsers.map((agent) => (
                            <tr key={agent.id} className="hover:bg-slate-50/50">
                              <td className="py-4 px-4 font-mono text-indigo-600">C{agent.id.substring(0,4).toUpperCase()}</td>
                              <td className="py-4 px-4 text-slate-900 font-extrabold">{agent.profile?.fullName || 'Raju Ram'}</td>
                              <td className="py-4 px-4 font-mono">{agent.phoneNumber}</td>
                              <td className="py-4 px-4 text-slate-605 font-normal">{agent.email || 'N/A'}</td>
                              <td className="py-4 px-4 text-slate-900 font-bold">{agent.profile?.bankName || `${agent.profile?.fullName || 'Agent'} Store`}</td>
                              <td className="py-4 px-4">
                                <div className="flex items-center gap-2">
                                  <span className={`px-2.5 py-0.5 rounded text-[9px] font-black border uppercase tracking-wider ${
                                    agent.merchantStatus === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                    agent.merchantStatus === 'PENDING_APPROVAL' ? 'bg-amber-50 text-amber-700 border-amber-105 animate-pulse' :
                                    agent.merchantStatus === 'REJECTED' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                    'bg-slate-100 text-slate-500 border-slate-200'
                                  }`}>
                                    {agent.merchantStatus || 'NOT_STARTED'}
                                  </span>
                                  {agent.profile && (
                                    <button 
                                      onClick={() => handleReviewMerchant(agent)}
                                      className="px-2 py-1 bg-[#1E2B58] hover:bg-[#1a254c] text-white text-[9px] font-black rounded-lg transition-colors"
                                    >
                                      Review
                                    </button>
                                  )}
                                </div>
                              </td>
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
                            <th className="py-4 px-4 font-bold text-[10px] text-right font-black uppercase tracking-wide">Actions</th>
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
                              <td className="py-4 px-4 text-right space-x-2 whitespace-nowrap">
                                <button
                                  onClick={() => {
                                    setPasswordChangeUserId(item.id);
                                    setPasswordChangeName(item.profile?.fullName || item.phoneNumber);
                                    setPasswordChangeNewVal('');
                                    setShowPasswordChangeModal(true);
                                  }}
                                  className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white text-[9px] font-black rounded-lg transition-colors uppercase tracking-wide shadow-2xs"
                                >
                                  Change Password
                                </button>
                                <button
                                  onClick={() => handleToggleBan(item.id, !item.isBanned, item.profile?.fullName || item.phoneNumber)}
                                  className={`px-2.5 py-1 text-white text-[9px] font-black rounded-lg transition-colors uppercase tracking-wide shadow-2xs ${
                                    item.isBanned 
                                      ? 'bg-emerald-500 hover:bg-emerald-600' 
                                      : 'bg-rose-500 hover:bg-rose-600'
                                  }`}
                                >
                                  {item.isBanned ? 'Unban' : 'Ban'}
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

                          {/* EMI Repayment Schedule Ledger */}
                          {selectedApp.loan && (
                            <div className="space-y-4 border-t border-slate-150 pt-4">
                              <div className="flex justify-between items-center">
                                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wide">EMI Repayment Schedule Ledger</h3>
                                <span className="px-2.5 py-0.5 rounded text-[9px] font-black bg-emerald-50 text-emerald-600 border border-emerald-100 uppercase">
                                  Loan: {selectedApp.loan.status}
                                </span>
                              </div>

                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[10px] font-bold bg-slate-50 p-3.5 rounded-xl border border-slate-150 text-slate-700">
                                <div>
                                  <span className="text-slate-400 block uppercase text-[8px] font-extrabold">Total Disbursed</span>
                                  <span className="text-slate-800 font-extrabold text-xs">₹{Number(selectedApp.loan.disbursedAmount).toLocaleString()}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 block uppercase text-[8px] font-extrabold">Outstanding dues</span>
                                  <span className="text-rose-600 font-extrabold text-xs">₹{Number(selectedApp.loan.outstandingAmount).toLocaleString()}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 block uppercase text-[8px] font-extrabold">Interest Paid</span>
                                  <span className="text-slate-800 font-extrabold text-xs">₹{Number(selectedApp.loan.interestPaid).toLocaleString()}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 block uppercase text-[8px] font-extrabold">Principal Paid</span>
                                  <span className="text-slate-800 font-extrabold text-xs">₹{Number(selectedApp.loan.principalPaid).toLocaleString()}</span>
                                </div>
                              </div>

                              <div className="overflow-x-auto border border-slate-150 rounded-xl">
                                <table className="w-full text-left text-[11px] border-collapse bg-white">
                                  <thead>
                                    <tr className="border-b border-slate-200 text-slate-550 font-bold bg-slate-50/50 uppercase">
                                      <th className="py-2.5 px-3">Inst #</th>
                                      <th className="py-2.5 px-3">Due Date</th>
                                      <th className="py-2.5 px-3">Principal</th>
                                      <th className="py-2.5 px-3">Interest</th>
                                      <th className="py-2.5 px-3">Penalty / Late</th>
                                      <th className="py-2.5 px-3">Total Due</th>
                                      <th className="py-2.5 px-3">Paid Date</th>
                                      <th className="py-2.5 px-3">Status</th>
                                      <th className="py-2.5 px-3 text-center">Action</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                                    {selectedApp.loan.schedules?.map((sch: any) => (
                                      <tr key={sch.id} className="hover:bg-slate-50/50">
                                        <td className="py-2.5 px-3 font-bold text-slate-900">EMI #{sch.installmentNo}</td>
                                        <td className="py-2.5 px-3 text-slate-700">{formatDateAndDay(sch.dueDate)}</td>
                                        <td className="py-2.5 px-3 text-slate-650">₹{Number(sch.principal).toLocaleString()}</td>
                                        <td className="py-2.5 px-3 text-slate-650">₹{Number(sch.interest).toLocaleString()}</td>
                                        <td className="py-2.5 px-3 text-rose-600">₹{(Number(sch.penaltyAccrued) + Number(sch.lateFeeAccrued)).toLocaleString()}</td>
                                        <td className="py-2.5 px-3 font-bold text-slate-900">₹{Number(sch.amountDue).toLocaleString()}</td>
                                        <td className="py-2.5 px-3 text-slate-500">{sch.paidAt ? new Date(sch.paidAt).toLocaleDateString() : '-'}</td>
                                        <td className="py-2.5 px-3">
                                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                            sch.status === 'PAID' 
                                              ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                                              : sch.status === 'OVERDUE' 
                                              ? 'bg-rose-50 text-rose-600 border border-rose-100 animate-pulse' 
                                              : 'bg-slate-100 text-slate-500 border border-slate-200'
                                          }`}>
                                            {sch.status}
                                          </span>
                                        </td>
                                        <td className="py-2 px-3 text-center">
                                          <button
                                            onClick={() => handleOpenEmiEdit(sch)}
                                            className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-650 text-[10px] font-bold rounded-lg border border-indigo-150 transition-all cursor-pointer"
                                          >
                                            Edit
                                          </button>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}

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
                          <div className="space-y-4 border-t border-slate-150 pt-4">
                            <div className="flex border-b border-slate-150 pb-2 gap-4">
                              <button
                                onClick={() => setCommentTab('INTERNAL')}
                                className={`text-xs font-extrabold pb-1.5 transition-all ${
                                  commentTab === 'INTERNAL'
                                    ? 'border-b-2 border-indigo-600 text-indigo-750'
                                    : 'text-slate-400 hover:text-slate-600'
                                }`}
                              >
                                🔒 Internal Underwriter Notes
                              </button>
                              <button
                                onClick={() => setCommentTab('CHAT')}
                                className={`text-xs font-extrabold pb-1.5 transition-all ${
                                  commentTab === 'CHAT'
                                    ? 'border-b-2 border-indigo-600 text-indigo-750'
                                    : 'text-slate-400 hover:text-slate-600'
                                }`}
                              >
                                💬 Public Comments Chat ({comments.length})
                              </button>
                            </div>
                            
                            {commentTab === 'INTERNAL' ? (
                              <div className="space-y-3">
                                <div className="space-y-2 max-h-48 overflow-y-auto bg-slate-50 border border-slate-200 p-4 rounded-xl text-xs font-medium">
                                  {selectedApp.notes?.length === 0 ? (
                                    <p className="text-slate-400">No internal notes written for this application.</p>
                                  ) : (
                                    selectedApp.notes?.map((n: any) => (
                                      <div key={n.id} className="pb-2 border-b border-slate-200/60 last:border-0 last:pb-0">
                                        <div className="flex justify-between text-[10px] text-slate-400 font-bold mb-0.5">
                                          <span>{n.author.email} ({n.author.role})</span>
                                          <span>{new Date(n.createdAt).toLocaleString()}</span>
                                        </div>
                                        <p className="text-slate-705 font-semibold">{n.content}</p>
                                      </div>
                                    ))
                                  )}
                                </div>

                                <form onSubmit={handleAddNote} className="flex gap-2">
                                  <input
                                    type="text"
                                    required
                                    placeholder="Type internal underwriters note..."
                                    value={newNote}
                                    onChange={(e) => setNewNote(e.target.value)}
                                    className="flex-1 px-4 py-2.5 border border-slate-300 bg-white text-xs rounded-xl focus:border-indigo-500 focus:outline-none font-semibold text-slate-800"
                                  />
                                  <button
                                    type="submit"
                                    className="px-4 py-2.5 bg-slate-900 hover:bg-slate-950 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
                                  >
                                    Save Note
                                  </button>
                                </form>
                              </div>
                            ) : (
                              <div className="space-y-4">
                                <div className="space-y-3 max-h-56 overflow-y-auto bg-slate-50 border border-slate-200 p-4 rounded-xl text-xs font-semibold">
                                  {comments.length === 0 ? (
                                    <p className="text-slate-400 text-center py-6">No public comments or messages posted yet.</p>
                                  ) : (
                                    comments.map((c: any) => {
                                      const isAdminSender = ['ADMIN', 'SUPER_ADMIN'].includes(c.sender.role);
                                      return (
                                        <div 
                                          key={c.id} 
                                          className={`flex flex-col max-w-[90%] sm:max-w-[80%] rounded-2xl p-3 shadow-3xs relative overflow-hidden ${
                                            isAdminSender 
                                              ? 'bg-indigo-600 text-white ml-auto' 
                                              : 'bg-white text-slate-800 mr-auto border border-slate-200'
                                          }`}
                                        >
                                          <div className={`flex justify-between items-center gap-4 text-[9px] font-black uppercase mb-1 ${
                                            isAdminSender ? 'text-indigo-200' : 'text-slate-400'
                                          }`}>
                                            <span>
                                              {c.sender.profile?.fullName || c.sender.email || 'User'} ({c.sender.role})
                                            </span>
                                            <span>
                                              {new Date(c.createdAt).toLocaleTimeString()}
                                            </span>
                                          </div>
                                          <p className={`leading-relaxed text-[11px] font-semibold text-left break-words whitespace-pre-wrap ${isAdminSender ? 'text-white' : 'text-slate-800'}`}>{c.text}</p>
                                          <div className={`text-[8px] font-black uppercase mt-1 text-right block ${
                                            isAdminSender ? 'text-indigo-200' : 'text-slate-400'
                                          }`}>
                                            {c.isToAdmin ? '🔒 Escalate to Admin' : c.isToMerchant ? '🤝 To Merchant' : '👥 General Message'}
                                          </div>
                                        </div>
                                      );
                                    })
                                  )}
                                  <div ref={commentsEndRef} />
                                </div>

                                <div className="flex flex-col sm:flex-row gap-3">
                                  <div className="flex items-center gap-2 text-xs font-bold text-slate-650 bg-white border border-slate-250 px-3 py-1.5 rounded-xl">
                                    <span>Send To:</span>
                                    <select
                                      value={commentRecipient}
                                      onChange={(e) => setCommentRecipient(e.target.value as any)}
                                      className="bg-transparent border-none focus:outline-none font-black text-slate-850 cursor-pointer"
                                    >
                                      <option value="CUSTOMER">Customer ({selectedApp?.customer?.profile?.fullName || 'User'})</option>
                                      {selectedApp?.merchantId && (
                                        <option value="MERCHANT">Merchant Store ({selectedApp?.merchant?.profile?.fullName || 'Store'})</option>
                                      )}
                                    </select>
                                  </div>

                                  <div className="flex flex-1 gap-2">
                                    <input
                                      type="text"
                                      placeholder="Type comment message here..."
                                      value={commentText}
                                      onChange={(e) => setCommentText(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          e.preventDefault();
                                          handlePostComment(selectedApp.id);
                                        }
                                      }}
                                      className="flex-1 min-w-0 px-4 py-2 border border-slate-300 bg-white text-xs rounded-xl focus:border-indigo-500 focus:outline-none font-semibold text-slate-800"
                                    />
                                    <button
                                      onClick={() => handlePostComment(selectedApp.id)}
                                      disabled={submittingComment || !commentText.trim()}
                                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
                                    >
                                      Send
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
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

              {/* TAB 12.5: LIVE NOTIFICATIONS FOR ADMIN */}
              {activeTab === 'LIVE_NOTIFICATIONS' && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-base font-extrabold text-slate-900 uppercase tracking-wider">Live System Notifications</h2>
                      <p className="text-slate-500 text-xs mt-0.5 font-bold">Real-time alerts, uploads, requests, and events across the entire lending application.</p>
                    </div>
                    <button
                      onClick={fetchLiveLogs}
                      className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Refresh Feed
                    </button>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                    {liveNotifications.length === 0 ? (
                      <div className="text-center py-20 text-slate-400 font-bold flex flex-col items-center justify-center gap-2 border border-dashed border-slate-200 rounded-2xl">
                        <Bell className="w-10 h-10 text-slate-300 animate-pulse" />
                        <span>No system notifications dispatched.</span>
                      </div>
                    ) : (
                      <div className="space-y-3.5 max-h-[600px] overflow-y-auto pr-1">
                        {liveNotifications.map((notif) => (
                          <div 
                            key={notif.id} 
                            className={`p-4 border rounded-2xl transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left ${
                              notif.isRead 
                                ? 'bg-slate-50/50 border-slate-200' 
                                : 'bg-indigo-50/30 border-indigo-205 shadow-3xs'
                            }`}
                          >
                            <div className="space-y-1.5 max-w-2xl font-bold">
                              <div className="flex items-center gap-2.5">
                                <span className={`w-2 h-2 rounded-full ${notif.isRead ? 'bg-slate-300' : 'bg-indigo-600 animate-ping'}`} />
                                <h4 className="font-extrabold text-slate-905 text-xs uppercase tracking-wide">
                                  {notif.subject || 'System Notification'}
                                </h4>
                                <span className="text-[10px] text-slate-400 font-normal">
                                  {new Date(notif.createdAt).toLocaleString()}
                                </span>
                              </div>
                              <p className="text-slate-650 text-xs font-semibold leading-relaxed">
                                {notif.content}
                              </p>
                              <div className="flex items-center gap-2 text-[9px] text-slate-400 font-normal uppercase tracking-wider pt-1 border-t border-slate-100">
                                <span>Recipient ID: {notif.recipient} ({notif.channel})</span>
                                <span>•</span>
                                <span>Role: {notif.user?.role || 'N/A'}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 sm:self-center self-end shrink-0">
                              {!notif.isRead && (
                                <button
                                  onClick={async () => {
                                    try {
                                      const res = await fetch('/api/notifications', {
                                        method: 'PUT',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ notificationId: notif.id }),
                                      });
                                      if (res.ok) fetchLiveLogs();
                                    } catch (err) {
                                      console.error(err);
                                    }
                                  }}
                                  className="px-3 py-1.5 bg-[#23356E] hover:bg-[#1E2E61] text-white text-[10px] font-bold rounded-lg transition-all cursor-pointer"
                                >
                                  Mark Read
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
              {activeTab === 'MESSAGES' && (() => {
                const filteredComments = comments.filter((c: any) => {
                  if (chatChannel === 'CUSTOMER_SUPPORT') {
                    return !c.isToAdmin && c.senderId !== user.id && c.receiverId !== user.id;
                  } else if (chatChannel === 'STORE_ESCALATION') {
                    return c.isToAdmin && (c.senderId === selectedApp?.merchantId || c.receiverId === selectedApp?.merchantId);
                  } else {
                    return (
                      (c.sender.role === 'ADMIN' && c.receiverId === selectedApp?.customerId) ||
                      (c.senderId === selectedApp?.customerId && c.receiver?.role === 'ADMIN')
                    );
                  }
                });

                return (
                  <div className="space-y-6 animate-fadeIn font-sans text-slate-880">
                    <div>
                      <h2 className="text-base font-extrabold text-slate-900 uppercase tracking-wider">Platform Support & Communication Hub</h2>
                      <p className="text-[11px] text-slate-550 font-bold mt-0.5">Exchange messages directly with customers and merchants regarding active loan applications.</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      {/* Left Column: Applications / Customers list */}
                      <div className="lg:col-span-1 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4 max-h-[600px] flex flex-col">
                        <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider border-b border-slate-100 pb-2">Active Conversations</h3>
                        
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Search by customer, store or ID..."
                            value={chatSearchQuery}
                            onChange={(e) => setChatSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 border border-slate-200 bg-slate-55 text-xs rounded-xl focus:border-indigo-500 focus:outline-none font-semibold text-slate-800"
                          />
                          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                          {filteredChatApps.length === 0 ? (
                            <p className="text-slate-400 text-center py-6 text-xs font-bold">No active conversations found.</p>
                          ) : (
                            filteredChatApps.map((app) => {
                              const isCurrent = selectedApp?.id === app.id;
                              return (
                                <div
                                  key={app.id}
                                  onClick={() => setSelectedApp(app)}
                                  className={`p-4 border rounded-2xl cursor-pointer transition-all text-left ${
                                    isCurrent
                                      ? 'bg-indigo-50/50 border-indigo-350 shadow-sm'
                                      : 'bg-white border-slate-200 hover:border-slate-350'
                                  }`}
                                >
                                  <span className="font-extrabold text-slate-900 text-xs block truncate">
                                    👤 {app.customer?.profile?.fullName || 'Prospect Customer'}
                                  </span>
                                  <span className="text-[10px] text-slate-500 font-semibold block mt-1 truncate">
                                    🏬 Store: {app.merchant?.profile?.shopName || 'Merchant'}
                                  </span>
                                  <span className="text-[9px] text-slate-400 font-mono block mt-1">App ID: {app.id.substring(0,8)}...</span>
                                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 mt-2">
                                    <span>₹{Number(app.productValue || app.requestedAmount).toLocaleString()}</span>
                                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                                      ['APPROVED', 'DISBURSED', 'ACTIVE'].includes(app.status)
                                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                        : 'bg-indigo-50 text-indigo-650 border-indigo-100'
                                    }`}>
                                      {app.status}
                                    </span>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>

                      {/* Right Column: Chat Window */}
                      <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4 flex flex-col justify-between min-h-[450px]">
                        {selectedApp ? (
                          <>
                            <div>
                              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                                <div>
                                  <h3 className="font-extrabold text-slate-900 text-sm">
                                    Conversation: {selectedApp.customer?.profile?.fullName || 'Customer'}
                                  </h3>
                                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                                    Store: {selectedApp.merchant?.profile?.shopName || 'Merchant'} • Phone: {selectedApp.customer?.phoneNumber} • App Ref: {selectedApp.id}
                                  </p>
                                </div>
                              </div>

                              {/* Channel Selector */}
                              <div className="flex border-b border-slate-200 mt-4">
                                <button
                                  onClick={() => setChatChannel('CUSTOMER_SUPPORT')}
                                  className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
                                    chatChannel === 'CUSTOMER_SUPPORT'
                                      ? 'border-indigo-600 text-indigo-700 font-black'
                                      : 'border-transparent text-slate-400 hover:text-slate-600'
                                  }`}
                                >
                                  👥 Customer Support (Monitor)
                                </button>
                                <button
                                  onClick={() => setChatChannel('STORE_ESCALATION')}
                                  className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
                                    chatChannel === 'STORE_ESCALATION'
                                      ? 'border-indigo-600 text-indigo-700 font-black'
                                      : 'border-transparent text-slate-400 hover:text-slate-600'
                                  }`}
                                >
                                  🏬 Store Escalation
                                </button>
                                <button
                                  onClick={() => setChatChannel('DIRECT_SUPPORT')}
                                  className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
                                    chatChannel === 'DIRECT_SUPPORT'
                                      ? 'border-indigo-600 text-indigo-700 font-black'
                                      : 'border-transparent text-slate-400 hover:text-slate-600'
                                  }`}
                                >
                                  👤 Direct Support
                                </button>
                              </div>

                              {/* Message list */}
                              <div className="space-y-3 overflow-y-auto bg-slate-50 border border-slate-200 p-4 rounded-xl text-xs font-semibold max-h-[350px] min-h-[250px] mt-4 flex flex-col">
                                {filteredComments.length === 0 ? (
                                  <p className="text-slate-400 text-center py-12">No messages exchanged yet on this channel.</p>
                                ) : (
                                  filteredComments.map((c: any) => {
                                    const isSenderMe = c.senderId === user.id;
                                    return (
                                      <div 
                                        key={c.id} 
                                        className={`flex flex-col max-w-[85%] rounded-2xl p-3 shadow-3xs relative overflow-hidden mb-2 ${
                                          isSenderMe 
                                            ? 'bg-[#1E2B58] text-white ml-auto' 
                                            : 'bg-white text-slate-800 mr-auto border border-slate-200'
                                        }`}
                                      >
                                        <div className={`flex justify-between items-center gap-4 text-[9px] font-black uppercase mb-1 ${
                                          isSenderMe ? 'text-indigo-200' : 'text-slate-455'
                                        }`}>
                                          <span>
                                            {c.sender.profile?.fullName || c.sender.email || 'User'} ({c.sender.role})
                                          </span>
                                          <span>
                                            {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                          </span>
                                        </div>
                                        <p className="leading-relaxed text-[11px] font-semibold text-left">{c.text}</p>
                                        <div className={`text-[8px] font-black uppercase mt-1 text-right block ${
                                          isSenderMe ? 'text-indigo-200' : 'text-slate-455'
                                        }`}>
                                          {c.isToAdmin ? '🔒 To Admin' : c.isToMerchant ? '🤝 To Merchant' : '👥 To Customer'}
                                        </div>
                                      </div>
                                    );
                                  })
                                )}
                              </div>
                            </div>

                            {chatChannel === 'CUSTOMER_SUPPORT' ? (
                              <div className="p-4 bg-slate-50 border border-slate-200 text-slate-550 rounded-xl text-xs font-bold flex items-center justify-center gap-2">
                                ⚠️ Monitoring Mode: Customer-Merchant Store chat thread is read-only.
                              </div>
                            ) : (
                              <div className="space-y-3 pt-2">
                                <div className="text-xs font-bold text-slate-500 bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl">
                                  <span>Active Channel Target: </span>
                                  <span className="font-extrabold text-[#1E2B58] uppercase">
                                    {chatChannel === 'STORE_ESCALATION' ? `Merchant (${selectedApp.merchant?.profile?.shopName || 'Store'})` : `Customer (${selectedApp.customer?.profile?.fullName || 'User'})`}
                                  </span>
                                </div>

                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    placeholder="Type message here..."
                                    value={commentText}
                                    onChange={(e) => setCommentText(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handlePostComment(selectedApp.id);
                                      }
                                    }}
                                    className="flex-1 px-3 py-2 border border-slate-300 bg-white text-xs rounded-xl focus:border-[#1E2B58] focus:outline-none font-semibold text-slate-800"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handlePostComment(selectedApp.id)}
                                    disabled={submittingComment || !commentText.trim()}
                                    className="px-4 py-2 bg-[#1E2B58] hover:bg-[#1a254c] disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
                                  >
                                    Send
                                  </button>
                                </div>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-center py-20 text-slate-400 font-semibold flex flex-col items-center justify-center gap-2">
                            <MessageSquare className="w-12 h-12 text-slate-300" />
                            <span>Select a conversation from the active applications queue to start chatting.</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* TAB: SECURE CREDENTIALS VAULT */}
              {activeTab === 'CREDENTIALS' && (
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6 text-slate-850">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <div>
                      <h2 className="text-lg font-black text-slate-900 leading-tight">Credentials Recovery Vault</h2>
                      <p className="text-slate-505 text-xs">Access secure login credentials of registered Merchants and Customers to assist recovery.</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        onClick={fetchAdminCredentials}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${loadingAdminCredentials ? 'animate-spin' : ''}`} /> Refresh
                      </button>

                      <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                          type="text" 
                          placeholder="Search credentials..." 
                          value={adminCredentialsSearch}
                          onChange={(e) => setAdminCredentialsSearch(e.target.value)}
                          className="pl-9 pr-4 py-2 border border-slate-250 bg-white text-xs rounded-xl focus:border-indigo-500 focus:outline-none font-semibold text-slate-800"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex border-b border-slate-200">
                    <button
                      onClick={() => setAdminCredentialsTab('MERCHANT')}
                      className={`px-6 py-2.5 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
                        adminCredentialsTab === 'MERCHANT'
                          ? 'border-indigo-650 text-indigo-700 font-black'
                          : 'border-transparent text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      🏬 Merchant Credentials
                    </button>
                    <button
                      onClick={() => setAdminCredentialsTab('CUSTOMER')}
                      className={`px-6 py-2.5 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
                        adminCredentialsTab === 'CUSTOMER'
                          ? 'border-indigo-655 text-indigo-700 font-black'
                          : 'border-transparent text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      👤 Customer Credentials
                    </button>
                  </div>

                  {loadingAdminCredentials ? (
                    <div className="text-center py-20 text-slate-400 font-semibold flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
                      <span>Loading secure credentials database...</span>
                    </div>
                  ) : (() => {
                    const filtered = adminCredentials.filter(c => {
                      if (adminCredentialsTab === 'MERCHANT' && c.role !== 'MERCHANT') return false;
                      if (adminCredentialsTab === 'CUSTOMER' && c.role !== 'CUSTOMER') return false;
                      
                      const query = adminCredentialsSearch.toLowerCase();
                      const name = (adminCredentialsTab === 'MERCHANT' ? c.profile?.shopName : c.profile?.fullName) || '';
                      return (
                        name.toLowerCase().includes(query) ||
                        c.email?.toLowerCase().includes(query) ||
                        c.phoneNumber?.includes(query)
                      );
                    });

                    if (filtered.length === 0) {
                      return (
                        <div className="text-center py-16 text-slate-400 font-semibold flex flex-col items-center justify-center gap-2 border border-dashed border-slate-200 rounded-2xl">
                          <Lock className="w-8 h-8 text-slate-350" />
                          <span>No matching credentials records found.</span>
                        </div>
                      );
                    }

                    return (
                      <div className="overflow-x-auto border border-slate-150 rounded-2xl">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-slate-200 text-slate-600 bg-slate-50/70 font-black uppercase tracking-wider">
                              <th className="py-3 px-4 font-bold text-[10px]">{adminCredentialsTab === 'MERCHANT' ? 'Shop Name' : 'Customer Name'}</th>
                              <th className="py-3 px-4 font-bold text-[10px]">Email Address</th>
                              <th className="py-3 px-4 font-bold text-[10px]">Mobile Number</th>
                              <th className="py-3 px-4 font-bold text-[10px]">Login Password</th>
                              <th className="py-3 px-4 font-bold text-[10px] text-right font-black uppercase tracking-wide">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-150 font-semibold text-slate-700">
                            {filtered.map((c) => (
                              <tr key={c.id} className="hover:bg-slate-50/50">
                                <td className="py-3.5 px-4 text-slate-900 font-extrabold font-sans">
                                  {adminCredentialsTab === 'MERCHANT' ? (c.profile?.shopName || c.profile?.fullName || 'Shop') : (c.profile?.fullName || 'Customer')}
                                </td>
                                <td className="py-3.5 px-4 text-slate-600 font-semibold">{c.email || 'N/A'}</td>
                                <td className="py-3.5 px-4 font-mono">{c.phoneNumber}</td>
                                <td className="py-3.5 px-4 font-mono text-indigo-650">
                                  <span className="bg-indigo-50/30 border border-indigo-100 rounded px-2 py-0.5" title={c.password}>
                                    {c.password || 'N/A'}
                                  </span>
                                </td>
                                <td className="py-3.5 px-4 text-right space-x-2 whitespace-nowrap">
                                  <button
                                    onClick={() => handleAdminResendCredentials(c.id)}
                                    disabled={resendingAdminCredentials[c.id]}
                                    className="px-3 py-1.5 bg-[#1E2B58] hover:bg-[#1a254c] disabled:bg-slate-100 disabled:text-slate-400 text-white text-[9px] font-black rounded-lg transition-colors uppercase tracking-wide shadow-2xs"
                                  >
                                    {resendingAdminCredentials[c.id] ? 'Sending...' : 'Email Credentials'}
                                  </button>
                                  <button
                                    onClick={() => {
                                      setPasswordChangeUserId(c.id);
                                      setPasswordChangeName(adminCredentialsTab === 'MERCHANT' ? (c.profile?.shopName || c.profile?.fullName || 'Shop') : (c.profile?.fullName || 'Customer'));
                                      setPasswordChangeNewVal('');
                                      setShowPasswordChangeModal(true);
                                    }}
                                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-[9px] font-black rounded-lg transition-colors uppercase tracking-wide shadow-2xs"
                                  >
                                    Change Password
                                  </button>
                                  <button
                                    onClick={() => handleToggleBan(c.id, !c.isBanned, adminCredentialsTab === 'MERCHANT' ? (c.profile?.shopName || c.profile?.fullName || 'Shop') : (c.profile?.fullName || 'Customer'))}
                                    className={`px-3 py-1.5 text-white text-[9px] font-black rounded-lg transition-colors uppercase tracking-wide shadow-2xs ${
                                      c.isBanned 
                                        ? 'bg-emerald-500 hover:bg-emerald-600' 
                                        : 'bg-rose-500 hover:bg-rose-600'
                                    }`}
                                  >
                                    {c.isBanned ? 'Unban' : 'Ban'}
                                  </button>
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
            </div>
          )}
        </div>
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

      {/* Merchant Onboarding Review Modal */}
      {showMerchantModal && selectedMerchant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="max-w-3xl w-full bg-white border border-slate-200 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl relative my-8 text-slate-800">
            <h2 className="text-xl font-black flex items-center gap-2 text-[#1E2B58] border-b border-slate-150 pb-3">
              🏬 Review Merchant Onboarding: {selectedMerchant.profile?.shopName || 'Agent Profile'}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-semibold text-slate-705">
              
              {/* Business profile info */}
              <div className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
                <h3 className="font-extrabold text-[#1E2B58] uppercase tracking-wider border-b border-slate-200 pb-1.5 flex items-center gap-1.5">
                  <span>💼</span> Store & Tax Credentials
                </h3>
                <div className="space-y-2">
                  <div>Shop Name: <span className="text-slate-900 font-extrabold">{selectedMerchant.profile?.shopName || 'N/A'}</span></div>
                  <div>GSTIN Number: <span className="text-slate-900 font-mono font-bold uppercase">{selectedMerchant.profile?.gstNumber || 'N/A'}</span></div>
                  <div>Owner Name: <span className="text-slate-900 font-extrabold">{selectedMerchant.profile?.fullName || 'N/A'}</span></div>
                  <div>PAN Number: <span className="text-slate-900 font-mono font-bold uppercase">{selectedMerchant.profile?.panNumber || 'N/A'}</span></div>
                  <div>Aadhaar Number: <span className="text-slate-900 font-mono">{selectedMerchant.profile?.aadhaarNumber || 'N/A'}</span></div>
                </div>
              </div>

              {/* Bank Settlement Info */}
              <div className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
                <h3 className="font-extrabold text-[#1E2B58] uppercase tracking-wider border-b border-slate-200 pb-1.5 flex items-center gap-1.5">
                  <Landmark className="w-4 h-4 text-indigo-600" /> Bank Disbursal Account
                </h3>
                <div className="space-y-2">
                  <div>Bank Name: <span className="text-slate-900 font-extrabold">{selectedMerchant.profile?.bankName || 'N/A'}</span></div>
                  <div>Account Number: <span className="text-slate-900 font-mono font-extrabold">{selectedMerchant.profile?.bankAccountNo || 'N/A'}</span></div>
                  <div>IFSC Code: <span className="text-slate-900 font-mono font-bold uppercase">{selectedMerchant.profile?.bankIfsc || 'N/A'}</span></div>
                  <div className="pt-2 border-t border-slate-200/50 mt-1">
                    Store Location: <span className="text-slate-900 block font-normal leading-relaxed mt-0.5">
                      {selectedMerchant.profile?.addressLine1}, {selectedMerchant.profile?.city}, {selectedMerchant.profile?.state} - {selectedMerchant.profile?.pincode}
                    </span>
                  </div>
                </div>
              </div>

            </div>

            {/* Document Scans Grid */}
            <div className="space-y-4">
              <h3 className="font-extrabold text-[#1E2B58] text-xs uppercase tracking-wider border-b border-slate-150 pb-2">
                📄 Onboarding Document Scans
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                
                {/* Selfie */}
                <div className="border border-slate-200 p-4 rounded-2xl bg-slate-50/50 flex flex-col items-center justify-between text-center min-h-[180px]">
                  <span className="text-[10px] text-slate-500 uppercase font-black mb-2">Live Selfie</span>
                  <div className="w-20 h-20 bg-slate-200 rounded-xl overflow-hidden mb-2 flex items-center justify-center">
                    {selectedMerchant.profile?.documents?.find((d: any) => d.type === 'SELFIE') ? (
                      <img 
                        src={`/uploads/${selectedMerchant.profile.documents.find((d: any) => d.type === 'SELFIE').s3Url}`} 
                        alt="Selfie" 
                        className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                        onClick={() => window.open(`/uploads/${selectedMerchant.profile.documents.find((d: any) => d.type === 'SELFIE').s3Url}`, '_blank')}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold">Missing</div>
                    )}
                  </div>
                  <span className="text-[9px] text-slate-400">Click to expand</span>
                </div>

                {/* PAN Scan */}
                <div className="border border-slate-200 p-4 rounded-2xl bg-slate-50/50 flex flex-col items-center justify-between text-center min-h-[180px]">
                  <span className="text-[10px] text-slate-500 uppercase font-black mb-2">PAN Card Scan</span>
                  <div className="w-20 h-20 bg-slate-200 rounded-xl overflow-hidden mb-2 flex items-center justify-center">
                    {selectedMerchant.profile?.documents?.find((d: any) => d.type === 'PAN') ? (
                      <img 
                        src={`/uploads/${selectedMerchant.profile.documents.find((d: any) => d.type === 'PAN').s3Url}`} 
                        alt="PAN Card" 
                        className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                        onClick={() => window.open(`/uploads/${selectedMerchant.profile.documents.find((d: any) => d.type === 'PAN').s3Url}`, '_blank')}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold">Missing</div>
                    )}
                  </div>
                  <span className="text-[9px] text-slate-400">Click to expand</span>
                </div>

                {/* Aadhaar Scan */}
                <div className="border border-slate-200 p-4 rounded-2xl bg-slate-50/50 flex flex-col items-center justify-between text-center min-h-[180px]">
                  <span className="text-[10px] text-slate-500 uppercase font-black mb-2">Aadhaar Scan</span>
                  <div className="w-20 h-20 bg-slate-200 rounded-xl overflow-hidden mb-2 flex items-center justify-center">
                    {selectedMerchant.profile?.documents?.find((d: any) => d.type === 'AADHAAR') ? (
                      <img 
                        src={`/uploads/${selectedMerchant.profile.documents.find((d: any) => d.type === 'AADHAAR').s3Url}`} 
                        alt="Aadhaar Card" 
                        className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                        onClick={() => window.open(`/uploads/${selectedMerchant.profile.documents.find((d: any) => d.type === 'AADHAAR').s3Url}`, '_blank')}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold">Missing</div>
                    )}
                  </div>
                  <span className="text-[9px] text-slate-400">Click to expand</span>
                </div>

              </div>
            </div>

            {/* Onboarding Feed Timeline for Admin */}
            <div className="pt-4 border-t border-slate-150 space-y-3 text-slate-700">
              <label className="block text-slate-550 text-xs font-bold uppercase tracking-wider">Onboarding Comments & History</label>
              
              {loadingTimeline && onboardingTimeline.length === 0 ? (
                <div className="text-center py-4 text-xs font-bold text-slate-400">Loading timeline...</div>
              ) : onboardingTimeline.length === 0 ? (
                <p className="text-slate-400 text-center py-4 text-xs font-semibold">No onboarding comments posted yet.</p>
              ) : (
                <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1 bg-slate-50 border border-slate-200 p-3.5 rounded-2xl flex flex-col text-[11px]">
                  {onboardingTimeline.map((item) => {
                    const isMe = item.sender.id === user.id;
                    if (item.type === 'AUDIT') {
                      return (
                        <div key={item.id} className="mx-auto my-1 py-0.5 px-2 bg-slate-200 border border-slate-250 text-slate-500 rounded-full text-[9px] font-black uppercase text-center">
                          ⚙️ {item.text}
                        </div>
                      );
                    }
                    return (
                      <div 
                        key={item.id} 
                        className={`flex flex-col max-w-[90%] sm:max-w-[80%] rounded-2xl p-2.5 shadow-3xs relative overflow-hidden mb-1 ${
                          isMe 
                            ? 'bg-[#1E2B58] text-white ml-auto' 
                            : 'bg-white text-slate-800 mr-auto border border-slate-200'
                        }`}
                      >
                        <div className={`flex justify-between items-center gap-4 text-[8px] font-black uppercase mb-0.5 ${
                          isMe ? 'text-indigo-200' : 'text-slate-455'
                        }`}>
                          <span>{item.sender.name} ({item.sender.role})</span>
                          <span>{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className={`leading-relaxed font-semibold text-left text-[11px] break-words whitespace-pre-wrap ${isMe ? 'text-white' : 'text-slate-800'}`}>{item.text}</p>
                      </div>
                    );
                  })}
                  <div ref={onboardingEndRef} />
                </div>
              )}

              {/* Direct comment input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Post instructions / query to merchant..."
                  value={onboardingCommentText}
                  onChange={(e) => setOnboardingCommentText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handlePostOnboardingComment(selectedMerchant.id); }}
                  className="flex-1 min-w-0 px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-800 text-xs font-semibold focus:border-indigo-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => handlePostOnboardingComment(selectedMerchant.id)}
                  disabled={submittingOnboardingComment || !onboardingCommentText.trim()}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-950 disabled:bg-slate-200 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  {submittingOnboardingComment ? 'Posting...' : 'Post Comment'}
                </button>
              </div>
            </div>

            {/* Rejection input and Actions footer */}
            <div className="pt-4 border-t border-slate-150 space-y-4">
              <div>
                <label className="block text-slate-550 text-xs font-bold mb-2 uppercase">Rejection Reason (only when rejecting)</label>
                <input 
                  type="text"
                  placeholder="e.g. GST number mismatch, blurry Aadhaar card scan..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-800 text-xs font-semibold"
                />
              </div>

              <div className="flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => { setShowMerchantModal(false); setSelectedMerchant(null); }}
                  className="px-4 py-2.5 border border-slate-250 bg-white hover:bg-slate-50 rounded-xl text-slate-700 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleVerifyMerchantStatus('REJECTED')}
                  disabled={verifyingMerchant || !rejectionReason.trim()}
                  className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-300 disabled:text-white/60 text-white font-bold rounded-xl text-xs active:scale-[0.98] transition-all"
                >
                  Reject Application
                </button>
                <button
                  type="button"
                  onClick={() => handleVerifyMerchantStatus('APPROVED')}
                  disabled={verifyingMerchant}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-bold rounded-xl text-xs active:scale-[0.98] transition-all flex items-center gap-1.5"
                >
                  {verifyingMerchant ? 'Processing...' : 'Approve & Activate Merchant'}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Create Merchant Modal */}
      {isCreateMerchantOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-55 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 w-full max-w-2xl space-y-6 animate-scaleUp text-slate-705">
            <div className="flex justify-between items-center border-b border-slate-150 pb-3">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <Users className="w-5 h-5 text-[#1E2B58]" />
                Register Pre-Approved Merchant Store
              </h3>
              <button 
                onClick={() => setIsCreateMerchantOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateMerchant} className="space-y-4 text-xs font-semibold text-slate-700">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 mb-1 uppercase tracking-wide">Owner Name</label>
                  <input 
                    type="text" 
                    required
                    value={merchantForm.fullName}
                    onChange={(e) => setMerchantForm({ ...merchantForm, fullName: e.target.value })}
                    placeholder="e.g. Lokesh Purohit"
                    className="w-full px-4 py-2 bg-white border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1 uppercase tracking-wide">Email Address</label>
                  <input 
                    type="email" 
                    required
                    value={merchantForm.email}
                    onChange={(e) => setMerchantForm({ ...merchantForm, email: e.target.value })}
                    placeholder="e.g. merchant@store.com"
                    className="w-full px-4 py-2 bg-white border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 mb-1 uppercase tracking-wide">Mobile Number</label>
                  <input 
                    type="text" 
                    required
                    value={merchantForm.phoneNumber}
                    onChange={(e) => setMerchantForm({ ...merchantForm, phoneNumber: e.target.value })}
                    placeholder="e.g. +919876543210"
                    className="w-full px-4 py-2 bg-white border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1 uppercase tracking-wide">Password (Optional)</label>
                  <input 
                    type="text" 
                    value={merchantForm.password}
                    onChange={(e) => setMerchantForm({ ...merchantForm, password: e.target.value })}
                    placeholder="Auto-generated if left blank"
                    className="w-full px-4 py-2 bg-white border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-500 mb-1 uppercase tracking-wide">Date of Birth</label>
                  <input 
                    type="date" 
                    required
                    value={merchantForm.dob}
                    onChange={(e) => setMerchantForm({ ...merchantForm, dob: e.target.value })}
                    className="w-full px-4 py-2 bg-white border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1 uppercase tracking-wide">PAN Card Number</label>
                  <input 
                    type="text" 
                    required
                    maxLength={10}
                    value={merchantForm.panNumber}
                    onChange={(e) => setMerchantForm({ ...merchantForm, panNumber: e.target.value.toUpperCase() })}
                    placeholder="e.g. ABCDE1234F"
                    className="w-full px-4 py-2 bg-white border border-slate-300 rounded-xl font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1 uppercase tracking-wide">Aadhaar Card (12 Digits)</label>
                  <input 
                    type="text" 
                    required
                    maxLength={12}
                    value={merchantForm.aadhaarNumber}
                    onChange={(e) => setMerchantForm({ ...merchantForm, aadhaarNumber: e.target.value })}
                    placeholder="e.g. 123456789012"
                    className="w-full px-4 py-2 bg-white border border-slate-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 mb-1 uppercase tracking-wide">Store/Shop Name</label>
                  <input 
                    type="text" 
                    required
                    value={merchantForm.shopName}
                    onChange={(e) => setMerchantForm({ ...merchantForm, shopName: e.target.value })}
                    placeholder="e.g. Oroboro Tech Store"
                    className="w-full px-4 py-2 bg-white border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1 uppercase tracking-wide">GSTIN Number</label>
                  <input 
                    type="text" 
                    required
                    maxLength={15}
                    value={merchantForm.gstNumber}
                    onChange={(e) => setMerchantForm({ ...merchantForm, gstNumber: e.target.value.toUpperCase() })}
                    placeholder="e.g. 27ABCDE1234F1Z5"
                    className="w-full px-4 py-2 bg-white border border-slate-300 rounded-xl font-mono uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-500 mb-1 uppercase tracking-wide">Bank Account Number</label>
                  <input 
                    type="text" 
                    required
                    value={merchantForm.bankAccountNo}
                    onChange={(e) => setMerchantForm({ ...merchantForm, bankAccountNo: e.target.value })}
                    placeholder="e.g. 98765432109"
                    className="w-full px-4 py-2 bg-white border border-slate-300 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1 uppercase tracking-wide">Bank IFSC Code</label>
                  <input 
                    type="text" 
                    required
                    maxLength={11}
                    value={merchantForm.bankIfsc}
                    onChange={(e) => setMerchantForm({ ...merchantForm, bankIfsc: e.target.value.toUpperCase() })}
                    placeholder="e.g. SBIN0001234"
                    className="w-full px-4 py-2 bg-white border border-slate-300 rounded-xl font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1 uppercase tracking-wide">Bank Name</label>
                  <input 
                    type="text" 
                    required
                    value={merchantForm.bankName}
                    onChange={(e) => setMerchantForm({ ...merchantForm, bankName: e.target.value })}
                    placeholder="e.g. State Bank of India"
                    className="w-full px-4 py-2 bg-white border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-slate-500 mb-1 uppercase tracking-wide">Shop Store Address Line 1</label>
                  <input 
                    type="text" 
                    required
                    value={merchantForm.addressLine1}
                    onChange={(e) => setMerchantForm({ ...merchantForm, addressLine1: e.target.value })}
                    placeholder="e.g. Shop 42, Ground Floor, Gold Plaza"
                    className="w-full px-4 py-2 bg-white border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className="col-span-2">
                  <label className="block text-slate-500 mb-1 uppercase tracking-wide">Address Line 2 (Optional)</label>
                  <input 
                    type="text" 
                    value={merchantForm.addressLine2}
                    onChange={(e) => setMerchantForm({ ...merchantForm, addressLine2: e.target.value })}
                    placeholder="e.g. Sector 17"
                    className="w-full px-4 py-2 bg-white border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1 uppercase tracking-wide">Pincode</label>
                  <input 
                    type="text" 
                    required
                    maxLength={6}
                    value={merchantForm.pincode}
                    onChange={(e) => setMerchantForm({ ...merchantForm, pincode: e.target.value })}
                    placeholder="e.g. 400001"
                    className="w-full px-4 py-2 bg-white border border-slate-300 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1 uppercase tracking-wide">City</label>
                  <input 
                    type="text" 
                    required
                    value={merchantForm.city}
                    onChange={(e) => setMerchantForm({ ...merchantForm, city: e.target.value })}
                    placeholder="e.g. Mumbai"
                    className="w-full px-4 py-2 bg-white border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 mb-1 uppercase tracking-wide">State</label>
                <input 
                  type="text" 
                  required
                  value={merchantForm.state}
                  onChange={(e) => setMerchantForm({ ...merchantForm, state: e.target.value })}
                  placeholder="e.g. Maharashtra"
                  className="w-full px-4 py-2 bg-white border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-150">
                <button
                  type="button"
                  onClick={() => setIsCreateMerchantOpen(false)}
                  className="px-5 py-2.5 border border-slate-305 bg-white hover:bg-slate-50 rounded-xl text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingMerchant}
                  className="px-5 py-2.5 bg-[#1E2B58] hover:bg-[#1a254c] disabled:bg-slate-300 text-white font-bold rounded-xl"
                >
                  {submittingMerchant ? 'Creating...' : 'Create & Pre-Approve Merchant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPasswordChangeModal && (
        <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 md:p-8 w-full max-w-md space-y-6 animate-scaleUp text-slate-800 relative font-sans">
            <div className="flex justify-between items-center border-b border-slate-150 pb-3">
              <h3 className="font-extrabold text-[#1E2B58] text-base flex items-center gap-2">
                <Lock className="w-5 h-5 text-indigo-500" />
                <span>Override User Password</span>
              </h3>
              <button 
                onClick={() => setShowPasswordChangeModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs">
                <span className="block text-slate-400 font-bold uppercase tracking-wider mb-1">User / Target Account</span>
                <span className="text-sm font-black text-slate-900">{passwordChangeName}</span>
              </div>

              <div className="text-xs font-bold text-slate-700">
                <label className="block text-slate-505 mb-2 uppercase tracking-wide">Enter New Password</label>
                <input 
                  type="text" 
                  required
                  placeholder="New plain-text password..."
                  value={passwordChangeNewVal}
                  onChange={(e) => setPasswordChangeNewVal(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 bg-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-150 text-xs font-bold">
              <button
                type="button"
                onClick={() => setShowPasswordChangeModal(false)}
                className="px-5 py-2.5 border border-slate-305 bg-white hover:bg-slate-50 rounded-xl text-slate-700 font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleChangePassword}
                disabled={updatingPassword || !passwordChangeNewVal.trim()}
                className="px-5 py-2.5 bg-[#1E2B58] hover:bg-[#1a254c] disabled:bg-slate-300 text-white font-bold rounded-xl"
              >
                {updatingPassword ? 'Saving...' : 'Apply Password'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showEmiEditModal && selectedEmiSchedule && (
        <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 md:p-8 w-full max-w-lg space-y-6 animate-scaleUp text-slate-800 relative font-sans">
            <div className="flex justify-between items-center border-b border-slate-150 pb-3">
              <h3 className="font-extrabold text-[#1E2B58] text-base flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-indigo-500" />
                <span>Edit EMI Installment Repayment Ledger</span>
              </h3>
              <button 
                onClick={() => { setShowEmiEditModal(false); setSelectedEmiSchedule(null); }}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateEmiSchedule} className="space-y-4 text-xs font-bold">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-slate-400 font-bold uppercase tracking-wider mb-1">EMI Installment</span>
                  <span className="text-sm font-black text-slate-900">Installment #{selectedEmiSchedule.installmentNo}</span>
                </div>
                <div>
                  <span className="block text-slate-400 font-bold uppercase tracking-wider mb-1">Scheduled Due Date</span>
                  <span className="text-sm font-black text-slate-900">{formatDateAndDay(selectedEmiSchedule.dueDate)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 mb-1 uppercase tracking-wide">Status</label>
                  <select
                    value={emiForm.status}
                    onChange={(e) => setEmiForm({ ...emiForm, status: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl bg-white focus:outline-none focus:border-indigo-500 font-semibold text-slate-800"
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="PAID">PAID</option>
                    <option value="OVERDUE">OVERDUE</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 mb-1 uppercase tracking-wide">Payment Date (Optional)</label>
                  <input
                    type="date"
                    value={emiForm.paidAt}
                    onChange={(e) => setEmiForm({ ...emiForm, paidAt: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl bg-white focus:outline-none focus:border-indigo-500 font-semibold font-mono text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 mb-1 uppercase tracking-wide">Amount Due (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={emiForm.amountDue}
                    onChange={(e) => setEmiForm({ ...emiForm, amountDue: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl bg-white focus:outline-none focus:border-indigo-500 font-semibold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 mb-1 uppercase tracking-wide">Amount Paid (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={emiForm.amountPaid}
                    onChange={(e) => setEmiForm({ ...emiForm, amountPaid: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl bg-white focus:outline-none focus:border-indigo-500 font-semibold text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 mb-1 uppercase tracking-wide">Penalty Accrued (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={emiForm.penaltyAccrued}
                    onChange={(e) => setEmiForm({ ...emiForm, penaltyAccrued: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl bg-white focus:outline-none focus:border-indigo-500 font-semibold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 mb-1 uppercase tracking-wide">Late Fee Accrued (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={emiForm.lateFeeAccrued}
                    onChange={(e) => setEmiForm({ ...emiForm, lateFeeAccrued: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl bg-white focus:outline-none focus:border-indigo-500 font-semibold text-slate-800"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-150 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => { setShowEmiEditModal(false); setSelectedEmiSchedule(null); }}
                  className="px-5 py-2.5 border border-slate-305 bg-white hover:bg-slate-50 rounded-xl text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingEmi}
                  className="px-5 py-2.5 bg-[#1E2B58] hover:bg-[#1a254c] disabled:bg-slate-300 text-white font-bold rounded-xl"
                >
                  {updatingEmi ? 'Updating...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
