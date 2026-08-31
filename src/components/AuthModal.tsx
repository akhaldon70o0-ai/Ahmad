import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { UserRole } from '../types';
import {
  X,
  UserPlus,
  LogIn,
  Shield,
  ArrowRightLeft,
  Check,
  Sparkles,
  Lock,
  Eye,
  EyeOff,
  Mail,
  User as UserIcon,
  KeyRound,
  LogOut,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { WipeDataModal } from './WipeDataModal';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'login' | 'register' | 'switch';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'login',
}) => {
  const {
    users,
    currentUser,
    loginWithPassword,
    signUpWithPassword,
    switchUser,
    deleteUser,
    logout,
    settings,
  } = useStore();

  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'switch' | 'pin'>(initialTab);
  const [showWipeModal, setShowWipeModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [deleteMsg, setDeleteMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  // Login Form State
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Register Form State
  const [regName, setRegName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regRole, setRegRole] = useState<UserRole>('cashier');
  const [regError, setRegError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  // PIN unlock state
  const [targetUserId, setTargetUserId] = useState<string | null>(null);
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState('');

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!loginIdentifier.trim()) {
      setLoginError('Please enter your email or username.');
      return;
    }

    setIsLoggingIn(true);
    try {
      const res = await loginWithPassword(loginIdentifier.trim(), loginPassword);
      if (res.success) {
        setLoginIdentifier('');
        setLoginPassword('');
        onClose();
      } else {
        setLoginError(res.error || 'Authentication failed. Please check your credentials.');
      }
    } catch (err: unknown) {
      setLoginError((err as Error).message || 'An unexpected error occurred during login.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleQuickLogin = async (user: { username: string; email: string }) => {
    setLoginError('');
    setIsLoggingIn(true);
    try {
      // Demo accounts work with identifier
      const res = await loginWithPassword(user.username, '');
      if (res.success) {
        onClose();
      } else {
        setLoginIdentifier(user.username);
        setActiveTab('login');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

    if (!regName.trim() || !regUsername.trim() || !regEmail.trim()) {
      setRegError('Please provide full name, username, and email address.');
      return;
    }

    if (regPassword && regPassword.length < 4) {
      setRegError('Password must be at least 4 characters long.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setRegError('Passwords do not match.');
      return;
    }

    setIsRegistering(true);
    try {
      const res = await signUpWithPassword({
        name: regName,
        username: regUsername,
        email: regEmail,
        role: regRole,
        password: regPassword,
      });

      if (res.success) {
        setRegName('');
        setRegUsername('');
        setRegEmail('');
        setRegPassword('');
        setRegConfirmPassword('');
        onClose();
      } else {
        setRegError(res.error || 'Failed to create account.');
      }
    } catch (err: unknown) {
      setRegError((err as Error).message || 'Registration error occurred.');
    } finally {
      setIsRegistering(false);
    }
  };

  const handleSelectUser = (user: { id: string; role: UserRole; name: string }) => {
    if (user.role === 'admin' && currentUser.role !== 'admin' && settings.adminPin) {
      setTargetUserId(user.id);
      setActiveTab('pin');
      setPinError('');
      setEnteredPin('');
      return;
    }
    switchUser(user.id);
    onClose();
  };

  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (enteredPin.trim() === settings.adminPin) {
      if (targetUserId) {
        switchUser(targetUserId);
      }
      onClose();
    } else {
      setPinError('Invalid Admin PIN. (Default PIN: 1234)');
    }
  };

  const handleSignOut = () => {
    logout();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-inner">
              <KeyRound className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">User Authentication &amp; Access</h3>
              <p className="text-xs text-slate-400">Secure sign-in, account creation, and user switching</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-slate-200 bg-slate-50 shrink-0">
          <button
            onClick={() => setActiveTab('login')}
            className={`flex-1 py-3 text-xs font-bold text-center border-b-2 flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === 'login'
                ? 'border-blue-600 text-blue-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            Sign In
          </button>
          <button
            onClick={() => setActiveTab('register')}
            className={`flex-1 py-3 text-xs font-bold text-center border-b-2 flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === 'register'
                ? 'border-blue-600 text-blue-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            Create Account
          </button>
          <button
            onClick={() => setActiveTab('switch')}
            className={`flex-1 py-3 text-xs font-bold text-center border-b-2 flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === 'switch'
                ? 'border-blue-600 text-blue-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            Switch ({users.length})
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* 1. SIGN IN (LOGIN) */}
          {activeTab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Sign in to your account</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Enter your email or username to access your workspace.
                </p>
              </div>

              {loginError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
                  <span className="shrink-0 font-bold">⚠️</span>
                  <span>{loginError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email or Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="e.g. admin or alex@storeledger.io"
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">Password</label>
                  <span className="text-[11px] text-slate-400">Default accounts don't require PIN</span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter password..."
                    className="w-full pl-9 pr-9 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Quick Select Demo Users */}
              <div className="pt-2">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Quick Access Accounts:
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {users.slice(0, 3).map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => handleQuickLogin(u)}
                      className="p-2 rounded-lg border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 text-left transition-all group"
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="text-base">{u.avatarEmoji}</span>
                        <span className="text-xs font-bold text-slate-800 group-hover:text-blue-700 truncate">
                          {u.name.split(' ')[0]}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 capitalize">{u.role}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setActiveTab('register')}
                  className="text-xs font-semibold text-blue-600 hover:underline"
                >
                  Need an account? Sign up
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 border border-slate-200 text-xs font-semibold text-slate-600 rounded-lg hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoggingIn}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                  >
                    <LogIn className="w-4 h-4" />
                    {isLoggingIn ? 'Verifying...' : 'Sign In'}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* 2. SIGN UP (REGISTER) */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Create new user account</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Sign up with credentials. All operations and actions will be tied to this profile.
                </p>
              </div>

              {regError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
                  <span className="shrink-0 font-bold">⚠️</span>
                  <span>{regError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="e.g. David Miller"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Username *
                  </label>
                  <input
                    type="text"
                    required
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    placeholder="e.g. david_m"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Role &amp; Permissions *
                  </label>
                  <select
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  >
                    <option value="cashier">Cashier (POS &amp; Sales)</option>
                    <option value="manager">Manager (Stock &amp; Orders)</option>
                    <option value="admin">Admin (Full Access)</option>
                    <option value="stockkeeper">Stockkeeper (Inventory)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="e.g. david@storeledger.io"
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="At least 4 chars"
                      className="w-full pl-3 pr-8 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Confirm Password
                  </label>
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setActiveTab('login')}
                  className="text-xs font-semibold text-blue-600 hover:underline"
                >
                  Already have an account? Sign in
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 border border-slate-200 text-xs font-semibold text-slate-600 rounded-lg hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isRegistering}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                  >
                    <Sparkles className="w-4 h-4" />
                    {isRegistering ? 'Creating...' : 'Sign Up & Log In'}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* 3. SWITCH ACTIVE USER & MANAGE PROFILES */}
          {activeTab === 'switch' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Manage Profiles & Switch Account</h4>
                  <p className="text-xs text-slate-500">
                    Switch between accounts or delete previous user profiles.
                  </p>
                </div>
                <button
                  onClick={handleSignOut}
                  className="px-3 py-1.5 border border-rose-200 text-rose-700 hover:bg-rose-50 rounded-lg text-xs font-semibold flex items-center gap-1"
                  title="Sign out of current user"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>

              {deleteMsg && (
                <div
                  className={`p-2.5 rounded-lg text-xs font-semibold flex items-center justify-between ${
                    deleteMsg.type === 'error'
                      ? 'bg-rose-50 border border-rose-200 text-rose-700'
                      : 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                  }`}
                >
                  <span>{deleteMsg.text}</span>
                  <button onClick={() => setDeleteMsg(null)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {users.map((user) => {
                  const isCurrent = user.id === currentUser.id;
                  const isConfirmingDelete = userToDelete === user.id;

                  return (
                    <div
                      key={user.id}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-2 transition-all ${
                        isCurrent
                          ? 'border-blue-500 bg-blue-50/60 ring-2 ring-blue-500/20 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <button
                        onClick={() => handleSelectUser(user)}
                        className="flex items-center gap-3 text-left flex-1 min-w-0"
                      >
                        <div
                          className={`w-10 h-10 rounded-full ${user.avatarBg || 'bg-blue-600'} text-white flex items-center justify-center font-bold text-base shadow-xs shrink-0`}
                        >
                          {user.avatarEmoji || user.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold text-slate-900 flex items-center gap-2 truncate">
                            <span className="truncate">{user.name}</span>
                            {isCurrent && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-600 text-white font-bold shrink-0">
                                Active
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate">
                            @{user.username} · {user.email}
                          </div>
                        </div>
                      </button>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                            user.role === 'admin'
                              ? 'bg-emerald-100 text-emerald-800'
                              : user.role === 'manager'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {user.role}
                        </span>

                        {isConfirmingDelete ? (
                          <div className="flex items-center gap-1 bg-rose-50 border border-rose-200 p-1 rounded-lg animate-in fade-in duration-150">
                            <button
                              onClick={() => {
                                const res = deleteUser(user.id);
                                if (res.success) {
                                  setDeleteMsg({ type: 'success', text: `Profile for ${user.name} removed.` });
                                } else {
                                  setDeleteMsg({ type: 'error', text: res.error || 'Failed to delete user.' });
                                }
                                setUserToDelete(null);
                              }}
                              className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-bold"
                              title="Confirm delete"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setUserToDelete(null)}
                              className="px-1.5 py-1 text-slate-500 hover:text-slate-700 text-[10px] font-semibold"
                              title="Cancel"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setUserToDelete(user.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete this profile"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-3 border-t border-slate-100 flex flex-wrap justify-between items-center gap-2">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab('register')}
                    className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    + Register account
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={() => setShowWipeModal(true)}
                    className="text-xs font-semibold text-rose-600 hover:underline flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    Wipe Data
                  </button>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {/* 4. ADMIN PIN UNLOCK */}
          {activeTab === 'pin' && (
            <form onSubmit={handleVerifyPin} className="space-y-4 text-center py-3">
              <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 mx-auto flex items-center justify-center">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Admin Security PIN</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Enter Admin Security PIN to switch to Administrator access. (Default PIN: <b>1234</b>)
                </p>
              </div>

              {pinError && (
                <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                  {pinError}
                </div>
              )}

              <div>
                <input
                  type="password"
                  autoFocus
                  maxLength={10}
                  value={enteredPin}
                  onChange={(e) => setEnteredPin(e.target.value)}
                  placeholder="PIN..."
                  className="w-44 mx-auto text-center tracking-widest text-lg font-mono px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="flex justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('switch')}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs"
                >
                  <Check className="w-4 h-4" />
                  Unlock Admin
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      <WipeDataModal isOpen={showWipeModal} onClose={() => setShowWipeModal(false)} />
    </div>
  );
};
