import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { formatMoney } from '../utils/audio';
import {
  Shield,
  UserCheck,
  Volume2,
  VolumeX,
  UserPlus,
  LogOut,
  ArrowRightLeft,
  Clock,
  Menu,
  Camera,
  Search,
  User as UserIcon,
  Lock,
  Cloud,
  CloudOff,
  RefreshCw,
  Smartphone,
  Store,
} from 'lucide-react';

interface NavbarProps {
  currentView: string;
  onOpenAuth: () => void;
  onOpenScanner: () => void;
  onToggleMobileMenu: () => void;
  onSelectView?: (view: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onOpenAuth,
  onOpenScanner,
  onToggleMobileMenu,
  onSelectView,
}) => {
  const {
    currentStore,
    currentUser,
    settings,
    updateSettings,
    tillBalance,
    activities,
    logout,
    logoutStore,
    cloudSyncStatus,
    syncWithCloudNow,
    lastCloudSync,
  } = useStore();
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [isManualSyncing, setIsManualSyncing] = useState(false);

  const handleManualSync = async () => {
    setIsManualSyncing(true);
    await syncWithCloudNow();
    setTimeout(() => setIsManualSyncing(false), 600);
  };

  // Count user's own activities
  const userActCount = activities.filter((a) => a.userId === currentUser.id).length;

  const toggleSound = () => {
    updateSettings({ soundEnabled: !settings.soundEnabled });
  };

  const getViewTitle = () => {
    switch (currentView) {
      case 'dashboard':
        return 'Personal Overview & Metrics';
      case 'sales':
      case 'pos':
        return 'Point of Sale (POS) & Checkout';
      case 'profile':
        return 'User Profile & Account Security';
      case 'activities':
        return 'Live User Activity Audit Trail';
      case 'inventory':
        return 'Product Catalog & Stock Management';
      case 'bundles':
        return 'Product Bundles & Promo Sets';
      case 'coupons':
        return 'Promotional Discounts & Coupons';
      case 'customers':
        return 'Customer Directory & Accounts CRM';
      case 'daily-orders':
        return 'Daily Packing & Delivery Board';
      case 'purchases':
        return 'Supplier Purchases & Restocking';
      case 'suppliers':
        return 'Supplier Accounts & Cost Ledgers';
      case 'delivery':
        return 'Delivery Logistics & Dispatch';
      case 'stock-movements':
        return 'Stock In/Out Movement History';
      case 'stocktake':
        return 'Physical Inventory Stocktake Audit';
      case 'daily-close':
        return 'Daily Cash Drawer Close & Reconciliation';
      case 'returns':
        return 'Customer Returns & Credit Notes';
      case 'expenses':
        return 'Operational Expenses & Outflows';
      case 'reports':
        return 'Financial Reports & MoM Analytics';
      case 'backup':
        return 'Data Backup, Cloud Sync & Security';
      case 'migration':
        return 'Legacy Data Migration Tool';
      default:
        return 'Store Management Overview';
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 lg:px-8 shrink-0 z-30 sticky top-0">
      {/* Left: Mobile Menu & Current View Title */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          title="Toggle Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-base sm:text-lg font-semibold text-slate-800 tracking-tight">
            {getViewTitle()}
          </h1>
        </div>
      </div>

      {/* Right: Quick Tools, Search/Scanner & User Profile */}
      <div className="flex items-center space-x-2.5 sm:space-x-3.5">
        {/* Quick Barcode Scanner Button */}
        <button
          onClick={onOpenScanner}
          className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
          title="Open Camera Barcode Scanner"
        >
          <Camera className="w-4 h-4 text-blue-600" />
        </button>

        {/* User Activity Pill Button */}
        {onSelectView && (
          <button
            onClick={() => onSelectView('activities')}
            className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition-colors"
            title="View Your Activity Log & Audit Trail"
          >
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <span>Activities</span>
            <span className="bg-blue-100 text-blue-800 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
              {userActCount}
            </span>
          </button>
        )}

        {/* Audio Sound Toggle */}
        <button
          onClick={toggleSound}
          className={`p-2 rounded-lg border text-xs font-semibold transition-colors ${
            settings.soundEnabled
              ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-xs'
              : 'bg-slate-100 border-slate-200 text-slate-400'
          }`}
          title={settings.soundEnabled ? 'Audio Effects: ON' : 'Audio Effects: OFF'}
        >
          {settings.soundEnabled ? (
            <Volume2 className="w-4 h-4 text-blue-600" />
          ) : (
            <VolumeX className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {/* Real-time Multi-Device Cloud Sync Indicator */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 bg-white shadow-xs">
          <button
            onClick={handleManualSync}
            disabled={isManualSyncing}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-700 hover:text-blue-600 transition-colors disabled:opacity-60"
            title={lastCloudSync ? `Multi-device cloud synced at ${new Date(lastCloudSync).toLocaleTimeString()}` : 'Real-time multi-device cloud synchronization'}
          >
            {cloudSyncStatus === 'syncing' || isManualSyncing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                <span className="text-[11px] font-bold text-blue-700">Syncing...</span>
              </>
            ) : cloudSyncStatus === 'synced' ? (
              <>
                <Cloud className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-[11px] font-bold text-emerald-700">Cloud Synced</span>
              </>
            ) : (
              <>
                <CloudOff className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-[11px] font-bold text-amber-700">Offline / Sync</span>
              </>
            )}
          </button>
        </div>

        {/* Net Till Position Indicator */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1 text-right hidden md:block">
          <div className="text-[9px] uppercase font-bold tracking-wider text-slate-500">Till Balance</div>
          <div className={`font-mono text-xs font-extrabold ${tillBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {formatMoney(tillBalance, settings.currency)}
          </div>
        </div>

        {/* Store Identifier Pill */}
        {currentStore && (
          <div
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800"
            title={`Active Store Partition: ${currentStore.name} (${currentStore.ownerEmail})`}
          >
            <Store className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span className="max-w-[130px] truncate font-bold">{currentStore.name}</span>
          </div>
        )}

        {/* User Account Button with Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className="inline-flex items-center space-x-2.5 px-2.5 py-1.5 rounded-full border border-slate-200 bg-white shadow-xs hover:border-slate-300 transition-colors text-left"
          >
            <div className={`w-7 h-7 rounded-full ${currentUser.avatarBg} text-white flex items-center justify-center text-xs font-bold shadow-xs`}>
              {currentUser.avatarEmoji || currentUser.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="hidden sm:flex flex-col pr-1">
              <span className="text-xs font-semibold text-slate-800 leading-tight">
                {currentUser.name}
              </span>
              <span className="text-[10px] text-slate-400 font-medium capitalize">
                {currentUser.role}
              </span>
            </div>
          </button>

          {showUserDropdown && (
            <div
              className="absolute right-0 mt-2 w-60 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
              onMouseLeave={() => setShowUserDropdown(false)}
            >
              <div className="px-3.5 py-2.5 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-900">{currentUser.name}</p>
                <p className="text-[11px] text-slate-500 truncate">{currentUser.email}</p>
                {currentStore && (
                  <p className="text-[10px] text-blue-600 font-semibold truncate mt-0.5">
                    Store: {currentStore.name}
                  </p>
                )}
                <span className="inline-block mt-1 text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                  {currentUser.role} Account
                </span>
              </div>

              <div className="py-1">
                {onSelectView && (
                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      onSelectView('profile');
                    }}
                    className="w-full px-3.5 py-2 text-left text-xs font-semibold text-slate-800 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2 transition-colors"
                  >
                    <UserIcon className="w-4 h-4 text-blue-600" />
                    Manage My Profile
                  </button>
                )}
                {onSelectView && (
                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      onSelectView('activities');
                    }}
                    className="w-full px-3.5 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <Clock className="w-4 h-4 text-blue-600" />
                    My Activity History
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowUserDropdown(false);
                    onOpenAuth();
                  }}
                  className="w-full px-3.5 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <ArrowRightLeft className="w-4 h-4 text-slate-500" />
                  Switch Cashier Account
                </button>
                <button
                  onClick={() => {
                    setShowUserDropdown(false);
                    onOpenAuth();
                  }}
                  className="w-full px-3.5 py-2 text-left text-xs font-medium text-blue-700 hover:bg-blue-50 flex items-center gap-2"
                >
                  <UserPlus className="w-4 h-4 text-blue-600" />
                  Add Staff Member
                </button>
              </div>

              <div className="pt-1 border-t border-slate-100 space-y-0.5">
                <button
                  onClick={() => {
                    setShowUserDropdown(false);
                    logoutStore();
                  }}
                  className="w-full px-3.5 py-2 text-left text-xs font-semibold text-indigo-700 hover:bg-indigo-50 flex items-center gap-2 transition-colors"
                  title="Return to multi-store selection portal"
                >
                  <Store className="w-4 h-4 text-indigo-600" />
                  Switch / Change Store
                </button>
                <button
                  onClick={() => {
                    setShowUserDropdown(false);
                    logout();
                  }}
                  className="w-full px-3.5 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out Session
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
