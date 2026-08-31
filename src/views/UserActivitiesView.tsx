import React, { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { formatTimeAgo } from '../utils/audio';
import {
  Clock,
  User,
  Search,
  Filter,
  Download,
  Trash2,
  CheckCircle2,
  ShoppingCart,
  Package,
  PackageCheck,
  Users,
  AlertTriangle,
  Receipt,
  RotateCcw,
  Boxes,
  Ticket,
  CalendarCheck,
  LogIn,
  HardDrive,
} from 'lucide-react';
import { ActivityActionType } from '../types';

export const UserActivitiesView: React.FC = () => {
  const { activities, users, currentUser, clearActivities } = useStore();
  const [userFilter, setUserFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const filteredActivities = useMemo(() => {
    return activities.filter((act) => {
      if (userFilter !== 'all' && act.userId !== userFilter) return false;
      if (typeFilter !== 'all' && act.actionType !== typeFilter) return false;
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        act.title.toLowerCase().includes(term) ||
        act.details.toLowerCase().includes(term) ||
        act.userName.toLowerCase().includes(term) ||
        act.actionType.toLowerCase().includes(term)
      );
    });
  }, [activities, userFilter, typeFilter, searchTerm]);

  // Statistics
  const totalCount = activities.length;
  const myCount = activities.filter((a) => a.userId === currentUser.id).length;
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayCount = activities.filter((a) => a.timestamp.slice(0, 10) === todayStr).length;
  const uniqueUsersCount = new Set(activities.map((a) => a.userId)).size;

  const exportActivitiesCsv = () => {
    if (!activities.length) return;
    const headers = ['ID', 'Timestamp', 'User Name', 'User Role', 'Action Type', 'Title', 'Details'];
    const rows = activities.map((a) => [
      a.id,
      a.timestamp,
      `"${a.userName.replace(/"/g, '""')}"`,
      a.userRole,
      a.actionType,
      `"${a.title.replace(/"/g, '""')}"`,
      `"${a.details.replace(/"/g, '""')}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `user-activities-audit-${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const getActionIcon = (type: ActivityActionType) => {
    switch (type) {
      case 'sale':
      case 'sale_edit':
      case 'sale_delete':
        return <ShoppingCart className="w-4 h-4 text-emerald-600" />;
      case 'inventory_add':
      case 'inventory_edit':
      case 'inventory_delete':
      case 'stocktake':
        return <Package className="w-4 h-4 text-teal-600" />;
      case 'purchase':
      case 'purchase_delete':
        return <PackageCheck className="w-4 h-4 text-amber-600" />;
      case 'customer_add':
      case 'customer_edit':
      case 'customer_delete':
      case 'customer_payment':
        return <Users className="w-4 h-4 text-blue-600" />;
      case 'writeoff':
        return <AlertTriangle className="w-4 h-4 text-rose-600" />;
      case 'expense':
      case 'expense_delete':
        return <Receipt className="w-4 h-4 text-orange-600" />;
      case 'return':
      case 'return_delete':
        return <RotateCcw className="w-4 h-4 text-indigo-600" />;
      case 'bundle_create':
      case 'bundle_edit':
      case 'bundle_delete':
        return <Boxes className="w-4 h-4 text-purple-600" />;
      case 'coupon_create':
      case 'coupon_edit':
      case 'coupon_delete':
        return <Ticket className="w-4 h-4 text-pink-600" />;
      case 'daily_close':
        return <CalendarCheck className="w-4 h-4 text-cyan-600" />;
      case 'login':
      case 'register':
      case 'user_switch':
        return <LogIn className="w-4 h-4 text-violet-600" />;
      case 'backup_export':
      case 'backup_import':
      case 'idb_sync':
      case 'wipe':
        return <HardDrive className="w-4 h-4 text-slate-600" />;
      default:
        return <CheckCircle2 className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Saved Actions</div>
          <div className="font-mono text-2xl font-bold text-slate-900 mt-1">{totalCount}</div>
          <div className="text-xs text-slate-500 mt-0.5">Permanent activity audit trail</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-blue-200 bg-blue-50/20 shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-blue-700">My Activities</div>
          <div className="font-mono text-2xl font-bold text-blue-700 mt-1">{myCount}</div>
          <div className="text-xs text-blue-600/80 mt-0.5">Logged as {currentUser.name}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Actions Today</div>
          <div className="font-mono text-2xl font-bold text-slate-900 mt-1">{todayCount}</div>
          <div className="text-xs text-slate-500 mt-0.5">Recorded on {todayStr}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Active User Accounts</div>
          <div className="font-mono text-2xl font-bold text-slate-900 mt-1">{users.length}</div>
          <div className="text-xs text-slate-500 mt-0.5">{uniqueUsersCount} users with logged events</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* User Selector Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
            <User className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none"
            >
              <option value="all">All Users ({users.length})</option>
              <option value={currentUser.id}>Only My Activities ({currentUser.name})</option>
              {users
                .filter((u) => u.id !== currentUser.id)
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} (@{u.username})
                  </option>
                ))}
            </select>
          </div>

          {/* Action Type Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none"
            >
              <option value="all">All Action Types</option>
              <option value="sale">Sales &amp; POS</option>
              <option value="purchase">Purchases</option>
              <option value="inventory_add">Inventory Additions</option>
              <option value="inventory_edit">Inventory Edits</option>
              <option value="stocktake">Stocktakes</option>
              <option value="customer_add">Customer CRM</option>
              <option value="customer_payment">Debt Payments</option>
              <option value="order_create">Daily Orders</option>
              <option value="expense">Expenses</option>
              <option value="writeoff">Write-offs / Samples</option>
              <option value="daily_close">Daily Close</option>
              <option value="login">Logins &amp; Switches</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          {/* Search Input */}
          <div className="relative flex-1 md:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search user, action, notes…"
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
          </div>

          {/* Export CSV Button */}
          <button
            onClick={exportActivitiesCsv}
            disabled={!activities.length}
            className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors shrink-0 disabled:opacity-50"
            title="Download CSV file of all activity logs"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>

          {/* Admin Clear Button */}
          {currentUser.role === 'admin' && (
            <button
              onClick={() => {
                if (window.confirm('Clear all logged user activity history? This cannot be undone.')) {
                  clearActivities();
                }
              }}
              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200 text-xs shrink-0 transition-colors"
              title="Clear Activity Log"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Activity Timeline List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-teal-600" />
            <h3 className="font-bold text-sm text-slate-900">User Activity Stream</h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Showing {filteredActivities.length} of {totalCount} events
          </span>
        </div>

        {filteredActivities.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No activity logs match your selected filter criteria.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredActivities.map((act) => {
              const isMine = act.userId === currentUser.id;
              return (
                <div
                  key={act.id}
                  className={`p-4 hover:bg-slate-50/80 transition-colors flex items-start gap-3.5 ${
                    isMine ? 'bg-teal-50/15' : ''
                  }`}
                >
                  <div className="p-2 rounded-xl bg-slate-100 border border-slate-200/80 shrink-0 mt-0.5">
                    {getActionIcon(act.actionType)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-900">{act.title}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 font-semibold text-slate-600 uppercase tracking-wider">
                          {act.actionType.replace('_', ' ')}
                        </span>
                        {isMine && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-teal-100 text-teal-800 font-bold">
                            You
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono shrink-0">
                        <span>{formatTimeAgo(act.timestamp)}</span>
                        <span>·</span>
                        <span>{new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{act.details}</p>

                    <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1 font-medium text-slate-700">
                        <User className="w-3 h-3 text-slate-400" />
                        {act.userName}
                      </span>
                      <span className="capitalize px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 font-semibold text-[10px]">
                        {act.userRole}
                      </span>
                      <span>·</span>
                      <span>{new Date(act.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
