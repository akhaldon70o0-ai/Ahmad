import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import {
  Sparkles,
  Key,
  CheckCircle2,
  AlertCircle,
  Mail,
  Phone,
  MessageCircle,
  ShieldCheck,
  Zap,
  Clock,
  LogOut,
  X,
  ExternalLink,
} from 'lucide-react';

interface TrialUpgradeModalProps {
  isOpen: boolean;
  onClose?: () => void;
  isExpired?: boolean;
}

export const TrialUpgradeModal: React.FC<TrialUpgradeModalProps> = ({
  isOpen,
  onClose,
  isExpired = false,
}) => {
  const {
    currentStore,
    upgradeStoreLicense,
    masterAdminEmail,
    masterAdminPhone,
    masterAdminWhatsapp,
    trialDaysRemaining,
    logoutStore,
  } = useStore();

  const [licenseCode, setLicenseCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen && !isExpired) return null;

  const handleUpgrade = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!licenseCode.trim()) {
      setError('Please enter a valid activation license key.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await upgradeStoreLicense(licenseCode.trim().toUpperCase());
      if (res.success) {
        setSuccess(true);
        setTimeout(() => {
          if (onClose) onClose();
        }, 1800);
      } else {
        setError(res.error || 'Invalid or already consumed activation license key.');
      }
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to activate license.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-slate-900 border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden text-left">
        {/* Background Glow */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close button if not expired */}
        {!isExpired && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Header Icon */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/20">
            <Zap className="w-6 h-6 fill-slate-950" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 border border-amber-500/30 text-amber-300">
              <Clock className="w-3 h-3" />
              {isExpired ? 'Trial Ended (7 Days)' : `7-Day Free Trial (${trialDaysRemaining} Days Left)`}
            </div>
            <h3 className="text-xl font-black text-white tracking-tight mt-0.5">
              {isExpired ? 'Upgrade to Full License' : 'Activate Full Store License'}
            </h3>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-slate-300 leading-relaxed mb-5">
          {isExpired
            ? 'Your 7-day free trial period has ended. All your store products, sales history, customers, and ledger data are completely preserved and safe. Enter your purchased license code below to unlock permanent access.'
            : 'You are currently enjoying the 7-day free trial of StoreLedger POS. Enter an official activation code below to convert this store into a permanent full-license workspace.'}
        </p>

        {success ? (
          <div className="p-5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
            <h4 className="text-sm font-bold text-white">Full License Activated Successfully!</h4>
            <p className="text-xs text-emerald-200">
              Your store is now fully licensed with permanent cloud persistence.
            </p>
          </div>
        ) : (
          <form onSubmit={handleUpgrade} className="space-y-4">
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>{error}</div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-amber-300 flex items-center justify-between">
                <span>Activation License Key</span>
                <span className="text-[10px] text-slate-400 font-normal">Format: KEY-XXX-XXXX</span>
              </label>
              <div className="relative">
                <Key className="w-4 h-4 text-amber-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={licenseCode}
                  onChange={(e) => setLicenseCode(e.target.value.toUpperCase())}
                  placeholder="e.g. KEY-AMMAN-9821"
                  className="w-full bg-slate-950 border border-amber-500/40 rounded-xl pl-10 pr-4 py-3 text-sm font-mono font-bold text-amber-300 placeholder:text-slate-700 tracking-wider focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  Verifying & Upgrading...
                </span>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Unlock Permanent License</span>
                </>
              )}
            </button>

            {/* Direct Contact for purchasing a key */}
            <div className="pt-3 border-t border-slate-800 space-y-2.5">
              <div className="text-[11px] text-slate-400 text-center">
                Need a license key? Contact platform owner Khaldon directly:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <a
                  href={`https://wa.me/${masterAdminWhatsapp}?text=${encodeURIComponent(
                    `Hi Khaldon, I want to purchase a full permanent license for my store "${currentStore?.name || ''}". Please send me payment details.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2 px-3 rounded-xl bg-emerald-600/25 hover:bg-emerald-600/35 border border-emerald-500/40 text-emerald-300 hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>WhatsApp: {masterAdminPhone}</span>
                </a>
                <a
                  href={`tel:${masterAdminPhone}`}
                  className="py-2 px-3 rounded-xl bg-teal-600/20 hover:bg-teal-600/30 border border-teal-500/30 text-teal-300 hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                >
                  <Phone className="w-3.5 h-3.5 text-teal-400" />
                  <span>Call: {masterAdminPhone}</span>
                </a>
              </div>
              <div className="flex gap-2">
                <a
                  href={`mailto:${masterAdminEmail}?subject=StoreLedger%20Full%20License%20Purchase%20(${encodeURIComponent(
                    currentStore?.name || 'My Store'
                  )})&body=Hi%20Khaldon%2C%0A%0AI%20am%20using%20the%20StoreLedger%20POS%20free%20trial%20for%20my%20store%20"${encodeURIComponent(
                    currentStore?.name || ''
                  )}"%20(Owner%3A%20${encodeURIComponent(
                    currentStore?.ownerEmail || ''
                  )})%20and%20I%20would%20like%20to%20purchase%20a%20full%20license.%0A%0APlease%20let%20me%20know%20the%20payment%20options.%0A%0AThank%20you!`}
                  className="flex-1 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 hover:text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Email: {masterAdminEmail}</span>
                </a>
                {isExpired && (
                  <button
                    type="button"
                    onClick={logoutStore}
                    className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-colors flex items-center gap-1.5"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Switch Store</span>
                  </button>
                )}
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
