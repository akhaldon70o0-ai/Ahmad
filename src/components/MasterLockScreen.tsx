import React, { useState, useEffect } from 'react';
import {
  Lock,
  Unlock,
  KeyRound,
  ShieldCheck,
  AlertCircle,
  Eye,
  EyeOff,
  Store,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

interface MasterLockScreenProps {
  onUnlock: () => void;
}

export const MASTER_PASSWORD = 'AK7.0O0';
export const MASTER_AUTH_STORAGE_KEY = 'store_master_auth_v1';

export function isMasterUnlocked(): boolean {
  try {
    return sessionStorage.getItem(MASTER_AUTH_STORAGE_KEY) === 'unlocked_ak7.0o0';
  } catch {
    return false;
  }
}

export function lockMasterApp(): void {
  try {
    sessionStorage.removeItem(MASTER_AUTH_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export const MasterLockScreen: React.FC<MasterLockScreenProps> = ({ onUnlock }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [shake, setShake] = useState(false);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (password === MASTER_PASSWORD) {
      setErrorMsg(null);
      setIsSuccess(true);
      try {
        sessionStorage.setItem(MASTER_AUTH_STORAGE_KEY, 'unlocked_ak7.0o0');
      } catch {
        // ignore
      }
      setTimeout(() => {
        onUnlock();
      }, 500);
    } else {
      setErrorMsg('Incorrect master password. Access denied.');
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-slate-950 p-4 selection:bg-rose-500 selection:text-white">
      {/* Background radial highlight */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-25">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-blue-600 blur-3xl"></div>
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-rose-600 blur-3xl"></div>
      </div>

      <div
        className={`relative w-full max-w-md bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-3xl p-8 shadow-2xl transition-transform duration-200 ${
          shake ? 'animate-bounce' : ''
        }`}
      >
        {/* Top Logo / Lock Badge */}
        <div className="flex flex-col items-center text-center mb-7">
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-lg transition-all duration-300 ${
              isSuccess
                ? 'bg-emerald-500 text-slate-950 scale-105'
                : 'bg-rose-600/90 text-white ring-4 ring-rose-500/20'
            }`}
          >
            {isSuccess ? (
              <Unlock className="w-8 h-8 animate-pulse" />
            ) : (
              <Lock className="w-8 h-8" />
            )}
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/80 text-[11px] font-bold text-slate-300 uppercase tracking-widest mb-2">
            <KeyRound className="w-3.5 h-3.5 text-rose-400" />
            Protected Store Portal
          </div>

          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Security Gate Lock
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">
            Enter the authorized master password to unlock the store management &amp; POS system.
          </p>
        </div>

        {/* Lock Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Master Access Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                autoFocus
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                placeholder="Enter password..."
                className="w-full pl-4 pr-11 py-3 bg-slate-950 border border-slate-700 focus:border-rose-500 rounded-xl text-white font-mono text-sm tracking-wider placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-rose-500/30 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1 rounded-lg transition-colors"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs font-semibold text-rose-400 flex items-center gap-2 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {isSuccess && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs font-semibold text-emerald-400 flex items-center gap-2 animate-in fade-in duration-150">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Master Access Granted. Launching app...</span>
            </div>
          )}

          <button
            type="submit"
            disabled={!password || isSuccess}
            className="w-full py-3 px-4 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer"
          >
            {isSuccess ? (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Unlocked</span>
              </>
            ) : (
              <>
                <KeyRound className="w-4 h-4" />
                <span>Unlock Application</span>
              </>
            )}
          </button>
        </form>

        {/* Footer info */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 text-center">
          <p className="text-[11px] text-slate-500 font-medium">
            Authorized Personnel Only · Strict Access Control
          </p>
        </div>
      </div>
    </div>
  );
};
