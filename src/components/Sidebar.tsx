import React from 'react';
import { useStore } from '../context/StoreContext';
import {
  LayoutDashboard,
  ShoppingCart,
  PackageCheck,
  Package,
  Boxes,
  Ticket,
  AlertTriangle,
  Users,
  ArrowUpDown,
  ClipboardCheck,
  CalendarClock,
  ClipboardList,
  Truck,
  Building2,
  Undo2,
  Receipt,
  BarChart3,
  HardDriveDownload,
  Share2,
  Clock,
  Store,
  UserCheck,
  User as UserIcon,
  ChevronRight,
  LogOut,
  Settings2,
} from 'lucide-react';

interface SidebarProps {
  currentView: string;
  onSelectView: (view: string) => void;
  isOpen: boolean;
  onClose: () => void;
  onOpenAuth: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  isOpen,
  onClose,
  onOpenAuth,
}) => {
  const { settings, updateSettings, currentUser, currentStore, logoutStore } = useStore();

  const isCashier = currentUser.role === 'cashier';

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, adminOnly: false },
    { id: 'sales', label: 'Sales & POS', icon: ShoppingCart, adminOnly: false },
    { id: 'profile', label: 'My User Profile', icon: UserIcon, adminOnly: false, badge: 'Account' },
    { id: 'activities', label: 'Activity Audit', icon: Clock, adminOnly: false, badge: 'Live' },
    { id: 'purchases', label: 'Purchases', icon: PackageCheck, adminOnly: true },
    { id: 'inventory', label: 'Inventory Goods', icon: Package, adminOnly: false },
    { id: 'bundles', label: 'Product Bundles', icon: Boxes, adminOnly: false },
    { id: 'coupons', label: 'Promo Codes', icon: Ticket, adminOnly: false },
    { id: 'damaged-samples', label: 'Damaged & Samples', icon: AlertTriangle, adminOnly: true },
    { id: 'customers', label: 'Customers & CRM', icon: Users, adminOnly: false },
    { id: 'daily-orders', label: 'Daily Orders', icon: ClipboardList, adminOnly: false },
    { id: 'delivery', label: 'Delivery Tracking', icon: Truck, adminOnly: false },
    { id: 'stock-movements', label: 'Stock Movements', icon: ArrowUpDown, adminOnly: true },
    { id: 'stocktake', label: 'Stocktake Audit', icon: ClipboardCheck, adminOnly: true },
    { id: 'daily-close', label: 'Daily Register Close', icon: CalendarClock, adminOnly: true },
    { id: 'suppliers', label: 'Suppliers Ledger', icon: Building2, adminOnly: true },
    { id: 'returns', label: 'Returns & Refunds', icon: Undo2, adminOnly: false },
    { id: 'expenses', label: 'Expenses', icon: Receipt, adminOnly: true },
    { id: 'reports', label: 'Financial Reports', icon: BarChart3, adminOnly: true },
    { id: 'backup', label: 'Backup & Storage', icon: HardDriveDownload, adminOnly: true },
    { id: 'migration', label: 'Data Migration', icon: Share2, adminOnly: true },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-950/70 z-40 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:sticky top-0 left-0 bottom-0 z-40 w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 transition-transform duration-200 ease-in-out shrink-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } h-screen shadow-2xl lg:shadow-none`}
      >
        {/* Brand & Store Header */}
        <div className="p-5 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white text-base shadow-sm">
              <Store className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-base font-semibold text-white tracking-tight block truncate">
                {settings.storeName || 'Store Ledger'}
              </span>
              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block truncate">
                {currentStore?.ownerEmail || 'Cloud Store'}
              </span>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-1.5">
            <input
              type="text"
              value={settings.storeName}
              onChange={(e) => updateSettings({ storeName: e.target.value })}
              placeholder="Edit Store Name..."
              className="flex-1 px-2.5 py-1.5 bg-slate-950/60 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
              title="Edit Store Title"
            />
            <button
              onClick={logoutStore}
              className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-[11px] font-semibold border border-slate-700 transition-colors shrink-0"
              title="Switch Store Workspace"
            >
              Switch
            </button>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          {navItems.map((item) => {
            if (isCashier && item.adminOnly) return null;
            const Icon = item.icon;
            const isActive = currentView === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectView(item.id);
                  if (window.innerWidth < 1024) onClose();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-slate-800 text-white font-semibold shadow-xs'
                    : 'text-slate-400 hover:bg-slate-800/70 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge ? (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300">
                    {item.badge}
                  </span>
                ) : (
                  isActive && <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar User Profile Footer */}
        <div className="p-3.5 border-t border-slate-800 bg-slate-950/40">
          <div className="flex items-center justify-between space-x-2.5">
            <button
              onClick={() => {
                onSelectView('profile');
                if (window.innerWidth < 1024) onClose();
              }}
              className="flex items-center space-x-2.5 flex-1 min-w-0 text-left hover:opacity-90 transition-opacity group"
              title="Click to view & edit your profile"
            >
              <div className={`w-8 h-8 rounded-full ${currentUser.avatarBg || 'bg-blue-600'} flex items-center justify-center text-white font-medium text-xs shadow-xs shrink-0 group-hover:ring-2 ring-blue-400`}>
                {currentUser.avatarEmoji || currentUser.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate group-hover:text-blue-300 transition-colors">
                  {currentUser.name}
                </p>
                <p className="text-[10px] text-slate-400 truncate capitalize flex items-center gap-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${currentUser.role === 'admin' ? 'bg-emerald-400' : 'bg-blue-400'}`} />
                  {currentUser.role} · View Profile
                </p>
              </div>
            </button>

            <button
              onClick={onOpenAuth}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
              title="Switch User / Sign In / Sign Up"
            >
              <UserCheck className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>Currency:</span>
            <input
              type="text"
              maxLength={4}
              value={settings.currency}
              onChange={(e) => updateSettings({ currency: e.target.value || '$' })}
              className="w-12 px-1.5 py-0.5 bg-slate-900 border border-slate-800 rounded text-center text-xs text-white font-mono"
            />
          </div>
        </div>
      </aside>
    </>
  );
};

