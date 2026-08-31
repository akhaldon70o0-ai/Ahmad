import React, { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { UserRole, ActivityActionType } from '../types';
import { formatTimeAgo } from '../utils/audio';
import {
  User as UserIcon,
  Mail,
  Shield,
  KeyRound,
  Check,
  Sparkles,
  Lock,
  Eye,
  EyeOff,
  Clock,
  Activity,
  Calendar,
  Layers,
  ShoppingBag,
  Package,
  FileText,
  AlertCircle,
  Search,
  Filter,
  CheckCircle2,
  RefreshCw,
  LogOut,
  UserCheck,
  Trash2,
  AlertTriangle,
  Users,
  X,
} from 'lucide-react';
import { WipeDataModal } from '../components/WipeDataModal';

const AVATAR_BG_OPTIONS = [
  { label: 'Emerald Green', value: 'bg-emerald-600' },
  { label: 'Royal Blue', value: 'bg-blue-600' },
  { label: 'Indigo', value: 'bg-indigo-600' },
  { label: 'Teal Cyan', value: 'bg-teal-600' },
  { label: 'Purple Violet', value: 'bg-purple-600' },
  { label: 'Rose Red', value: 'bg-rose-600' },
  { label: 'Amber Orange', value: 'bg-amber-600' },
  { label: 'Slate Dark', value: 'bg-slate-700' },
];

const EMOJI_OPTIONS = ['👤', '🛡️', '🛒', '👔', '📦', '⭐', '🚀', '💼', '⚡', '🎯', '🔥', '💎'];

export const UserProfileView: React.FC = () => {
  const {
    currentUser,
    users,
    updateUserProfile,
    changePassword,
    switchUser,
    deleteUser,
    activities,
    logout,
  } = useStore();

  // Wipe Data Modal State
  const [showWipeModal, setShowWipeModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [accountActionMsg, setAccountActionMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  // Profile Edit State
  const [name, setName] = useState(currentUser.name);
  const [username, setUsername] = useState(currentUser.username);
  const [email, setEmail] = useState(currentUser.email);
  const [avatarBg, setAvatarBg] = useState(currentUser.avatarBg);
  const [avatarEmoji, setAvatarEmoji] = useState(currentUser.avatarEmoji);

  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');

  // Sync state when currentUser changes (e.g. user switch)
  React.useEffect(() => {
    setName(currentUser.name);
    setUsername(currentUser.username);
    setEmail(currentUser.email);
    setAvatarBg(currentUser.avatarBg);
    setAvatarEmoji(currentUser.avatarEmoji);
    setProfileError('');
    setProfileSuccess('');
  }, [currentUser]);

  // Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // Activity Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<'all' | 'sales' | 'inventory' | 'orders' | 'security'>('all');

  // Filter activities specifically for this logged-in user
  const userActivities = useMemo(() => {
    return activities.filter((act) => act.userId === currentUser.id);
  }, [activities, currentUser.id]);

  const filteredActivities = useMemo(() => {
    return userActivities.filter((act) => {
      // Category filter
      if (actionFilter === 'sales') {
        if (!act.actionType.startsWith('sale') && !act.actionType.startsWith('customer')) return false;
      } else if (actionFilter === 'inventory') {
        if (!act.actionType.startsWith('inventory') && !act.actionType.startsWith('stock') && !act.actionType.startsWith('writeoff')) return false;
      } else if (actionFilter === 'orders') {
        if (!act.actionType.startsWith('order') && !act.actionType.startsWith('purchase')) return false;
      } else if (actionFilter === 'security') {
        if (!['login', 'logout', 'register', 'user_switch', 'profile_update', 'password_change'].includes(act.actionType)) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          act.title.toLowerCase().includes(q) ||
          act.details.toLowerCase().includes(q) ||
          act.actionType.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [userActivities, actionFilter, searchQuery]);

  // Activity breakdown counts
  const activityCounts = useMemo(() => {
    let salesCount = 0;
    let invCount = 0;
    let orderCount = 0;
    let securityCount = 0;

    userActivities.forEach((act) => {
      if (act.actionType.startsWith('sale') || act.actionType.startsWith('customer')) salesCount++;
      else if (act.actionType.startsWith('inventory') || act.actionType.startsWith('stock')) invCount++;
      else if (act.actionType.startsWith('order') || act.actionType.startsWith('purchase')) orderCount++;
      else securityCount++;
    });

    return {
      total: userActivities.length,
      sales: salesCount,
      inventory: invCount,
      orders: orderCount,
      security: securityCount,
    };
  }, [userActivities]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');

    if (!name.trim() || !username.trim() || !email.trim()) {
      setProfileError('Display name, username, and email are required.');
      return;
    }

    setProfileSaving(true);
    try {
      const res = await updateUserProfile(currentUser.id, {
        name,
        username,
        email,
        avatarBg,
        avatarEmoji,
      });

      if (res.success) {
        setProfileSuccess('Profile details successfully saved!');
        setTimeout(() => setProfileSuccess(''), 4000);
      } else {
        setProfileError(res.error || 'Failed to update profile.');
      }
    } catch (err: unknown) {
      setProfileError((err as Error).message || 'An error occurred while updating profile.');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!newPassword || newPassword.length < 4) {
      setPasswordError('New password must be at least 4 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }

    setPasswordSaving(true);
    try {
      const res = await changePassword(currentUser.id, currentPassword, newPassword);
      if (res.success) {
        setPasswordSuccess('Account security credentials updated successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setPasswordSuccess(''), 4000);
      } else {
        setPasswordError(res.error || 'Failed to change password.');
      }
    } catch (err: unknown) {
      setPasswordError((err as Error).message || 'Error occurred updating password.');
    } finally {
      setPasswordSaving(false);
    }
  };

  const getActionBadgeColor = (type: ActivityActionType) => {
    if (type.startsWith('sale')) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    if (type.startsWith('inventory')) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (type.startsWith('order') || type.startsWith('purchase')) return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    if (type === 'login' || type === 'register' || type === 'profile_update' || type === 'password_change')
      return 'bg-purple-100 text-purple-800 border-purple-200';
    if (type.includes('delete') || type === 'wipe') return 'bg-rose-100 text-rose-800 border-rose-200';
    return 'bg-slate-100 text-slate-800 border-slate-200';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Profile Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="h-28 bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 relative">
          <div className="absolute top-3 right-4 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white backdrop-blur-xs border border-white/20 capitalize">
              <Shield className="w-3.5 h-3.5" />
              {currentUser.role} Account
            </span>
          </div>
        </div>

        <div className="px-6 pb-6 pt-0 relative flex flex-col md:flex-row md:items-end justify-between gap-4 -mt-12">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4">
            <div
              className={`w-24 h-24 rounded-2xl ${avatarBg} border-4 border-white text-white flex items-center justify-center text-4xl shadow-md shrink-0`}
            >
              {avatarEmoji}
            </div>
            <div className="text-center sm:text-left space-y-0.5">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h2 className="text-2xl font-bold text-slate-900">{currentUser.name}</h2>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Active Session
                </span>
              </div>
              <p className="text-sm font-medium text-slate-500">
                @{currentUser.username} · {currentUser.email}
              </p>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-1 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Joined {new Date(currentUser.createdAt).toLocaleDateString()}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  Last active: {formatTimeAgo(currentUser.lastLogin)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 pt-2 md:pt-0 flex-wrap">
            <button
              onClick={() => setShowWipeModal(true)}
              className="px-3.5 py-2 border border-rose-200 text-rose-700 hover:bg-rose-50 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
              title="Wipe or reset store database"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              Wipe Data
            </button>
            <button
              onClick={() => logout()}
              className="px-4 py-2 border border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <LogOut className="w-3.5 h-3.5 text-slate-500" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Total Actions Logged</span>
            <Activity className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{activityCounts.total}</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Recorded across all sessions</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Sales Recorded</span>
            <ShoppingBag className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-700">{activityCounts.sales}</div>
          <p className="text-[11px] text-slate-400 mt-0.5">POS invoices &amp; settlements</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Inventory Actions</span>
            <Package className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-700">{activityCounts.inventory}</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Stock edits, items &amp; audits</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Security &amp; Auth</span>
            <Shield className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-purple-700">{activityCounts.security}</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Logins &amp; profile changes</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Edit Profile & Password Cards */}
        <div className="lg:col-span-1 space-y-6">
          {/* Card 1: Edit Basic Information */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                <UserIcon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Edit Profile Information</h3>
                <p className="text-xs text-slate-500">Update your account display &amp; contact info</p>
              </div>
            </div>

            {profileError && (
              <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{profileError}</span>
              </div>
            )}

            {profileSuccess && (
              <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{profileSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Display Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Username *
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              {/* Avatar Emoji Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Avatar Icon
                </label>
                <div className="grid grid-cols-6 gap-1.5">
                  {EMOJI_OPTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setAvatarEmoji(emoji)}
                      className={`h-9 rounded-lg border text-lg flex items-center justify-center transition-all ${
                        avatarEmoji === emoji
                          ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-500/20'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Avatar Background Color */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Avatar Color Theme
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {AVATAR_BG_OPTIONS.map((bg) => (
                    <button
                      key={bg.value}
                      type="button"
                      onClick={() => setAvatarBg(bg.value)}
                      className={`h-7 rounded-lg ${bg.value} border-2 flex items-center justify-center transition-all ${
                        avatarBg === bg.value
                          ? 'border-slate-900 scale-105 shadow-xs'
                          : 'border-transparent opacity-80 hover:opacity-100'
                      }`}
                      title={bg.label}
                    >
                      {avatarBg === bg.value && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={profileSaving}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                >
                  <Check className="w-4 h-4" />
                  {profileSaving ? 'Saving Changes...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          </div>

          {/* Card 2: Security & Password */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                <KeyRound className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Security Credentials</h3>
                <p className="text-xs text-slate-500">Update account sign-in password</p>
              </div>
            </div>

            {passwordError && (
              <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            {passwordSuccess && (
              <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3.5">
              {currentUser.passwordHash && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Current Password
                  </label>
                  <input
                    type={showPasswords ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">New Password</label>
                  <button
                    type="button"
                    onClick={() => setShowPasswords(!showPasswords)}
                    className="text-[11px] text-blue-600 hover:underline flex items-center gap-1"
                  >
                    {showPasswords ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    {showPasswords ? 'Hide' : 'Show'}
                  </button>
                </div>
                <input
                  type={showPasswords ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 4 characters"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Confirm New Password
                </label>
                <input
                  type={showPasswords ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={passwordSaving}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                >
                  <Lock className="w-3.5 h-3.5" />
                  {passwordSaving ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>

          {/* Card 3: All Store Profiles & Account Management */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">All User Profiles</h3>
                  <p className="text-xs text-slate-500">Manage, switch, or remove previous accounts</p>
                </div>
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full">
                {users.length} {users.length === 1 ? 'Profile' : 'Profiles'}
              </span>
            </div>

            {accountActionMsg && (
              <div
                className={`mb-3 p-2.5 rounded-lg text-xs font-semibold flex items-center justify-between ${
                  accountActionMsg.type === 'error'
                    ? 'bg-rose-50 border border-rose-200 text-rose-700'
                    : 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                }`}
              >
                <span>{accountActionMsg.text}</span>
                <button onClick={() => setAccountActionMsg(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {users.map((user) => {
                const isCurrent = user.id === currentUser.id;
                const isDeleting = userToDelete === user.id;

                return (
                  <div
                    key={user.id}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-2 transition-all ${
                      isCurrent
                        ? 'border-emerald-500/80 bg-emerald-50/40 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/80'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div
                        className={`w-8 h-8 rounded-full ${user.avatarBg || 'bg-blue-600'} text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs`}
                      >
                        {user.avatarEmoji || user.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5 truncate">
                          <span className="truncate">{user.name}</span>
                          {isCurrent && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 bg-emerald-600 text-white rounded shrink-0">
                              Active
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">
                          @{user.username} · <span className="capitalize">{user.role}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {!isCurrent && (
                        <button
                          onClick={() => switchUser(user.id)}
                          className="px-2 py-1 text-[10px] font-bold bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-lg transition-colors"
                          title="Switch to this account"
                        >
                          Switch
                        </button>
                      )}

                      {isDeleting ? (
                        <div className="flex items-center gap-1 bg-rose-50 border border-rose-200 p-1 rounded-lg animate-in fade-in duration-100">
                          <button
                            onClick={() => {
                              const res = deleteUser(user.id);
                              if (res.success) {
                                setAccountActionMsg({ type: 'success', text: `Profile for ${user.name} was removed.` });
                              } else {
                                setAccountActionMsg({ type: 'error', text: res.error || 'Failed to delete profile.' });
                              }
                              setUserToDelete(null);
                            }}
                            className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-bold"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setUserToDelete(null)}
                            className="px-1.5 py-1 text-slate-500 hover:text-slate-700 text-[10px] font-semibold"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setUserToDelete(user.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete profile"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Card 4: Danger Zone & Wipe Store Data */}
          <div className="bg-rose-50/60 rounded-2xl border border-rose-200 p-5 shadow-2xs">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-rose-100 text-rose-700">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-rose-950">Store Danger Zone</h3>
            </div>
            <p className="text-xs text-rose-800 leading-relaxed mb-4">
              Need to clear past test transactions, wipe old records, or start with a clean slate? Use the Wipe Data tool.
            </p>

            <button
              onClick={() => setShowWipeModal(true)}
              className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Wipe Store Data...
            </button>
          </div>
        </div>

        {/* Right Column: User Activity Stream & Audit */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col h-full">
            {/* Header & Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-600" />
                  Personal Activity History
                </h3>
                <p className="text-xs text-slate-500">
                  Every action performed by @{currentUser.username} is logged with timestamp
                </p>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search actions..."
                    className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-blue-600 w-36 sm:w-44"
                  />
                </div>
              </div>
            </div>

            {/* Category Filter Chips */}
            <div className="flex items-center gap-1.5 py-3 overflow-x-auto border-b border-slate-100">
              <button
                onClick={() => setActionFilter('all')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  actionFilter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Actions ({userActivities.length})
              </button>
              <button
                onClick={() => setActionFilter('sales')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  actionFilter === 'sales'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Sales &amp; POS ({activityCounts.sales})
              </button>
              <button
                onClick={() => setActionFilter('inventory')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  actionFilter === 'inventory'
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Inventory ({activityCounts.inventory})
              </button>
              <button
                onClick={() => setActionFilter('orders')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  actionFilter === 'orders'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Orders &amp; Stock ({activityCounts.orders})
              </button>
              <button
                onClick={() => setActionFilter('security')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  actionFilter === 'security'
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Auth &amp; Profile ({activityCounts.security})
              </button>
            </div>

            {/* Activities List */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pt-3 pr-1 max-h-[600px]">
              {filteredActivities.length === 0 ? (
                <div className="text-center py-12 px-4 border border-dashed border-slate-200 rounded-xl">
                  <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-2">
                    <Activity className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-700">No activity records found</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    {searchQuery
                      ? 'No activities matched your search criteria.'
                      : 'Activities you perform in POS, inventory, orders, or profile settings will automatically appear here.'}
                  </p>
                </div>
              ) : (
                filteredActivities.map((act) => (
                  <div
                    key={act.id}
                    className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50/70 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${getActionBadgeColor(
                            act.actionType
                          )}`}
                        >
                          {act.actionType.replace('_', ' ')}
                        </span>
                        <h4 className="text-xs font-bold text-slate-900">{act.title}</h4>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{act.details}</p>
                    </div>

                    <div className="text-left sm:text-right shrink-0">
                      <div className="text-[11px] font-semibold text-slate-700">
                        {formatTimeAgo(act.timestamp)}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {new Date(act.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <WipeDataModal isOpen={showWipeModal} onClose={() => setShowWipeModal(false)} />
    </div>
  );
};
