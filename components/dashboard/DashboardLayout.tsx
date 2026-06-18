'use client';

import React, { useState, useEffect } from 'react';
import { AuthUser, useAuth } from '@/app/providers';
import { 
  User, Mail, Phone, ShieldCheck, FileText, CheckCircle2, 
  CreditCard, Camera, UploadCloud, AlertTriangle, ArrowRight, 
  ArrowLeft, Download, Check, RefreshCw, Landmark, Trash2,
  LayoutGrid, Users, Coins, TrendingUp, FolderOpen, 
  ChevronRight, ChevronDown, BookOpen, FileUp, Calculator,
  Bell, Maximize2, Search, X, ShieldAlert, LayoutDashboard,
  FileSpreadsheet, Lock, AlertCircle, DollarSign, Settings,
  MessageSquare
} from 'lucide-react';

interface DashboardLayoutProps {
  user: AuthUser;
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: any) => void;
  onOpenProfile?: () => void;
  onOpenDocs?: () => void;
  error?: string;
  success?: string;
  onNotificationClick?: (notif: any) => void;
}

export default function DashboardLayout({
  user,
  children,
  activeTab,
  setActiveTab,
  onOpenProfile,
  onOpenDocs,
  error,
  success,
  onNotificationClick
}: DashboardLayoutProps) {
  const { logout, switchRole } = useAuth();
  const [isDevMode, setIsDevMode] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  // Collapsible Sidebar Menus states - CLOSED BY DEFAULT
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [clientMenuOpen, setClientMenuOpen] = useState(false);
  const [reportMenuOpen, setReportMenuOpen] = useState(false);
  const [loansDisbursementMenuOpen, setLoansDisbursementMenuOpen] = useState(false);
  const [loansMenuOpen, setLoansMenuOpen] = useState(false);
  const [disbursalMenuOpen, setDisbursalMenuOpen] = useState(false);
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);

  const handleToggleMenu = (menuName: string) => {
    setUserMenuOpen(menuName === 'user' ? !userMenuOpen : false);
    setClientMenuOpen(menuName === 'client' ? !clientMenuOpen : false);
    setReportMenuOpen(menuName === 'report' ? !reportMenuOpen : false);
    setLoansDisbursementMenuOpen(menuName === 'loansDisbursement' ? !loansDisbursementMenuOpen : false);
    setLoansMenuOpen(menuName === 'loans' ? !loansMenuOpen : false);
    setDisbursalMenuOpen(menuName === 'disbursal' ? !disbursalMenuOpen : false);
    setAdminMenuOpen(menuName === 'admin' ? !adminMenuOpen : false);
  };

  // Settings Modal states
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [profileForm, setProfileForm] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    dob: '',
    addressLine1: '',
    addressLine2: '',
    pincode: '',
    city: '',
    state: ''
  });
  const [avatarUrl, setAvatarUrl] = useState(user.profilePictureUrl || '');
  const [updatingSettings, setUpdatingSettings] = useState(false);
  const [settingsError, setSettingsError] = useState('');
  const [settingsSuccess, setSettingsSuccess] = useState('');

  // Fetch user notifications from API
  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        if (data.notifications) {
          const mapped = data.notifications.map((n: any) => ({
            id: n.id,
            text: n.content,
            date: new Date(n.createdAt).toLocaleString('en-IN'),
            isRead: n.isRead
          }));
          setNotifications(mapped);
        }
      }
    } catch (e) {
      console.error('Failed to fetch notifications:', e);
    }
  };

  useEffect(() => {
    const savedDevMode = localStorage.getItem('dev_mode');
    setIsDevMode(savedDevMode === 'true');

    // Fetch initial notifications
    fetchNotifications();

    // Setup real-time polling every 15 seconds
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleNotificationClickInternal = async (notif: any) => {
    // Optimistic UI update
    const updated = notifications.map(n => n.id === notif.id ? { ...n, isRead: true } : n);
    setNotifications(updated);

    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: notif.id }),
      });
    } catch (e) {
      console.error('Failed to mark notification as read:', e);
    }

    const match = notif.text.match(/CustomerCode-([A-Za-z0-9]+)/);
    const customerCode = match ? match[1] : '';

    let targetTab = '';
    const isMerchant = user.role === 'MERCHANT';

    if (isMerchant) {
      if (notif.text.includes('DISBURSAL')) {
        targetTab = 'disbursal-consumer';
      } else if (notif.text.includes('UNDER_REVIEW') || notif.text.includes('VERIFICATION')) {
        targetTab = 'loans-consumer';
      }
    } else {
      if (notif.text.includes('DISBURSAL')) {
        targetTab = 'DISBURSAL_TRACKER';
      } else if (notif.text.includes('UNDER_REVIEW') || notif.text.includes('VERIFICATION')) {
        targetTab = 'LOANS';
      }
    }

    if (targetTab) {
      setActiveTab(targetTab);
      if (customerCode) {
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('notification-search', { 
            detail: { text: customerCode, tab: targetTab, notifText: notif.text } 
          }));
        }, 100);
      }
    }

    if (onNotificationClick) {
      onNotificationClick(notif);
    }
    setShowNotifications(false);
  };

  const getRoleBadgeText = () => {
    switch (user.role) {
      case 'MERCHANT': return 'Merchant';
      case 'CUSTOMER': return 'Customer';
      case 'ADMIN': return 'Admin';
      case 'SUPER_ADMIN': return 'Super Admin';
      case 'FINANCE': return 'Finance';
      case 'OPERATIONS': return 'Operations';
      case 'LOAN_OFFICER': return 'Loan Officer';
      case 'COLLECTIONS': return 'Collections';
      default: return user.role;
    }
  };

  const renderSidebarLinks = () => {
    const isMerchant = user.role === 'MERCHANT';
    const isCustomer = user.role === 'CUSTOMER';
    const isAdminLike = !isMerchant && !isCustomer;

    if (isMerchant) {
      return (
        <>
          {/* Analytics Overview */}
          <button
            onClick={() => { setActiveTab('analytics'); }}
            className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'analytics' 
                ? 'bg-white/10 text-white border-l-4 border-indigo-400 font-extrabold' 
                : 'text-slate-200 hover:bg-white/5 hover:text-white'
            }`}
          >
            <LayoutGrid className="w-4 h-4 shrink-0 text-indigo-400" />
            <span>AnalyticsDashboard</span>
          </button>

          {/* Client Master */}
          <div>
            <button 
              onClick={() => handleToggleMenu('client')}
              className="w-full flex items-center justify-between px-4 py-3 text-xs font-bold text-slate-200 hover:bg-white/5 hover:text-white rounded-xl transition-all"
            >
              <div className="flex items-center gap-3">
                <Landmark className="w-4 h-4 text-indigo-400" />
                <span>Client Master</span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 transition-all ${clientMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            
            <div className={`pl-9 pr-2 space-y-1 bg-white/5 rounded-xl mt-0.5 overflow-hidden transition-all duration-300 ease-in-out ${clientMenuOpen ? 'max-h-40 opacity-100 py-1' : 'max-h-0 opacity-0 py-0 pointer-events-none'}`}>
              <button 
                onClick={() => { setActiveTab('client-records'); }}
                className={`w-full text-left py-2 text-[11px] font-bold block ${activeTab === 'client-records' ? 'text-white font-extrabold' : 'text-slate-300 hover:text-white'}`}
              >
                - CLIENT RECORDS
              </button>
              <button 
                onClick={() => { setActiveTab('docs-upload'); }}
                className={`w-full text-left py-2 text-[11px] font-bold block ${activeTab === 'docs-upload' ? 'text-white font-extrabold' : 'text-slate-300 hover:text-white'}`}
              >
                - DOCS UPLOAD HUB
              </button>
              <button 
                onClick={() => { setActiveTab('emi-calc'); }}
                className={`w-full text-left py-2 text-[11px] font-bold block ${activeTab === 'emi-calc' ? 'text-white font-extrabold' : 'text-slate-300 hover:text-white'}`}
              >
                - EMI CALCULATOR
              </button>
            </div>
          </div>

          {/* Onboard */}
          <button
            onClick={() => { setActiveTab('onboard'); }}
            className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'onboard' 
                ? 'bg-white/10 text-white border-l-4 border-indigo-400 font-extrabold' 
                : 'text-slate-200 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Coins className="w-4 h-4 shrink-0 text-indigo-400" />
            <span>Onboard</span>
          </button>

          {/* Loans */}
          <div>
            <button 
              onClick={() => handleToggleMenu('loans')}
              className="w-full flex items-center justify-between px-4 py-3 text-xs font-bold text-slate-200 hover:bg-white/5 hover:text-white rounded-xl transition-all"
            >
              <div className="flex items-center gap-3">
                <Coins className="w-4 h-4 text-indigo-400" />
                <span>Loans</span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 transition-all ${loansMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            
            <div className={`pl-9 pr-2 space-y-1 bg-white/5 rounded-xl mt-0.5 overflow-hidden transition-all duration-300 ease-in-out ${loansMenuOpen ? 'max-h-24 opacity-100 py-1' : 'max-h-0 opacity-0 py-0 pointer-events-none'}`}>
              <button 
                onClick={() => { setActiveTab('loans-consumer'); }}
                className={`w-full text-left py-2 text-[11px] font-bold block ${activeTab === 'loans-consumer' ? 'text-white font-extrabold' : 'text-slate-300 hover:text-white'}`}
              >
                - CONSUMER LOANS
              </button>
            </div>
          </div>

          {/* Disbursal Tracker */}
          <div>
            <button 
              onClick={() => handleToggleMenu('disbursal')}
              className="w-full flex items-center justify-between px-4 py-3 text-xs font-bold text-slate-200 hover:bg-white/5 hover:text-white rounded-xl transition-all"
            >
              <div className="flex items-center gap-3">
                <TrendingUp className="w-4 h-4 text-indigo-400" />
                <span>Disbursal Tracker</span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 transition-all ${disbursalMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            
            <div className={`pl-9 pr-2 space-y-1 bg-white/5 rounded-xl mt-0.5 overflow-hidden transition-all duration-300 ease-in-out ${disbursalMenuOpen ? 'max-h-24 opacity-100 py-1' : 'max-h-0 opacity-0 py-0 pointer-events-none'}`}>
              <button 
                onClick={() => { setActiveTab('disbursal-consumer'); }}
                className={`w-full text-left py-2 text-[11px] font-bold block ${activeTab === 'disbursal-consumer' ? 'text-white font-extrabold' : 'text-slate-300 hover:text-white'}`}
              >
                - CONSUMER LOANS
              </button>
            </div>
          </div>

          {/* Administration Menu */}
          <div>
            <button 
              onClick={() => handleToggleMenu('admin')}
              className="w-full flex items-center justify-between px-4 py-3 text-xs font-bold text-slate-200 hover:bg-white/5 hover:text-white rounded-xl transition-all"
            >
              <div className="flex items-center gap-3">
                <Lock className="w-4 h-4 text-indigo-400" />
                <span>Administration</span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 transition-all ${adminMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            
            <div className={`pl-9 pr-2 space-y-1 bg-white/5 rounded-xl mt-0.5 overflow-hidden transition-all duration-300 ease-in-out ${adminMenuOpen ? 'max-h-72 opacity-100 py-1' : 'max-h-0 opacity-0 py-0 pointer-events-none'}`}>
              <button 
                onClick={() => { setActiveTab('customer-credentials'); }}
                className={`w-full text-left py-2 text-[11px] font-bold block ${activeTab === 'customer-credentials' ? 'text-white font-extrabold' : 'text-slate-300 hover:text-white'}`}
              >
                - CUSTOMER CREDENTIALS
              </button>
              <button 
                onClick={() => { setActiveTab('admin-approvals'); }}
                className={`w-full text-left py-2 text-[11px] font-bold block ${activeTab === 'admin-approvals' ? 'text-white font-extrabold' : 'text-slate-300 hover:text-white'}`}
              >
                - ADMIN APPROVAL
              </button>
              <button 
                onClick={() => { setActiveTab('docs-checklist'); }}
                className={`w-full text-left py-2 text-[11px] font-bold block ${activeTab === 'docs-checklist' ? 'text-white font-extrabold' : 'text-slate-300 hover:text-white'}`}
              >
                - DOCS CHECKLIST CENTER
              </button>
              <button 
                onClick={() => { setActiveTab('messages'); }}
                className={`w-full text-left py-2 text-[11px] font-bold block ${activeTab === 'messages' ? 'text-white font-extrabold' : 'text-slate-300 hover:text-white'}`}
              >
                - MESSAGE/SUPPORT
              </button>
              <button 
                onClick={() => { setActiveTab('customer-master-directory'); }}
                className={`w-full text-left py-2 text-[11px] font-bold block ${activeTab === 'customer-master-directory' ? 'text-white font-extrabold' : 'text-slate-300 hover:text-white'}`}
              >
                - CUSTOMER MASTER HUB
              </button>
              <button 
                onClick={() => { setActiveTab('customer-docs'); }}
                className={`w-full text-left py-2 text-[11px] font-bold block ${activeTab === 'customer-docs' ? 'text-white font-extrabold' : 'text-slate-300 hover:text-white'}`}
              >
                - CUSTOMER DOCS HUB
              </button>
            </div>
          </div>

          {/* Live Notification Feed */}
          <button
            onClick={() => { setActiveTab('live-notifications'); }}
            className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'live-notifications' 
                ? 'bg-white/10 text-white border-l-4 border-indigo-400 font-extrabold' 
                : 'text-slate-200 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Bell className="w-4 h-4 shrink-0 text-indigo-400" />
            <span>Live Notifications</span>
          </button>
        </>
      );
    }

    if (isAdminLike) {
      return (
        <>
          {/* Analytics Overview */}
          <button
            onClick={() => { setActiveTab('ANALYTICS'); }}
            className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'ANALYTICS' 
                ? 'bg-white/10 text-white border-l-4 border-indigo-400 font-extrabold' 
                : 'text-slate-355 hover:bg-white/5 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 shrink-0 text-indigo-400" />
            <span>AnalyticsDashboard</span>
          </button>

          {/* User Management */}
          <div>
            <button 
              onClick={() => handleToggleMenu('user')}
              className="w-full flex items-center justify-between px-4 py-3 text-xs font-bold text-slate-355 hover:bg-white/5 hover:text-white rounded-xl transition-all"
            >
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4 text-indigo-400" />
                <span>User Management</span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 transition-all ${userMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            
            <div className={`pl-9 pr-2 space-y-1 bg-white/5 rounded-xl mt-0.5 overflow-hidden transition-all duration-300 ease-in-out ${userMenuOpen ? 'max-h-36 opacity-100 py-1' : 'max-h-0 opacity-0 py-0 pointer-events-none'}`}>
              <button 
                onClick={() => { setActiveTab('USER_AGENT'); }}
                className={`w-full text-left py-2 text-[11px] font-bold block ${activeTab === 'USER_AGENT' ? 'text-white font-extrabold' : 'text-slate-450 hover:text-white'}`}
              >
                - AGENT
              </button>
              <button 
                onClick={() => { setActiveTab('USER_SYSTEM'); }}
                className={`w-full text-left py-2 text-[11px] font-bold block ${activeTab === 'USER_SYSTEM' ? 'text-white font-extrabold' : 'text-slate-450 hover:text-white'}`}
              >
                - USERS
              </button>
              <button 
                onClick={() => { setActiveTab('CREDENTIALS'); }}
                className={`w-full text-left py-2 text-[11px] font-bold block ${activeTab === 'CREDENTIALS' ? 'text-white font-extrabold' : 'text-slate-450 hover:text-white'}`}
              >
                - CREDENTIALS VAULT
              </button>
            </div>
          </div>

          {/* Client Master */}
          <div>
            <button 
              onClick={() => handleToggleMenu('client')}
              className="w-full flex items-center justify-between px-4 py-3 text-xs font-bold text-slate-350 hover:bg-white/5 hover:text-white rounded-xl transition-all"
            >
              <div className="flex items-center gap-3">
                <Landmark className="w-4 h-4 text-indigo-400" />
                <span>Client Master</span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 transition-all ${clientMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            
            <div className={`pl-9 pr-2 space-y-1 bg-white/5 rounded-xl mt-0.5 overflow-hidden transition-all duration-300 ease-in-out ${clientMenuOpen ? 'max-h-24 opacity-100 py-1' : 'max-h-0 opacity-0 py-0 pointer-events-none'}`}>
              <button 
                onClick={() => { setActiveTab('CLIENT_RECORDS'); }}
                className={`w-full text-left py-2 text-[11px] font-bold block ${activeTab === 'CLIENT_RECORDS' ? 'text-white font-extrabold' : 'text-slate-450 hover:text-white'}`}
              >
                - CLIENT RECORDS
              </button>
              <button 
                onClick={() => { setActiveTab('CLIENT_UPLOAD'); }}
                className={`w-full text-left py-2 text-[11px] font-bold block ${activeTab === 'CLIENT_UPLOAD' ? 'text-white font-extrabold' : 'text-slate-450 hover:text-white'}`}
              >
                - DOCS UPLOAD HUB
              </button>
            </div>
          </div>

          {/* Report */}
          <div>
            <button 
              onClick={() => handleToggleMenu('report')}
              className="w-full flex items-center justify-between px-4 py-3 text-xs font-bold text-slate-355 hover:bg-white/5 hover:text-white rounded-xl transition-all"
            >
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-indigo-400" />
                <span>Report</span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 transition-all ${reportMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            
            <div className={`pl-9 pr-2 space-y-1 bg-white/5 rounded-xl mt-0.5 overflow-hidden transition-all duration-300 ease-in-out ${reportMenuOpen ? 'max-h-24 opacity-100 py-1' : 'max-h-0 opacity-0 py-0 pointer-events-none'}`}>
              <button 
                onClick={() => { setActiveTab('REPORTS'); }}
                className={`w-full text-left py-2 text-[11px] font-bold block ${activeTab === 'REPORTS' ? 'text-white font-extrabold' : 'text-slate-450 hover:text-white'}`}
              >
                - REPORTS
              </button>
            </div>
          </div>

          {/* Loans Disbursement */}
          <div>
            <button 
              onClick={() => handleToggleMenu('loansDisbursement')}
              className="w-full flex items-center justify-between px-4 py-3 text-xs font-bold text-slate-355 hover:bg-white/5 hover:text-white rounded-xl transition-all"
            >
              <div className="flex items-center gap-3">
                <Landmark className="w-4 h-4 text-indigo-400" />
                <span>Loans Disbursement</span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 transition-all ${loansDisbursementMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            
            <div className={`pl-9 pr-2 space-y-1 bg-white/5 rounded-xl mt-0.5 overflow-hidden transition-all duration-300 ease-in-out ${loansDisbursementMenuOpen ? 'max-h-24 opacity-100 py-1' : 'max-h-0 opacity-0 py-0 pointer-events-none'}`}>
              <button 
                onClick={() => { setActiveTab('LOANS_DISBURSEMENT'); }}
                className={`w-full text-left py-2 text-[11px] font-bold block ${activeTab === 'LOANS_DISBURSEMENT' ? 'text-white font-extrabold' : 'text-slate-455 hover:text-white'}`}
              >
                - CONSUMER LOANS
              </button>
            </div>
          </div>

          {/* Loans */}
          <div>
            <button 
              onClick={() => handleToggleMenu('loans')}
              className="w-full flex items-center justify-between px-4 py-3 text-xs font-bold text-slate-355 hover:bg-white/5 hover:text-white rounded-xl transition-all"
            >
              <div className="flex items-center gap-3">
                <DollarSign className="w-4 h-4 text-indigo-400" />
                <span>Loans</span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 transition-all ${loansMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            
            <div className={`pl-9 pr-2 space-y-1 bg-white/5 rounded-xl mt-0.5 overflow-hidden transition-all duration-300 ease-in-out ${loansMenuOpen ? 'max-h-24 opacity-100 py-1' : 'max-h-0 opacity-0 py-0 pointer-events-none'}`}>
              <button 
                onClick={() => { setActiveTab('LOANS'); }}
                className={`w-full text-left py-2 text-[11px] font-bold block ${activeTab === 'LOANS' ? 'text-white font-extrabold' : 'text-slate-455 hover:text-white'}`}
              >
                - CONSUMER LOANS
              </button>
            </div>
          </div>

          {/* Disbursal Tracker */}
          <div>
            <button 
              onClick={() => handleToggleMenu('disbursal')}
              className="w-full flex items-center justify-between px-4 py-3 text-xs font-bold text-slate-355 hover:bg-white/5 hover:text-white rounded-xl transition-all"
            >
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="w-4 h-4 text-indigo-400" />
                <span>Disbursal Tracker</span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 transition-all ${disbursalMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            
            <div className={`pl-9 pr-2 space-y-1 bg-white/5 rounded-xl mt-0.5 overflow-hidden transition-all duration-300 ease-in-out ${disbursalMenuOpen ? 'max-h-24 opacity-100 py-1' : 'max-h-0 opacity-0 py-0 pointer-events-none'}`}>
              <button 
                onClick={() => { setActiveTab('DISBURSAL_TRACKER'); }}
                className={`w-full text-left py-2 text-[11px] font-bold block ${activeTab === 'DISBURSAL_TRACKER' ? 'text-white font-extrabold' : 'text-slate-455 hover:text-white'}`}
              >
                - CONSUMER LOANS
              </button>
            </div>
          </div>

          {/* Administration Menu */}
          <div>
            <button 
              onClick={() => handleToggleMenu('admin')}
              className="w-full flex items-center justify-between px-4 py-3 text-xs font-bold text-slate-355 hover:bg-white/5 hover:text-white rounded-xl transition-all border-t border-white/5 pt-3 mt-2"
            >
              <div className="flex items-center gap-3">
                <Lock className="w-4 h-4 text-indigo-400" />
                <span>Administration</span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 transition-all ${adminMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            
            <div className={`pl-9 pr-2 space-y-1 bg-white/5 rounded-xl mt-0.5 overflow-hidden transition-all duration-300 ease-in-out ${adminMenuOpen ? 'max-h-48 opacity-100 py-1' : 'max-h-0 opacity-0 py-0 pointer-events-none'}`}>
              <button 
                onClick={() => { setActiveTab('APPLICATIONS'); }}
                className={`w-full text-left py-2 text-[11px] font-bold block ${activeTab === 'APPLICATIONS' ? 'text-white font-extrabold' : 'text-slate-450 hover:text-white'}`}
              >
                - UNDERWRITING QUEUE
              </button>
              <button 
                onClick={() => { setActiveTab('PRODUCTS'); }}
                className={`w-full text-left py-2 text-[11px] font-bold block ${activeTab === 'PRODUCTS' ? 'text-white font-extrabold' : 'text-slate-450 hover:text-white'}`}
              >
                - LOAN PRODUCTS
              </button>
              <button 
                onClick={() => { setActiveTab('RULES'); }}
                className={`w-full text-left py-2 text-[11px] font-bold block ${activeTab === 'RULES' ? 'text-white font-extrabold' : 'text-slate-450 hover:text-white'}`}
              >
                - ELIGIBILITY RULES
              </button>
              <button 
                onClick={() => { setActiveTab('AUDIT_LOGS'); }}
                className={`w-full text-left py-2 text-[11px] font-bold block ${activeTab === 'AUDIT_LOGS' ? 'text-white font-extrabold' : 'text-slate-450 hover:text-white'}`}
              >
                - SECURITY AUDIT LOGS
              </button>
            </div>
          </div>

          {/* Messages / Support */}
          <button
            onClick={() => { setActiveTab('MESSAGES'); }}
            className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'MESSAGES' 
                ? 'bg-white/10 text-white border-l-4 border-indigo-400 font-extrabold' 
                : 'text-slate-350 hover:bg-white/5 hover:text-white'
            }`}
          >
            <MessageSquare className="w-4 h-4 shrink-0 text-indigo-400" />
            <span>Messages / Support</span>
          </button>
        </>
      );
    }

    if (isCustomer) {
      return (
        <>
          <button
            onClick={() => setActiveTab('loan')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-semibold rounded-xl transition-all ${
              activeTab === 'loan' 
                ? 'bg-white/10 text-white border-l-4 border-white' 
                : 'text-slate-300 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Coins className="w-4 h-4 shrink-0" />
            <span>Active Loan & Repayments</span>
          </button>

          <button
            onClick={() => setActiveTab('mandate')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-semibold rounded-xl transition-all ${
              activeTab === 'mandate' 
                ? 'bg-white/10 text-white border-l-4 border-white' 
                : 'text-slate-300 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Landmark className="w-4 h-4 shrink-0" />
            <span>E-Mandate Details</span>
          </button>

          <button
            onClick={() => setActiveTab('documents')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-semibold rounded-xl transition-all ${
              activeTab === 'documents' 
                ? 'bg-white/10 text-white border-l-4 border-white' 
                : 'text-slate-300 hover:bg-white/5 hover:text-white'
            }`}
          >
            <FileUp className="w-4 h-4 shrink-0" />
            <span>Uploaded KYC Documents</span>
          </button>

          {/* Messages / Support */}
          <button
            onClick={() => setActiveTab('messages')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-semibold rounded-xl transition-all ${
              activeTab === 'messages' 
                ? 'bg-white/10 text-white border-l-4 border-white' 
                : 'text-slate-300 hover:bg-white/5 hover:text-white'
            }`}
          >
            <MessageSquare className="w-4 h-4 shrink-0" />
            <span>Messages / Support</span>
          </button>
        </>
      );
    }

    return null;
  };

  const renderSidebarFooter = () => {
    if (user.role === 'MERCHANT') {
      return (
        <div className="p-4 border-t border-white/10 text-[10px] text-slate-300 text-center font-bold uppercase tracking-wider bg-black/10">
          Store Console : ID {user.id.substring(0,6)}
        </div>
      );
    } else if (user.role === 'CUSTOMER') {
      return (
        <div className="p-4 border-t border-white/10 text-[10px] text-slate-400 text-center font-bold uppercase tracking-wider">
          Customer Portal : {user.phoneNumber}
        </div>
      );
    } else {
      return (
        <div className="p-4 border-t border-white/10 text-[9px] text-slate-400 text-center font-bold uppercase tracking-widest bg-black/10">
          Console Version 1.0.4
        </div>
      );
    }
  };

  const getProfileSummaryName = () => {
    if (user.role === 'MERCHANT') {
      return user.profile?.fullName || user.email || user.phoneNumber || 'Merchant User';
    } else if (user.role === 'CUSTOMER') {
      return user.profile?.fullName || user.phoneNumber || 'Customer User';
    } else {
      return user.profile?.fullName || 'System Admin';
    }
  };

  const getProfileSummarySubtitle = () => {
    if (user.role === 'MERCHANT') {
      return user.profile?.shopName || 'MERCHANT';
    } else if (user.role === 'CUSTOMER') {
      return 'CUSTOMER PORTAL';
    } else {
      return 'ADMIN ROLE';
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="flex flex-1 h-screen overflow-hidden bg-[#F1F3F9] font-sans">
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-64 bg-[#1E2B58] text-white flex flex-col justify-between shrink-0 shadow-2xl transition-all duration-300 z-50">
        <div className="flex flex-col">
          {/* Logo container */}
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <span className="text-2xl font-black tracking-wider text-white">Oysterpls</span>
            <span className="px-2 py-0.5 rounded text-[8px] bg-indigo-500/20 text-indigo-300 font-bold uppercase tracking-widest border border-indigo-500/30">
              {getRoleBadgeText()}
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5 overflow-y-auto max-h-[78vh]">
            {renderSidebarLinks()}
          </nav>
        </div>

        {renderSidebarFooter()}
      </aside>

      {/* DYNAMIC CONTENT AREA */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* PREMIUM GLOBAL NAVBAR */}
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0 shadow-sm z-40">
          <div className="flex items-center gap-3">
            {(!['MERCHANT', 'CUSTOMER'].includes(user.role)) && (
              <>
                <span className="text-[13px] font-bold text-[#1E2B58] uppercase tracking-wider bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl shadow-xs">
                  Branch: CK_JALORE-1
                </span>
                <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                  • Admin Location: {user.profile?.city && user.profile?.state ? `${user.profile.city}, ${user.profile.state}` : 'Jalore, Rajasthan'}
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-6">
            {/* DEV MODE TOGGLE BUTTON */}
            <button
              onClick={() => {
                const val = !isDevMode;
                setIsDevMode(val);
                localStorage.setItem('dev_mode', String(val));
              }}
              className={`px-3 py-1.5 text-[11px] font-bold rounded-xl border transition-all ${
                isDevMode
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 hover:bg-amber-500/20'
                  : 'bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200'
              }`}
            >
              {isDevMode ? '🛠 Dev Mode: ON' : '🛡 Production Mode'}
            </button>

            {/* DEVELOPMENT ROLE SWITCHER SIMULATOR */}
            {isDevMode && (
              <div className="flex items-center bg-slate-100 border border-slate-200 rounded-2xl px-3.5 py-1.5 gap-2 text-xs font-semibold">
                <span className="text-slate-500">Developer Switch:</span>
                <select
                  value={user.role}
                  onChange={(e) => switchRole(e.target.value)}
                  className="bg-transparent border-none text-indigo-600 focus:outline-none cursor-pointer font-bold uppercase"
                >
                  <option value="CUSTOMER">Customer View</option>
                  <option value="MERCHANT">Merchant View</option>
                  <option value="ADMIN">Admin Console</option>
                  <option value="SUPER_ADMIN">Super Admin View</option>
                </select>
              </div>
            )}

            <div className="h-8 w-px bg-slate-200" />

            {/* Profile Dropdown */}
            <div className="relative text-right flex items-center gap-3">
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center gap-2.5 hover:bg-slate-50 p-1.5 rounded-xl transition-all focus:outline-none text-left"
              >
                {user.profilePictureUrl ? (
                  <img src={user.profilePictureUrl} alt="Avatar" className="w-8 h-8 rounded-full object-cover border border-indigo-200 shrink-0" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                    {getProfileSummaryName().charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="text-left hidden sm:block">
                  <span className="block text-xs font-black text-slate-900 leading-tight">
                    {getProfileSummaryName()}
                  </span>
                  <span className="block text-[9px] text-slate-405 font-bold uppercase tracking-wider mt-0.5">
                    {getProfileSummarySubtitle()}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              </button>

              {showUserDropdown && (
                <div className="absolute right-0 top-12 w-48 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 py-2 font-semibold text-xs text-slate-705 text-left font-sans animate-fadeIn">
                  {user.role === 'MERCHANT' && (
                    <>
                      <button 
                        onClick={() => { setShowUserDropdown(false); onOpenProfile?.(); }}
                        className="w-full px-4 py-2.5 hover:bg-slate-50 flex items-center gap-2.5 transition-colors text-slate-700 font-bold"
                      >
                        <User className="w-4 h-4 text-indigo-500" />
                        <span>Profile</span>
                      </button>
                      <button 
                        onClick={() => { setShowUserDropdown(false); onOpenDocs?.(); }}
                        className="w-full px-4 py-2.5 hover:bg-slate-50 flex items-center gap-2.5 transition-colors text-slate-700 font-bold border-t border-slate-100"
                      >
                        <FolderOpen className="w-4 h-4 text-indigo-500" />
                        <span>Uploaded Docs</span>
                      </button>
                    </>
                  )}
                  <button 
                    onClick={() => { 
                      setShowUserDropdown(false); 
                      setProfileForm({
                        fullName: user.profile?.fullName || '',
                        email: user.email || '',
                        phoneNumber: user.phoneNumber || '',
                        dob: user.profile?.dob ? new Date(user.profile.dob).toISOString().split('T')[0] : '',
                        addressLine1: user.profile?.addressLine1 || '',
                        addressLine2: user.profile?.addressLine2 || '',
                        pincode: user.profile?.pincode || '',
                        city: user.profile?.city || '',
                        state: user.profile?.state || ''
                      });
                      setAvatarUrl(user.profilePictureUrl || '');
                      setSettingsError('');
                      setSettingsSuccess('');
                      setShowSettingsModal(true); 
                    }}
                    className="w-full px-4 py-2.5 hover:bg-slate-50 flex items-center gap-2.5 transition-colors text-slate-700 font-bold border-t border-slate-100"
                  >
                    <Settings className="w-4 h-4 text-indigo-500" />
                    <span>Settings</span>
                  </button>
                  <button 
                    onClick={async () => { setShowUserDropdown(false); await logout(); }}
                    className="w-full px-4 py-2.5 hover:bg-rose-50 text-rose-600 flex items-center gap-2.5 transition-colors font-bold border-t border-slate-100"
                  >
                    <ShieldAlert className="w-4 h-4 text-rose-500" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* WORKSPACE AREA WITH SCROLLING AND BANNER ALERTS */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-[#F4F6FD]">
          {/* Centralized Banners */}
          {error && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-250 text-rose-600 rounded-2xl text-center text-xs font-bold shadow-sm animate-fadeIn">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-250 text-emerald-600 rounded-2xl text-center text-xs font-bold shadow-sm animate-fadeIn">
              {success}
            </div>
          )}

          {children}
        </main>
      </div>

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 md:p-8 w-full max-w-xl space-y-6 animate-scaleUp text-slate-800 relative">
            <div className="flex justify-between items-center border-b border-slate-150 pb-3">
              <h3 className="font-extrabold text-[#1E2B58] text-base flex items-center gap-2">
                <Settings className="w-5 h-5 text-indigo-500" />
                <span>Account Settings</span>
              </h3>
              <button 
                onClick={() => setShowSettingsModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            {settingsError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold text-center">
                {settingsError}
              </div>
            )}
            {settingsSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 text-xs font-bold text-center">
                {settingsSuccess}
              </div>
            )}

            {/* Profile Picture Upload Section */}
            <div className="flex flex-col sm:flex-row items-center gap-6 border-b border-slate-100 pb-5">
              <div className="w-20 h-20 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center overflow-hidden shrink-0 relative group">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-black text-indigo-700">{profileForm.fullName.charAt(0).toUpperCase() || '?'}</span>
                )}
              </div>
              <div className="flex-1 space-y-2 text-center sm:text-left">
                <span className="text-slate-500 text-xs font-bold block uppercase tracking-wide">Profile Photo</span>
                <label className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-150 text-indigo-700 rounded-xl cursor-pointer text-xs font-bold transition-all">
                  <Camera className="w-4 h-4" />
                  <span>Upload Photo</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setSettingsError('');
                      setSettingsSuccess('');
                      
                      const formData = new FormData();
                      formData.append('file', file);
                      try {
                        const res = await fetch('/api/profile/upload-avatar', {
                          method: 'POST',
                          body: formData,
                        });
                        const data = await res.json();
                        if (!res.ok) throw new Error(data.error || 'Failed to upload photo');
                        setAvatarUrl(data.url);
                        setSettingsSuccess('Profile picture updated successfully!');
                        user.profilePictureUrl = data.url;
                      } catch (err: any) {
                        setSettingsError(err.message || 'Avatar upload failed.');
                      }
                    }} 
                  />
                </label>
                <p className="text-[10px] text-slate-400">Optimize WebP automatic resizing up to 1200px footprint.</p>
              </div>
            </div>

            {/* Personal Details Form */}
            <form 
              onSubmit={async (e) => {
                e.preventDefault();
                setSettingsError('');
                setSettingsSuccess('');
                setUpdatingSettings(true);

                try {
                  const res = await fetch('/api/profile/update', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(profileForm),
                  });
                  const data = await res.json();
                  if (!res.ok) throw new Error(data.error || 'Failed to update settings');
                  setSettingsSuccess('Personal details updated successfully!');
                  
                  if (user) {
                    if (!user.profile) user.profile = {};
                    user.profile.fullName = profileForm.fullName;
                    user.email = profileForm.email;
                    user.phoneNumber = profileForm.phoneNumber;
                    user.profile.dob = profileForm.dob ? new Date(profileForm.dob).toISOString() : null;
                    user.profile.addressLine1 = profileForm.addressLine1;
                    user.profile.addressLine2 = profileForm.addressLine2;
                    user.profile.pincode = profileForm.pincode;
                    user.profile.city = profileForm.city;
                    user.profile.state = profileForm.state;
                  }
                  setTimeout(() => {
                    setShowSettingsModal(false);
                  }, 1200);
                } catch (err: any) {
                  setSettingsError(err.message || 'Failed to save settings.');
                } finally {
                  setUpdatingSettings(false);
                }
              }} 
              className="space-y-4 text-xs font-bold text-slate-700"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 mb-1 uppercase tracking-wide">Full Name</label>
                  <input 
                    type="text" 
                    required 
                    value={profileForm.fullName}
                    onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl font-semibold text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1 uppercase tracking-wide">Email ID</label>
                  <input 
                    type="email" 
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl font-semibold text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 mb-1 uppercase tracking-wide">Phone Number</label>
                  <input 
                    type="text" 
                    value={profileForm.phoneNumber}
                    onChange={(e) => setProfileForm({ ...profileForm, phoneNumber: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl font-semibold text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                {user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN' ? (
                  <div>
                    <label className="block text-slate-500 mb-1 uppercase tracking-wide">Date of Birth</label>
                    <input 
                      type="date" 
                      value={profileForm.dob}
                      onChange={(e) => setProfileForm({ ...profileForm, dob: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-xl font-semibold text-slate-800 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                ) : (
                  <div className="hidden"></div>
                )}
              </div>

              {/* Address details only for Customers/Merchants */}
              {user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN' && (
                <div className="space-y-3 pt-2">
                  <span className="block border-b border-slate-100 pb-1.5 text-slate-400 uppercase tracking-wider text-[10px]">Store/Home Address Details</span>
                  
                  <div>
                    <label className="block text-slate-500 mb-1 uppercase tracking-wide">Address Line 1</label>
                    <input 
                      type="text" 
                      value={profileForm.addressLine1}
                      onChange={(e) => setProfileForm({ ...profileForm, addressLine1: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-xl font-semibold text-slate-800 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-500 mb-1 uppercase tracking-wide">Address Line 2 (Optional)</label>
                      <input 
                        type="text" 
                        value={profileForm.addressLine2}
                        onChange={(e) => setProfileForm({ ...profileForm, addressLine2: e.target.value })}
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-xl font-semibold text-slate-800 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1 uppercase tracking-wide">Pincode</label>
                      <input 
                        type="text" 
                        maxLength={6}
                        value={profileForm.pincode}
                        onChange={(e) => setProfileForm({ ...profileForm, pincode: e.target.value.replace(/[^0-9]/g, '') })}
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-xl font-semibold text-slate-800 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-500 mb-1 uppercase tracking-wide">City</label>
                      <input 
                        type="text" 
                        value={profileForm.city}
                        onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-xl font-semibold text-slate-800 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1 uppercase tracking-wide">State</label>
                      <input 
                        type="text" 
                        value={profileForm.state}
                        onChange={(e) => setProfileForm({ ...profileForm, state: e.target.value })}
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-xl font-semibold text-slate-800 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="px-4 py-2.5 border border-slate-250 bg-white hover:bg-slate-50 rounded-xl text-slate-705 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingSettings}
                  className="px-5 py-2.5 bg-[#1E2B58] hover:bg-[#1a254c] disabled:bg-slate-300 text-white font-bold rounded-xl shadow-md flex items-center gap-1.5"
                >
                  {updatingSettings ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
