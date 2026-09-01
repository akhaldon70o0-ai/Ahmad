import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import {
  Store,
  Building2,
  Lock,
  Mail,
  User as UserIcon,
  KeyRound,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  CheckCircle,
  Layers,
  Smartphone,
  AlertCircle,
  LogIn,
  Coins,
  MessageSquare,
  MessageCircle,
  Phone,
  Send,
  Copy,
  Check,
  Key,
  Trash2,
  RefreshCw,
  Crown,
  FileText,
  Clock,
  ArrowLeft,
  LogOut,
  Zap,
  Gift,
  Flame,
} from 'lucide-react';
import { StoreMeta, StoreAccessRequest, ActivationCode } from '../types';

const POPULAR_CURRENCIES = [
  { code: '$', label: '$ (USD / AUD / CAD)' },
  { code: '€', label: '€ (EUR)' },
  { code: '£', label: '£ (GBP)' },
  { code: 'SAR', label: 'SAR (Saudi Riyal)' },
  { code: 'AED', label: 'AED (UAE Dirham)' },
  { code: 'EGP', label: 'EGP (Egyptian Pound)' },
  { code: 'KWD', label: 'KWD (Kuwaiti Dinar)' },
  { code: 'QAR', label: 'QAR (Qatari Riyal)' },
  { code: 'OMR', label: 'OMR (Omani Rial)' },
  { code: 'JOD', label: 'JOD (Jordanian Dinar)' },
  { code: 'BHD', label: 'BHD (Bahraini Dinar)' },
  { code: '₹', label: '₹ (INR)' },
];

export const MultiStorePortal: React.FC = () => {
  const {
    createStore,
    loginToStore,
    listStoresForEmail,
    masterAdminEmail,
    masterAdminPhone,
    masterAdminPhoneIntl,
    masterAdminWhatsapp,
    submitAccessRequest,
    getAccessRequests,
    updateAccessRequest,
    generateActivationCode,
    getActivationCodes,
    getAllMasterStores,
    deleteMasterStore,
    extendStoreTrial,
    updateCurrentStoreMeta,
    requestOwnerOtp,
    verifyOwnerOtp,
  } = useStore();

  const [activeTab, setActiveTab] = useState<'login' | 'trial' | 'activate' | 'request' | 'admin'>('login');

  // ================= SIGN IN STATE =================
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [availableStores, setAvailableStores] = useState<StoreMeta[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');

  // ================= 7-DAY FREE TRIAL STATE =================
  const [trialStoreName, setTrialStoreName] = useState('');
  const [trialOwnerName, setTrialOwnerName] = useState('');
  const [trialOwnerEmail, setTrialOwnerEmail] = useState('');
  const [trialCurrency, setTrialCurrency] = useState('JOD');
  const [trialPin, setTrialPin] = useState('1234');
  const [trialPassword, setTrialPassword] = useState('');
  const [trialConfirmPassword, setTrialConfirmPassword] = useState('');
  const [showTrialPassword, setShowTrialPassword] = useState(false);
  const [trialError, setTrialError] = useState('');
  const [isStartingTrial, setIsStartingTrial] = useState(false);

  // ================= ACTIVATE STORE STATE =================
  const [actStoreName, setActStoreName] = useState('');
  const [actOwnerName, setActOwnerName] = useState('');
  const [actOwnerEmail, setActOwnerEmail] = useState('');
  const [actCurrency, setActCurrency] = useState('$');
  const [actPin, setActPin] = useState('1234');
  const [actPassword, setActPassword] = useState('');
  const [actConfirmPassword, setActConfirmPassword] = useState('');
  const [showActPassword, setShowActPassword] = useState(false);
  const [actLicenseCode, setActLicenseCode] = useState('');
  const [actError, setActError] = useState('');
  const [isActivating, setIsActivating] = useState(false);

  // ================= REQUEST ACCESS STATE =================
  const [reqBusinessName, setReqBusinessName] = useState('');
  const [reqContactName, setReqContactName] = useState('');
  const [reqContactEmail, setReqContactEmail] = useState('');
  const [reqContactPhone, setReqContactPhone] = useState('');
  const [reqCurrency, setReqCurrency] = useState('$');
  const [reqNotes, setReqNotes] = useState('');
  const [reqSubmitting, setReqSubmitting] = useState(false);
  const [reqSubmitted, setReqSubmitted] = useState<string | null>(null);
  const [reqError, setReqError] = useState('');

  // ================= MASTER ADMIN STATE & 2-STEP EMAIL OTP =================
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [adminAuthStep, setAdminAuthStep] = useState<'email' | 'otp'>('email');
  const [ownerEmailInput, setOwnerEmailInput] = useState(masterAdminEmail || 'akhaldon7.0o0@gmail.com');
  const [ownerOtpInput, setOwnerOtpInput] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [adminError, setAdminError] = useState('');
  const [adminSubTab, setAdminSubTab] = useState<'requests' | 'codes' | 'stores' | 'provision'>('requests');
  const [adminRequests, setAdminRequests] = useState<StoreAccessRequest[]>([]);
  const [adminCodes, setAdminCodes] = useState<ActivationCode[]>([]);
  const [adminStores, setAdminStores] = useState<StoreMeta[]>([]);
  const [isLoadingAdminData, setIsLoadingAdminData] = useState(false);

  // New Code Generation in Admin
  const [newCodeCustom, setNewCodeCustom] = useState('');
  const [newCodeForEmail, setNewCodeForEmail] = useState('');
  const [newCodeForBusiness, setNewCodeForBusiness] = useState('');
  const [newCodeNotes, setNewCodeNotes] = useState('');
  const [codeGenSuccess, setCodeGenSuccess] = useState('');

  // Direct Provision in Admin
  const [provStoreName, setProvStoreName] = useState('');
  const [provOwnerName, setProvOwnerName] = useState('');
  const [provOwnerEmail, setProvOwnerEmail] = useState('');
  const [provPassword, setProvPassword] = useState('');
  const [provCurrency, setProvCurrency] = useState('$');
  const [provSuccess, setProvSuccess] = useState('');
  const [provError, setProvError] = useState('');
  const [isProvisioning, setIsProvisioning] = useState(false);

  // Copy feedback
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Delete Store Modal & Feedback state
  const [storeToDelete, setStoreToDelete] = useState<StoreMeta | null>(null);
  const [isDeletingStore, setIsDeletingStore] = useState(false);
  const [adminBanner, setAdminBanner] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Resend Countdown Timer effect
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  // Check saved session on mount
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('storeledger_owner_session');
      if (saved === 'true') {
        setAdminUnlocked(true);
      }
    } catch (e) {}
  }, []);

  // Handle Login Submit
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!loginIdentifier.trim()) {
      setLoginError('Please enter your store email address or username.');
      return;
    }

    setIsLoggingIn(true);
    try {
      const res = await loginToStore(loginIdentifier.trim(), loginPassword, selectedStoreId || undefined);
      if (!res.success) {
        setLoginError(res.error || 'Failed to sign in. Please verify your email and password.');
        if (loginIdentifier.includes('@')) {
          const stores = await listStoresForEmail(loginIdentifier.trim());
          if (stores.length > 1) {
            setAvailableStores(stores);
            setSelectedStoreId(stores[0].id);
          }
        }
      }
    } catch (err: unknown) {
      setLoginError((err as Error).message || 'An error occurred during authentication.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handle 7-Day Free Trial Submit
  const handleStartFreeTrial = async (e: React.FormEvent) => {
    e.preventDefault();
    setTrialError('');

    if (!trialStoreName.trim()) {
      setTrialError('Please provide your store / business name.');
      return;
    }
    if (!trialOwnerName.trim()) {
      setTrialError('Please provide owner / manager name.');
      return;
    }
    if (!trialOwnerEmail.trim() || !trialOwnerEmail.includes('@')) {
      setTrialError('Please provide a valid owner email.');
      return;
    }
    if (trialPassword && trialPassword.length < 4) {
      setTrialError('Password must be at least 4 characters.');
      return;
    }
    if (trialPassword !== trialConfirmPassword) {
      setTrialError('Passwords do not match.');
      return;
    }

    setIsStartingTrial(true);
    try {
      const res = await createStore({
        storeName: trialStoreName.trim(),
        ownerName: trialOwnerName.trim(),
        ownerEmail: trialOwnerEmail.trim().toLowerCase(),
        password: trialPassword,
        pin: trialPin.trim() || '1234',
        currency: trialCurrency,
        isTrial: true,
      });

      if (!res.success) {
        setTrialError(res.error || 'Failed to start 7-day free trial.');
      }
    } catch (err: unknown) {
      setTrialError((err as Error).message || 'An error occurred while starting trial.');
    } finally {
      setIsStartingTrial(false);
    }
  };

  // Handle Activate Store Submit
  const handleActivateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    setActError('');

    if (!actStoreName.trim()) {
      setActError('Please provide a name for your store.');
      return;
    }
    if (!actOwnerName.trim()) {
      setActError('Please provide the store owner or manager name.');
      return;
    }
    if (!actOwnerEmail.trim() || !actOwnerEmail.includes('@')) {
      setActError('Please provide a valid owner email address.');
      return;
    }
    if (!actLicenseCode.trim()) {
      setActError(`An Activation License Key is strictly required. Please contact administrator Khaldon at ${masterAdminEmail} or WhatsApp ${masterAdminPhone} to obtain one.`);
      return;
    }
    if (actPassword && actPassword.length < 4) {
      setActError('Password must be at least 4 characters long.');
      return;
    }
    if (actPassword !== actConfirmPassword) {
      setActError('Passwords do not match.');
      return;
    }

    setIsActivating(true);
    try {
      const res = await createStore({
        storeName: actStoreName.trim(),
        ownerName: actOwnerName.trim(),
        ownerEmail: actOwnerEmail.trim().toLowerCase(),
        password: actPassword,
        pin: actPin.trim() || '1234',
        currency: actCurrency,
        activationCode: actLicenseCode.trim().toUpperCase(),
      });

      if (!res.success) {
        setActError(res.error || 'Failed to create store. Please check your activation code.');
      }
    } catch (err: unknown) {
      setActError((err as Error).message || 'An error occurred while creating store.');
    } finally {
      setIsActivating(false);
    }
  };

  // Handle Request Submission
  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setReqError('');

    if (!reqBusinessName.trim()) {
      setReqError('Please enter your business or store name.');
      return;
    }
    if (!reqContactName.trim()) {
      setReqError('Please enter your contact name.');
      return;
    }
    if (!reqContactEmail.trim() || !reqContactEmail.includes('@')) {
      setReqError('Please provide a valid email address.');
      return;
    }

    setReqSubmitting(true);
    try {
      const res = await submitAccessRequest({
        businessName: reqBusinessName.trim(),
        contactName: reqContactName.trim(),
        contactEmail: reqContactEmail.trim().toLowerCase(),
        contactPhone: reqContactPhone.trim(),
        currency: reqCurrency,
        notes: reqNotes.trim(),
      });

      if (res.success) {
        setReqSubmitted(res.id);
      } else {
        setReqError(res.error || `Failed to submit request. Please reach out to ${masterAdminEmail} or WhatsApp ${masterAdminPhone} directly.`);
      }
    } catch (err: unknown) {
      setReqError((err as Error).message || 'Failed to submit request.');
    } finally {
      setReqSubmitting(false);
    }
  };

  // ================= 2-STEP OWNER OTP HANDLERS =================

  // Step 1: Request OTP for Owner Email
  const handleSendOwnerOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAdminError('');
    const email = ownerEmailInput.trim().toLowerCase();
    if (!email || !email.includes('@')) {
      setAdminError('Please enter a valid owner email address.');
      return;
    }

    setIsSendingOtp(true);
    try {
      const res = await requestOwnerOtp(email);
      if (res.success) {
        setAdminAuthStep('otp');
        setResendCountdown(60);
        setOwnerOtpInput('');
      } else {
        setAdminError(res.error || 'Failed to dispatch verification code to email.');
      }
    } catch (err: unknown) {
      setAdminError((err as Error).message || 'Failed to dispatch verification code.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOwnerOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError('');
    const code = ownerOtpInput.trim();
    if (!code) {
      setAdminError('Please enter the 6-digit verification code sent to your email.');
      return;
    }

    setIsVerifyingOtp(true);
    try {
      const res = await verifyOwnerOtp(ownerEmailInput.trim().toLowerCase(), code);
      if (res.valid) {
        setAdminUnlocked(true);
        try {
          sessionStorage.setItem('storeledger_owner_session', 'true');
        } catch (e) {}
        loadAdminData();
      } else {
        setAdminError(res.reason || 'Invalid verification code. Please check your email and try again.');
      }
    } catch (err: unknown) {
      setAdminError((err as Error).message || 'Verification failed. Please try again.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleAdminLock = () => {
    setAdminUnlocked(false);
    setAdminAuthStep('email');
    setOwnerOtpInput('');
    try {
      sessionStorage.removeItem('storeledger_owner_session');
    } catch (e) {}
  };

  const loadAdminData = async () => {
    setIsLoadingAdminData(true);
    try {
      const [reqs, codes, stores] = await Promise.all([
        getAccessRequests(),
        getActivationCodes(),
        getAllMasterStores(),
      ]);
      setAdminRequests(reqs);
      setAdminCodes(codes);
      setAdminStores(stores);
    } catch (e) {
      console.warn('Failed to load admin data:', e);
    } finally {
      setIsLoadingAdminData(false);
    }
  };

  useEffect(() => {
    if (adminUnlocked && activeTab === 'admin') {
      loadAdminData();
    }
  }, [adminUnlocked, activeTab]);

  // Admin: Approve Request & Generate Code
  const handleApproveRequest = async (req: StoreAccessRequest) => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const cleanBiz = req.businessName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 6) || 'STORE';
    const generated = `KEY-${cleanBiz}-${randomSuffix}`;

    // Create the code
    await generateActivationCode(generated, req.contactEmail, req.businessName, `Approved from request #${req.id}`);
    // Update request
    await updateAccessRequest(req.id, 'approved', generated);
    await loadAdminData();
  };

  // Admin: Reject Request
  const handleRejectRequest = async (req: StoreAccessRequest) => {
    await updateAccessRequest(req.id, 'rejected');
    await loadAdminData();
  };

  // Admin: Generate Custom Code
  const handleCreateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setCodeGenSuccess('');
    let codeToUse = newCodeCustom.trim().toUpperCase();
    if (!codeToUse) {
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      codeToUse = `STORE-${randomSuffix}-${Math.floor(100 + Math.random() * 900)}`;
    }

    const res = await generateActivationCode(
      codeToUse,
      newCodeForEmail.trim() || undefined,
      newCodeForBusiness.trim() || undefined,
      newCodeNotes.trim() || undefined
    );

    if (res.success) {
      setCodeGenSuccess(`Created license key: ${codeToUse}`);
      setNewCodeCustom('');
      setNewCodeForEmail('');
      setNewCodeForBusiness('');
      setNewCodeNotes('');
      await loadAdminData();
    }
  };

  // Admin: Direct Provision Store
  const handleDirectProvision = async (e: React.FormEvent) => {
    e.preventDefault();
    setProvError('');
    setProvSuccess('');

    if (!provStoreName.trim() || !provOwnerEmail.trim()) {
      setProvError('Store name and owner email are required.');
      return;
    }

    setIsProvisioning(true);
    try {
      // Direct provision uses master bypass
      const res = await createStore({
        storeName: provStoreName.trim(),
        ownerName: provOwnerName.trim() || 'Store Owner',
        ownerEmail: provOwnerEmail.trim().toLowerCase(),
        password: provPassword.trim() || '1234',
        pin: '1234',
        currency: provCurrency,
        activationCode: 'KHALDON-ADMIN-2026',
      });

      if (res.success) {
        setProvSuccess(`Store "${provStoreName}" provisioned successfully for ${provOwnerEmail}!`);
        setProvStoreName('');
        setProvOwnerName('');
        setProvOwnerEmail('');
        setProvPassword('');
        await loadAdminData();
      } else {
        setProvError(res.error || 'Failed to provision store.');
      }
    } catch (err: unknown) {
      setProvError((err as Error).message || 'Failed to provision store.');
    } finally {
      setIsProvisioning(false);
    }
  };

  // Admin: Extend Store Trial
  const handleAdminExtendTrial = async (storeId: string, storeName: string) => {
    setAdminBanner(null);
    const res = await extendStoreTrial(storeId, 7);
    if (res.success) {
      setAdminBanner({
        type: 'success',
        text: `Trial for "${storeName}" was extended by +7 days successfully!`,
      });
      await loadAdminData();
    } else {
      setAdminBanner({
        type: 'error',
        text: res.error || 'Failed to extend trial.',
      });
    }
  };

  // Admin: Grant Full Lifetime License
  const handleAdminGrantFullLicense = async (storeId: string, storeName: string) => {
    setAdminBanner(null);
    const res = await extendStoreTrial(storeId, 3650); // 10 years or full license
    if (res.success) {
      setAdminBanner({
        type: 'success',
        text: `Store "${storeName}" has been upgraded to a Full Lifetime License!`,
      });
      await loadAdminData();
    } else {
      setAdminBanner({
        type: 'error',
        text: res.error || 'Failed to upgrade store.',
      });
    }
  };

  // Admin: Initiate Delete Store (Opens Modal)
  const handleInitiateDeleteStore = (store: StoreMeta) => {
    setAdminBanner(null);
    setStoreToDelete(store);
  };

  // Admin: Confirm Permanent Delete Store
  const handleConfirmDeleteStore = async () => {
    if (!storeToDelete) return;
    setIsDeletingStore(true);
    try {
      const res = await deleteMasterStore(storeToDelete.id);
      if (res.success) {
        setAdminStores((prev) => prev.filter((s) => s.id !== storeToDelete.id));
        setAdminBanner({
          type: 'success',
          text: `Store "${storeToDelete.name}" (${storeToDelete.id}) was permanently deleted.`,
        });
        setStoreToDelete(null);
        await loadAdminData();
      } else {
        setAdminBanner({
          type: 'error',
          text: res.error || 'Failed to delete store from cloud.',
        });
      }
    } catch (err: unknown) {
      setAdminBanner({
        type: 'error',
        text: (err as Error).message || 'Error occurred while deleting store.',
      });
    } finally {
      setIsDeletingStore(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-blue-600 selection:text-white relative overflow-hidden font-sans">
      {/* Ambient background glows */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Header */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 flex items-center justify-between border-b border-slate-800/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white font-black text-xl">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <div className="font-extrabold text-lg text-white tracking-tight leading-none">
              StoreLedger <span className="text-blue-400">Cloud</span>
            </div>
            <div className="text-[11px] text-slate-400 font-medium mt-0.5">
              Authorized Multi-Tenant POS & Store Engine
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/60 border border-emerald-500/30 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Protected Isolated Multi-Store
          </span>

          <button
            type="button"
            onClick={() => {
              setActiveTab('admin');
              setLoginError('');
              setActError('');
              setReqError('');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              activeTab === 'admin'
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-amber-300 hover:border-amber-500/30'
            }`}
          >
            <Crown className="w-3.5 h-3.5 text-amber-400" />
            <span>Admin / Owner Portal</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Value Proposition & Security Policy */}
          <div className="lg:col-span-5 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-bold text-blue-400">
              <Sparkles className="w-3.5 h-3.5" />
              Private & Encrypted Store Workspaces
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              One Cloud System. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-teal-300">
                Managed & Protected Stores.
              </span>
            </h1>

            <p className="text-sm text-slate-400 leading-relaxed">
              Every store created has its own private partition in the cloud. Store creation is protected by administrator license keys to guarantee performance and security.
            </p>

            {/* 7-DAY FREE TRIAL PROMO BANNER */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-slate-900 border border-amber-500/40 space-y-3 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-300 text-xs font-bold">
                  <Flame className="w-4 h-4 text-orange-400 animate-pulse" />
                  <span>Free 7-Day Full Trial</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-extrabold border border-amber-500/30">
                  NO KEY REQUIRED
                </span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed">
                Try StoreLedger POS free for a full week. Get POS checkout, barcode scanner, debt ledger, cloud backup, and staff accounts immediately!
              </p>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('trial');
                  setTrialError('');
                }}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Zap className="w-4 h-4" />
                <span>Start 7-Day Free Trial Now &rarr;</span>
              </button>
            </div>

            {/* Direct Contact Banner */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/50 to-slate-900/90 border border-indigo-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold">
                  <Crown className="w-4 h-4 text-amber-400" />
                  <span>Talk to the Platform Administrator (Khaldon)</span>
                </div>
                <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Direct Support
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Need a new store workspace, custom setup, or activation license key? Connect directly via WhatsApp, Phone, or Email:
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                <a
                  href={`https://wa.me/${masterAdminWhatsapp}?text=${encodeURIComponent(
                    'Hi Khaldon, I would like to request an activation key and get started on StoreLedger POS.'
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-emerald-600/25 hover:bg-emerald-600/40 text-emerald-300 hover:text-white border border-emerald-500/40 text-xs font-bold transition-all shadow-xs"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-400" />
                  <span>WhatsApp ({masterAdminPhone})</span>
                </a>

                <a
                  href={`tel:${masterAdminPhone}`}
                  className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-teal-600/20 hover:bg-teal-600/30 text-teal-300 hover:text-white border border-teal-500/30 text-xs font-bold transition-all"
                >
                  <Phone className="w-3.5 h-3.5 text-teal-400" />
                  <span>Call ({masterAdminPhone})</span>
                </a>

                <a
                  href={`mailto:${masterAdminEmail}?subject=StoreLedger%20New%20Store%20Access%20Request&body=Hi%20Khaldon%2C%0A%0AI%20would%20like%20to%20request%20access%20to%20create%20a%20new%20store%20workspace%20on%20StoreLedger%20POS.%0A%0AMy%20Business%20Name%3A%20%0AMy%20Name%3A%20%0AMy%20Phone%3A%20%0A%0AThank%20you!`}
                  className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 hover:text-white border border-blue-500/30 text-xs font-bold transition-all"
                >
                  <Mail className="w-3.5 h-3.5 text-blue-400" />
                  <span>Email Admin</span>
                </a>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800 text-[11px] text-slate-400">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Admin Contact: <strong className="text-slate-200">{masterAdminEmail}</strong> | <strong className="text-emerald-300">{masterAdminPhone}</strong></span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('request')}
                  className="inline-flex items-center gap-1 text-indigo-300 hover:text-indigo-200 font-bold transition-colors cursor-pointer"
                >
                  <span>Or fill web request form</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Feature Highlights */}
            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3 bg-slate-900/60 border border-slate-800/80 rounded-xl p-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">100% Private Store Partition</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Your products, sales, debt ledgers, and profits are strictly bound to your authorized store.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-slate-900/60 border border-slate-800/80 rounded-xl p-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Real-Time Multi-Device Sync</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Log in from your phone, iPad, or PC counter with instant live synchronization.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-slate-900/60 border border-slate-800/80 rounded-xl p-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Staff & Cashier Sub-Accounts</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Create cashier and manager logins with granular role permissions inside your store.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Portal Cards */}
          <div className="lg:col-span-7">
            <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl relative overflow-hidden">
              {/* Tab Selector */}
              <div className="grid grid-cols-2 sm:grid-cols-4 p-1 bg-slate-950/80 border border-slate-800 rounded-2xl mb-6 gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('login');
                    setLoginError('');
                    setTrialError('');
                    setActError('');
                    setReqError('');
                  }}
                  className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'login'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('trial');
                    setLoginError('');
                    setTrialError('');
                    setActError('');
                    setReqError('');
                  }}
                  className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all relative ${
                    activeTab === 'trial'
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black shadow-md'
                      : 'text-amber-400 hover:text-amber-300 hover:bg-amber-500/10'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  <span>7-Day Trial</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('activate');
                    setLoginError('');
                    setTrialError('');
                    setActError('');
                    setReqError('');
                  }}
                  className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'activate'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>Activate Key</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('request');
                    setLoginError('');
                    setTrialError('');
                    setActError('');
                    setReqError('');
                  }}
                  className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'request'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Request</span>
                </button>
              </div>

              {/* ================= TAB: 7-DAY FREE TRIAL ================= */}
              {activeTab === 'trial' && (
                <form onSubmit={handleStartFreeTrial} className="space-y-4 text-left">
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/5 border border-amber-500/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black">
                          <Zap className="w-4 h-4 fill-slate-950" />
                        </span>
                        <div>
                          <h3 className="text-sm font-black text-white">
                            Start 7-Day Free Trial
                          </h3>
                          <p className="text-[11px] text-amber-300">
                            No credit card and no license key required — test all POS features instantly.
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 text-[11px] text-slate-300 pt-1 border-t border-amber-500/20">
                      <div className="flex items-center gap-1 text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Full POS Checkout & Barcode Scanner</span>
                      </div>
                      <div className="flex items-center gap-1 text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Cloud Multi-Device Sync</span>
                      </div>
                      <div className="flex items-center gap-1 text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Customer Debts & Profit Reports</span>
                      </div>
                      <div className="flex items-center gap-1 text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>7 Days Complete Access</span>
                      </div>
                    </div>
                  </div>

                  {trialError && (
                    <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <div>{trialError}</div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Store Name */}
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-300">
                        Store / Business Name *
                      </label>
                      <div className="relative">
                        <Building2 className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          value={trialStoreName}
                          onChange={(e) => setTrialStoreName(e.target.value)}
                          placeholder="e.g. Hope Supermarket"
                          className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                    </div>

                    {/* Owner Name */}
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-300">
                        Owner / Manager Name *
                      </label>
                      <div className="relative">
                        <UserIcon className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          value={trialOwnerName}
                          onChange={(e) => setTrialOwnerName(e.target.value)}
                          placeholder="e.g. Khaldon"
                          className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Owner Email */}
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-300">
                        Login Email Address *
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          required
                          value={trialOwnerEmail}
                          onChange={(e) => setTrialOwnerEmail(e.target.value)}
                          placeholder="owner@mybusiness.com"
                          className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                    </div>

                    {/* Currency */}
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-300">
                        Store Currency
                      </label>
                      <div className="relative">
                        <Coins className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <select
                          value={trialCurrency}
                          onChange={(e) => setTrialCurrency(e.target.value)}
                          className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                        >
                          {POPULAR_CURRENCIES.map((c) => (
                            <option key={c.code} value={c.code}>
                              {c.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Password */}
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-300">
                        Password *
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type={showTrialPassword ? 'text' : 'password'}
                          required
                          value={trialPassword}
                          onChange={(e) => setTrialPassword(e.target.value)}
                          placeholder="At least 4 chars"
                          className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowTrialPassword(!showTrialPassword)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                        >
                          {showTrialPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-300">
                        Confirm Password *
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type={showTrialPassword ? 'text' : 'password'}
                          required
                          value={trialConfirmPassword}
                          onChange={(e) => setTrialConfirmPassword(e.target.value)}
                          placeholder="Repeat password"
                          className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                    </div>

                    {/* Quick PIN */}
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-300">
                        Quick Cashier PIN
                      </label>
                      <div className="relative">
                        <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          maxLength={6}
                          value={trialPin}
                          onChange={(e) => setTrialPin(e.target.value)}
                          placeholder="e.g. 1234"
                          className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isStartingTrial}
                    className="w-full mt-2 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black py-3.5 rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer text-sm"
                  >
                    {isStartingTrial ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                        Setting up your store & launching free trial...
                      </span>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 fill-slate-950" />
                        <span>🚀 Start 7-Day Free Trial Now</span>
                      </>
                    )}
                  </button>

                  <div className="text-center text-[11px] text-slate-400">
                    You can upgrade to a permanent full license at any time without losing any sales or product data.
                  </div>
                </form>
              )}

              {/* ================= TAB 1: SIGN IN ================= */}
              {activeTab === 'login' && (
                <form onSubmit={handleLogin} className="space-y-4 text-left">
                  <div>
                    <h3 className="text-lg font-extrabold text-white tracking-tight">
                      Open Your Store Workspace
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Enter the email or username associated with your store to load your private data.
                    </p>
                  </div>

                  {loginError && (
                    <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <div>{loginError}</div>
                    </div>
                  )}

                  {/* Multi-Branch Selector if detected */}
                  {availableStores.length > 1 && (
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-blue-400">
                        Select Branch / Store Partition
                      </label>
                      <select
                        value={selectedStoreId}
                        onChange={(e) => setSelectedStoreId(e.target.value)}
                        className="w-full bg-slate-950 border border-blue-500/50 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {availableStores.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} (Owner: {s.ownerEmail})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Identifier */}
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-300">
                      Store Email or Username
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={loginIdentifier}
                        onChange={(e) => setLoginIdentifier(e.target.value)}
                        placeholder="e.g. owner@example.com or admin"
                        className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-300">
                      Password or Admin PIN
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showLoginPassword ? 'text' : 'password'}
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="Enter password (or leave blank if none set)"
                        className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                      >
                        {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoggingIn}
                    className="w-full mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                  >
                    {isLoggingIn ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Verifying & Loading Store...
                      </span>
                    ) : (
                      <>
                        <span>Sign In & Open Store</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                    <span>Don't have a store account yet?</span>
                    <button
                      type="button"
                      onClick={() => setActiveTab('request')}
                      className="text-blue-400 hover:text-blue-300 font-semibold cursor-pointer"
                    >
                      Request store access &rarr;
                    </button>
                  </div>
                </form>
              )}

              {/* ================= TAB 2: ACTIVATE LICENSED STORE ================= */}
              {activeTab === 'activate' && (
                <form onSubmit={handleActivateStore} className="space-y-4 text-left">
                  <div>
                    <h3 className="text-lg font-extrabold text-white tracking-tight flex items-center gap-2">
                      <span>Activate Licensed Store</span>
                      <span className="px-2 py-0.5 text-[10px] uppercase tracking-wider font-bold bg-amber-500/20 text-amber-300 rounded-full border border-amber-500/30">
                        License Required
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Enter the Activation License Key provided by the administrator to unlock and initialize your store.
                    </p>
                  </div>

                  {actError && (
                    <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <div>{actError}</div>
                    </div>
                  )}

                  {/* Activation License Key */}
                  <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/40 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-amber-300 flex items-center gap-1.5">
                        <Key className="w-3.5 h-3.5 text-amber-400" />
                        Activation License Key *
                      </label>
                      <button
                        type="button"
                        onClick={() => setActiveTab('request')}
                        className="text-[11px] text-amber-400 hover:text-amber-200 underline font-medium"
                      >
                        Don't have a key? Request one &rarr;
                      </button>
                    </div>
                    <input
                      type="text"
                      required
                      value={actLicenseCode}
                      onChange={(e) => setActLicenseCode(e.target.value.toUpperCase())}
                      placeholder="e.g. KEY-MYSTORE-7842"
                      className="w-full bg-slate-950 border border-amber-500/50 rounded-lg px-3 py-2 text-xs font-mono font-bold text-amber-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500 tracking-wider"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Store Name */}
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-300">
                        Store / Business Name *
                      </label>
                      <div className="relative">
                        <Building2 className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          value={actStoreName}
                          onChange={(e) => setActStoreName(e.target.value)}
                          placeholder="e.g. Khaldon Tech Store"
                          className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    {/* Owner Name */}
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-300">
                        Owner / Admin Name *
                      </label>
                      <div className="relative">
                        <UserIcon className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          value={actOwnerName}
                          onChange={(e) => setActOwnerName(e.target.value)}
                          placeholder="e.g. John Doe"
                          className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Owner Email */}
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-300">
                        Owner Email (Account Login) *
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          required
                          value={actOwnerEmail}
                          onChange={(e) => setActOwnerEmail(e.target.value)}
                          placeholder="e.g. owner@business.com"
                          className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    {/* Currency */}
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-300">
                        Store Currency
                      </label>
                      <div className="relative">
                        <Coins className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <select
                          value={actCurrency}
                          onChange={(e) => setActCurrency(e.target.value)}
                          className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {POPULAR_CURRENCIES.map((c) => (
                            <option key={c.code} value={c.code}>
                              {c.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Password */}
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-300">
                        Password *
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type={showActPassword ? 'text' : 'password'}
                          required
                          value={actPassword}
                          onChange={(e) => setActPassword(e.target.value)}
                          placeholder="Min 4 chars"
                          className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-300">
                        Confirm Password *
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type={showActPassword ? 'text' : 'password'}
                          required
                          value={actConfirmPassword}
                          onChange={(e) => setActConfirmPassword(e.target.value)}
                          placeholder="Repeat password"
                          className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    {/* Quick PIN */}
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-300">
                        Admin Quick PIN
                      </label>
                      <div className="relative">
                        <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          maxLength={6}
                          value={actPin}
                          onChange={(e) => setActPin(e.target.value)}
                          placeholder="e.g. 1234"
                          className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isActivating}
                    className="w-full mt-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                  >
                    {isActivating ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Validating License & Provisioning Store...
                      </span>
                    ) : (
                      <>
                        <Building2 className="w-4 h-4" />
                        <span>Validate Key & Launch Store</span>
                      </>
                    )}
                  </button>

                  <div className="pt-2 flex items-center justify-between text-xs text-slate-400">
                    <span>Already have a store?</span>
                    <button
                      type="button"
                      onClick={() => setActiveTab('login')}
                      className="text-blue-400 hover:text-blue-300 font-semibold cursor-pointer"
                    >
                      Sign In &rarr;
                    </button>
                  </div>
                </form>
              )}

              {/* ================= TAB 3: REQUEST STORE ACCESS ================= */}
              {activeTab === 'request' && (
                <div className="space-y-4 text-left">
                  <div>
                    <h3 className="text-lg font-extrabold text-white tracking-tight">
                      Request New Store Workspace
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      New store workspaces require authorization from the platform administrator. Submit your details to receive an activation key.
                    </p>
                  </div>

                  {reqSubmitted ? (
                    <div className="p-6 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-center space-y-3">
                      <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <h4 className="text-base font-bold text-white">Application Submitted Successfully!</h4>
                      <p className="text-xs text-slate-300 max-w-md mx-auto">
                        Your request has been delivered to administrator Khaldon (<strong className="text-emerald-300">{masterAdminEmail}</strong> / <strong className="text-emerald-300">{masterAdminPhone}</strong>). You will be contacted with your private store activation key.
                      </p>
                      
                      <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                        <a
                          href={`https://wa.me/${masterAdminWhatsapp}?text=${encodeURIComponent(
                            `Hi Khaldon, I just submitted an application for a new store workspace on StoreLedger POS (Request ID: ${reqSubmitted}).`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/40 border border-emerald-500/40 text-emerald-300 text-xs font-bold transition-all"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>Message on WhatsApp ({masterAdminPhone})</span>
                        </a>
                        <a
                          href={`tel:${masterAdminPhone}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600/20 hover:bg-teal-600/30 border border-teal-500/30 text-teal-300 text-xs font-bold transition-all"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>Call: {masterAdminPhone}</span>
                        </a>
                      </div>

                      <div className="p-3 bg-slate-950/80 rounded-xl text-xs font-mono text-slate-400 inline-block border border-slate-800">
                        Request ID: <strong className="text-white">{reqSubmitted}</strong>
                      </div>
                      <div className="pt-2 flex justify-center gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setReqSubmitted(null);
                            setActiveTab('activate');
                          }}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all cursor-pointer"
                        >
                          I Have My Key &rarr; Activate Store
                        </button>
                        <button
                          type="button"
                          onClick={() => setReqSubmitted(null)}
                          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                        >
                          Submit Another
                        </button>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmitRequest} className="space-y-3.5">
                      {reqError && (
                        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
                          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                          <div>{reqError}</div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="block text-xs font-semibold text-slate-300">
                            Business / Shop Name *
                          </label>
                          <input
                            type="text"
                            required
                            value={reqBusinessName}
                            onChange={(e) => setReqBusinessName(e.target.value)}
                            placeholder="e.g. Modern Retail Store"
                            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="block text-xs font-semibold text-slate-300">
                            Contact Person Name *
                          </label>
                          <input
                            type="text"
                            required
                            value={reqContactName}
                            onChange={(e) => setReqContactName(e.target.value)}
                            placeholder="e.g. Alex Smith"
                            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="block text-xs font-semibold text-slate-300">
                            Contact Email (License Recipient) *
                          </label>
                          <input
                            type="email"
                            required
                            value={reqContactEmail}
                            onChange={(e) => setReqContactEmail(e.target.value)}
                            placeholder="e.g. alex@example.com"
                            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="block text-xs font-semibold text-slate-300">
                            Phone or WhatsApp Number
                          </label>
                          <input
                            type="text"
                            value={reqContactPhone}
                            onChange={(e) => setReqContactPhone(e.target.value)}
                            placeholder="e.g. +1 555 123 4567"
                            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-semibold text-slate-300">
                          Preferred Currency
                        </label>
                        <select
                          value={reqCurrency}
                          onChange={(e) => setReqCurrency(e.target.value)}
                          className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          {POPULAR_CURRENCIES.map((c) => (
                            <option key={c.code} value={c.code}>
                              {c.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-semibold text-slate-300">
                          Business Details / Notes
                        </label>
                        <textarea
                          rows={2}
                          value={reqNotes}
                          onChange={(e) => setReqNotes(e.target.value)}
                          placeholder="Tell us about your business, number of staff counters, or specific requirements..."
                          className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={reqSubmitting}
                        className="w-full mt-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                      >
                        {reqSubmitting ? (
                          <span className="flex items-center gap-2">
                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Submitting Request to Administrator...
                          </span>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            <span>Submit Access Request</span>
                          </>
                        )}
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* ================= TAB 4: MASTER ADMIN CONTROL PANEL ================= */}
              {activeTab === 'admin' && (
                <div className="space-y-4 text-left">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                      <h3 className="text-lg font-extrabold text-white tracking-tight flex items-center gap-2">
                        <Crown className="w-5 h-5 text-amber-400" />
                        <span>Platform Owner Console</span>
                      </h3>
                      <p className="text-xs text-slate-400">
                        Authorized Email: <strong className="text-amber-300">{masterAdminEmail}</strong>
                      </p>
                    </div>
                    {adminUnlocked ? (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={loadAdminData}
                          disabled={isLoadingAdminData}
                          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                          title="Refresh cloud data"
                        >
                          <RefreshCw className={`w-4 h-4 ${isLoadingAdminData ? 'animate-spin' : ''}`} />
                        </button>
                        <button
                          type="button"
                          onClick={handleAdminLock}
                          className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                          title="Lock console session"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Lock / Exit</span>
                        </button>
                      </div>
                    ) : null}
                  </div>

                  {!adminUnlocked ? (
                    <div className="space-y-4 py-2">
                      {/* Step Tracker */}
                      <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                              adminAuthStep === 'email'
                                ? 'bg-amber-500 text-slate-950'
                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            }`}
                          >
                            {adminAuthStep === 'otp' ? <Check className="w-3.5 h-3.5" /> : '1'}
                          </div>
                          <span className={adminAuthStep === 'email' ? 'font-bold text-white' : 'text-slate-400'}>
                            1. Owner Email
                          </span>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                              adminAuthStep === 'otp'
                                ? 'bg-amber-500 text-slate-950'
                                : 'bg-slate-800 text-slate-500'
                            }`}
                          >
                            2
                          </div>
                          <span className={adminAuthStep === 'otp' ? 'font-bold text-white' : 'text-slate-400'}>
                            2. Email Code Verification
                          </span>
                        </div>
                      </div>

                      {adminError && (
                        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
                          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                          <div>{adminError}</div>
                        </div>
                      )}

                      {/* STEP 1: ENTER OWNER EMAIL */}
                      {adminAuthStep === 'email' ? (
                        <form onSubmit={handleSendOwnerOtp} className="space-y-4">
                          <div className="p-4 rounded-2xl bg-amber-950/25 border border-amber-500/30 text-xs text-amber-200 space-y-1.5">
                            <div className="flex items-center gap-2 font-bold text-amber-300">
                              <ShieldCheck className="w-4 h-4 text-amber-400" />
                              <span>Two-Step Security Verification</span>
                            </div>
                            <p className="text-[11px] text-amber-300/80 leading-relaxed">
                              To access the Owner Platform, submit the platform administrator email address below. A 6-digit authentication code will be sent to your email inbox.
                            </p>
                          </div>

                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <label className="block text-xs font-semibold text-slate-300">
                                Platform Owner Email Address
                              </label>
                              <button
                                type="button"
                                onClick={() => setOwnerEmailInput(masterAdminEmail)}
                                className="text-[11px] text-amber-400 hover:text-amber-300 underline font-mono cursor-pointer"
                              >
                                Use {masterAdminEmail}
                              </button>
                            </div>
                            <div className="relative">
                              <input
                                type="email"
                                required
                                value={ownerEmailInput}
                                onChange={(e) => setOwnerEmailInput(e.target.value)}
                                placeholder="akhaldon7.0o0@gmail.com"
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-3 text-xs sm:text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                              />
                              <Mail className="w-4 h-4 text-slate-500 absolute right-3.5 top-3.5" />
                            </div>
                          </div>

                          <button
                            type="submit"
                            disabled={isSendingOtp}
                            className="w-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-extrabold py-3.5 rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer text-xs sm:text-sm"
                          >
                            {isSendingOtp ? (
                              <span className="flex items-center gap-2">
                                <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                                Sending Code to Owner Email...
                              </span>
                            ) : (
                              <>
                                <Send className="w-4 h-4" />
                                <span>Send Verification Code &rarr;</span>
                              </>
                            )}
                          </button>
                        </form>
                      ) : (
                        /* STEP 2: ENTER CODE SENT TO OWNER EMAIL */
                        <form onSubmit={handleVerifyOwnerOtp} className="space-y-4">
                          <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/40 text-xs text-indigo-200 space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 font-bold text-indigo-300">
                                <Mail className="w-4 h-4 text-indigo-400" />
                                <span>Code Sent to Your Email</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setAdminAuthStep('email');
                                  setAdminError('');
                                }}
                                className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                              >
                                <ArrowLeft className="w-3 h-3" />
                                <span>Change Email</span>
                              </button>
                            </div>
                            <p className="text-[11px] text-indigo-200/90 leading-relaxed">
                              A single-use 6-digit security code has been sent directly to your email address{' '}
                              <strong className="text-white font-mono">{ownerEmailInput}</strong>.
                            </p>
                            <div className="flex items-center gap-2 pt-1 text-[11px] text-amber-300/90 bg-amber-950/30 px-3 py-2.5 rounded-xl border border-amber-500/20">
                              <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                              <span>Please check your inbox (and Spam/Junk folder) and enter the 6-digit verification code below.</span>
                            </div>
                          </div>

                          <div className="space-y-1.5 text-center">
                            <label className="block text-xs font-semibold text-slate-300 text-left">
                              Enter 6-Digit Email Code
                            </label>
                            <input
                              type="text"
                              maxLength={8}
                              autoFocus
                              required
                              value={ownerOtpInput}
                              onChange={(e) => setOwnerOtpInput(e.target.value.replace(/[^a-zA-Z0-9-]/g, '').toUpperCase())}
                              placeholder="000000"
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3.5 text-center text-2xl font-mono font-black tracking-widest text-amber-400 placeholder:text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
                            />
                            <p className="text-[11px] text-slate-400 text-left">
                              Code is valid for 15 minutes.
                            </p>
                          </div>

                          <button
                            type="submit"
                            disabled={isVerifyingOtp || !ownerOtpInput.trim()}
                            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold py-3.5 rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer text-xs sm:text-sm"
                          >
                            {isVerifyingOtp ? (
                              <span className="flex items-center gap-2">
                                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Verifying Security Code...
                              </span>
                            ) : (
                              <>
                                <ShieldCheck className="w-4 h-4" />
                                <span>Verify Code & Unlock Owner Platform</span>
                              </>
                            )}
                          </button>

                          <div className="flex items-center justify-between pt-1 text-xs text-slate-400">
                            <button
                              type="button"
                              onClick={() => {
                                setAdminAuthStep('email');
                                setAdminError('');
                              }}
                              className="hover:text-slate-200 flex items-center gap-1 cursor-pointer"
                            >
                              <ArrowLeft className="w-3.5 h-3.5" />
                              <span>Back</span>
                            </button>

                            <button
                              type="button"
                              disabled={resendCountdown > 0 || isSendingOtp}
                              onClick={() => handleSendOwnerOtp()}
                              className="text-amber-400 hover:text-amber-300 font-semibold disabled:opacity-40 disabled:hover:text-amber-400 flex items-center gap-1 cursor-pointer"
                            >
                              <RefreshCw className={`w-3.5 h-3.5 ${isSendingOtp ? 'animate-spin' : ''}`} />
                              <span>
                                {resendCountdown > 0
                                  ? `Resend Code (${resendCountdown}s)`
                                  : 'Resend Code to Email'}
                              </span>
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Admin Sub-Tabs */}
                      <div className="flex p-1 bg-slate-950 border border-slate-800 rounded-xl gap-1 overflow-x-auto text-xs font-bold">
                        <button
                          type="button"
                          onClick={() => setAdminSubTab('requests')}
                          className={`flex-1 py-2 px-3 rounded-lg whitespace-nowrap transition-all ${
                            adminSubTab === 'requests'
                              ? 'bg-blue-600 text-white shadow'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          Requests ({adminRequests.filter((r) => r.status === 'pending').length} Pending)
                        </button>
                        <button
                          type="button"
                          onClick={() => setAdminSubTab('codes')}
                          className={`flex-1 py-2 px-3 rounded-lg whitespace-nowrap transition-all ${
                            adminSubTab === 'codes'
                              ? 'bg-amber-600 text-white shadow'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          License Keys ({adminCodes.filter((c) => !c.isUsed).length} Active)
                        </button>
                        <button
                          type="button"
                          onClick={() => setAdminSubTab('provision')}
                          className={`flex-1 py-2 px-3 rounded-lg whitespace-nowrap transition-all ${
                            adminSubTab === 'provision'
                              ? 'bg-emerald-600 text-white shadow'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          Provision Store
                        </button>
                        <button
                          type="button"
                          onClick={() => setAdminSubTab('stores')}
                          className={`flex-1 py-2 px-3 rounded-lg whitespace-nowrap transition-all ${
                            adminSubTab === 'stores'
                              ? 'bg-indigo-600 text-white shadow'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          All Stores ({adminStores.length})
                        </button>
                      </div>

                      {/* SUB-TAB 1: REQUESTS */}
                      {adminSubTab === 'requests' && (
                        <div className="space-y-3">
                          {adminRequests.length === 0 ? (
                            <div className="p-8 text-center text-xs text-slate-500 bg-slate-950/40 rounded-2xl border border-slate-800">
                              No store requests found in cloud database.
                            </div>
                          ) : (
                            adminRequests.map((req) => (
                              <div
                                key={req.id}
                                className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2.5 text-xs"
                              >
                                <div className="flex items-start justify-between">
                                  <div>
                                    <div className="font-bold text-white text-sm">{req.businessName}</div>
                                    <div className="text-slate-400 text-[11px] mt-0.5">
                                      Contact: <span className="text-slate-200">{req.contactName}</span> &bull; {req.contactEmail} {req.contactPhone && `&bull; ${req.contactPhone}`}
                                    </div>
                                  </div>
                                  <span
                                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                      req.status === 'approved'
                                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                        : req.status === 'rejected'
                                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                    }`}
                                  >
                                    {req.status}
                                  </span>
                                </div>

                                {req.notes && (
                                  <div className="p-2 rounded-lg bg-slate-900 text-slate-300 text-[11px]">
                                    &ldquo;{req.notes}&rdquo;
                                  </div>
                                )}

                                {req.generatedCode && (
                                  <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300">
                                    <span className="font-mono font-bold">{req.generatedCode}</span>
                                    <button
                                      type="button"
                                      onClick={() => handleCopyCode(req.generatedCode!)}
                                      className="flex items-center gap-1 text-[11px] hover:text-white font-bold"
                                    >
                                      {copiedCode === req.generatedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                      <span>Copy</span>
                                    </button>
                                  </div>
                                )}

                                {req.status === 'pending' && (
                                  <div className="flex items-center gap-2 pt-1">
                                    <button
                                      type="button"
                                      onClick={() => handleApproveRequest(req)}
                                      className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                                    >
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                      <span>Approve & Issue Key</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleRejectRequest(req)}
                                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-rose-900/60 hover:text-rose-200 text-slate-400 font-semibold text-xs transition-all cursor-pointer"
                                    >
                                      Reject
                                    </button>
                                  </div>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      )}

                      {/* SUB-TAB 2: GENERATE & MANAGE CODES */}
                      {adminSubTab === 'codes' && (
                        <div className="space-y-4">
                          {/* Code Generator Form */}
                          <form onSubmit={handleCreateCode} className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                            <h4 className="font-bold text-amber-300 text-xs flex items-center gap-1.5">
                              <Key className="w-3.5 h-3.5" />
                              <span>Create New Activation License Key</span>
                            </h4>

                            {codeGenSuccess && (
                              <div className="p-2.5 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4" />
                                <span>{codeGenSuccess}</span>
                              </div>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              <input
                                type="text"
                                value={newCodeCustom}
                                onChange={(e) => setNewCodeCustom(e.target.value.toUpperCase())}
                                placeholder="Custom code (or leave blank to auto-generate)"
                                className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                              />
                              <input
                                type="email"
                                value={newCodeForEmail}
                                onChange={(e) => setNewCodeForEmail(e.target.value)}
                                placeholder="Reserve for client email (optional)"
                                className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500"
                              />
                            </div>

                            <button
                              type="submit"
                              className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                            >
                              <PlusCircleIcon className="w-3.5 h-3.5" />
                              <span>Generate & Save License Key</span>
                            </button>
                          </form>

                          {/* Existing Codes List */}
                          <div className="space-y-2">
                            <h4 className="text-xs font-bold text-slate-400">Existing License Keys ({adminCodes.length})</h4>
                            {adminCodes.length === 0 ? (
                              <div className="p-4 text-center text-xs text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800">
                                No custom activation codes created yet.
                              </div>
                            ) : (
                              adminCodes.map((code) => (
                                <div
                                  key={code.id}
                                  className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs"
                                >
                                  <div className="space-y-0.5">
                                    <div className="flex items-center gap-2">
                                      <span className="font-mono font-bold text-white text-sm">{code.code}</span>
                                      <span
                                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                          code.isUsed
                                            ? 'bg-slate-800 text-slate-400'
                                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                        }`}
                                      >
                                        {code.isUsed ? 'Redeemed' : 'Active'}
                                      </span>
                                    </div>
                                    {code.createdForEmail && (
                                      <div className="text-[11px] text-slate-400">
                                        For: <span className="text-slate-200">{code.createdForEmail}</span>
                                      </div>
                                    )}
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => handleCopyCode(code.code)}
                                    className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors flex items-center gap-1.5"
                                  >
                                    {copiedCode === code.code ? (
                                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5" />
                                    )}
                                    <span className="text-[11px] font-semibold">Copy</span>
                                  </button>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      )}

                      {/* SUB-TAB 3: DIRECT PROVISION */}
                      {adminSubTab === 'provision' && (
                        <form onSubmit={handleDirectProvision} className="space-y-3 p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                          <h4 className="font-bold text-emerald-300 text-xs flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5" />
                            <span>Direct Provision Store for Client</span>
                          </h4>
                          <p className="text-xs text-slate-400">
                            As the Master Administrator, you can bypass key validation and provision a ready-to-use store partition directly for any merchant.
                          </p>

                          {provSuccess && (
                            <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4" />
                              <span>{provSuccess}</span>
                            </div>
                          )}
                          {provError && (
                            <div className="p-3 rounded-xl bg-rose-500/10 text-rose-300 text-xs flex items-center gap-2">
                              <AlertCircle className="w-4 h-4" />
                              <span>{provError}</span>
                            </div>
                          )}

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <input
                              type="text"
                              required
                              value={provStoreName}
                              onChange={(e) => setProvStoreName(e.target.value)}
                              placeholder="Client Store Name *"
                              className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                            <input
                              type="text"
                              value={provOwnerName}
                              onChange={(e) => setProvOwnerName(e.target.value)}
                              placeholder="Client Owner Name"
                              className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                            <input
                              type="email"
                              required
                              value={provOwnerEmail}
                              onChange={(e) => setProvOwnerEmail(e.target.value)}
                              placeholder="Client Owner Email *"
                              className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                            <input
                              type="text"
                              value={provPassword}
                              onChange={(e) => setProvPassword(e.target.value)}
                              placeholder="Default Password (e.g. 1234)"
                              className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                            <select
                              value={provCurrency}
                              onChange={(e) => setProvCurrency(e.target.value)}
                              className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            >
                              {POPULAR_CURRENCIES.map((c) => (
                                <option key={c.code} value={c.code}>
                                  {c.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <button
                            type="submit"
                            disabled={isProvisioning}
                            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-60"
                          >
                            {isProvisioning ? (
                              <span>Provisioning Store in Cloud...</span>
                            ) : (
                              <>
                                <Building2 className="w-4 h-4" />
                                <span>Create & Initialize Store Partition</span>
                              </>
                            )}
                          </button>
                        </form>
                      )}

                      {/* SUB-TAB 4: ALL REGISTERED STORES */}
                      {adminSubTab === 'stores' && (
                        <div className="space-y-3">
                          {adminBanner && (
                            <div
                              className={`p-3.5 rounded-xl border text-xs flex items-center justify-between gap-2 animate-in fade-in ${
                                adminBanner.type === 'success'
                                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                                  : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                {adminBanner.type === 'success' ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                ) : (
                                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                                )}
                                <span>{adminBanner.text}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => setAdminBanner(null)}
                                className="text-slate-400 hover:text-white text-xs font-bold px-1.5 py-0.5 rounded cursor-pointer"
                              >
                                &times;
                              </button>
                            </div>
                          )}

                          {adminStores.length === 0 ? (
                            <div className="p-8 text-center text-xs text-slate-500 bg-slate-950/40 rounded-2xl border border-slate-800">
                              No stores currently registered on the platform.
                            </div>
                          ) : (
                            adminStores.map((s) => {
                              const isTrial = s.isTrial || s.planType === 'trial';
                              const trialEnd = s.trialEndsAt || 0;
                              const isExpired = isTrial && trialEnd > 0 && Date.now() > trialEnd;
                              const daysLeft = isTrial && trialEnd > 0 ? Math.max(0, Math.ceil((trialEnd - Date.now()) / (1000 * 60 * 60 * 24))) : 0;

                              return (
                                <div
                                  key={s.id}
                                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs gap-3"
                                >
                                  <div className="space-y-1">
                                    <div className="font-bold text-white text-sm flex items-center gap-2 flex-wrap">
                                      <span>{s.name}</span>
                                      <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                                        {s.currency}
                                      </span>
                                      {isTrial ? (
                                        isExpired ? (
                                          <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-bold border border-rose-500/30">
                                            Trial Expired
                                          </span>
                                        ) : (
                                          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">
                                            ⚡ Trial ({daysLeft} days left)
                                          </span>
                                        )
                                      ) : (
                                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30 flex items-center gap-1">
                                          <Crown className="w-3 h-3 text-amber-400" />
                                          Full License
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-slate-400 text-[11px]">
                                      Owner: <strong className="text-slate-200">{s.ownerEmail}</strong> ({s.ownerName})
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                                    {isTrial && (
                                      <button
                                        type="button"
                                        onClick={() => handleAdminExtendTrial(s.id, s.name)}
                                        className="px-2.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                                        title="Add 7 days to free trial"
                                      >
                                        <Clock className="w-3 h-3" />
                                        <span>+7d Trial</span>
                                      </button>
                                    )}

                                    <button
                                      type="button"
                                      onClick={() => handleInitiateDeleteStore(s)}
                                      className="p-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/80 text-rose-400 hover:text-rose-200 border border-rose-800/40 transition-colors cursor-pointer"
                                      title="Delete store permanently"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Permanently Delete Store In-App Modal */}
      {storeToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-rose-500/40 rounded-3xl p-6 max-w-md w-full shadow-2xl shadow-rose-950/50 space-y-4 text-left">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/30">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Permanently Delete Store</h3>
                <p className="text-xs text-rose-300/80">Irreversible Cloud Action</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-rose-950/30 border border-rose-800/40 text-xs text-rose-200 space-y-2">
              <p className="font-semibold text-rose-300">
                Are you sure you want to permanently delete this store?
              </p>
              <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 space-y-1 font-mono text-[11px] text-slate-300">
                <div>
                  <span className="text-slate-500">Store Name:</span> <strong className="text-white">{storeToDelete.name}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Store ID:</span> {storeToDelete.id}
                </div>
                <div>
                  <span className="text-slate-500">Owner Email:</span> {storeToDelete.ownerEmail}
                </div>
              </div>
              <p className="text-[11px] text-rose-300/70 leading-relaxed">
                All inventory items, sales records, customers, suppliers, staff users, and cloud database documents for this store will be permanently wiped.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                disabled={isDeletingStore}
                onClick={() => setStoreToDelete(null)}
                className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingStore}
                onClick={handleConfirmDeleteStore}
                className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold shadow-lg shadow-rose-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isDeletingStore ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Permanently</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 border-t border-slate-800/60 gap-2">
        <div>StoreLedger Cloud Edition &bull; Protected Multi-Tenant Store Workspaces</div>
        <div className="flex items-center gap-4">
          <span>Encrypted Firestore Partitioning</span>
          <span>&bull;</span>
          <span>Administrator License Controlled</span>
        </div>
      </footer>
    </div>
  );
};

function PlusCircleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  );
}
