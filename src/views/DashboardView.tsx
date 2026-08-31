import React, { useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { formatMoney, getTodayDateString, formatTimeAgo } from '../utils/audio';
import {
  TrendingUp,
  Package,
  Users,
  ClipboardList,
  DollarSign,
  AlertTriangle,
  Receipt,
  ArrowUpRight,
  PlusCircle,
  Clock,
  Sparkles,
} from 'lucide-react';

interface DashboardViewProps {
  onNavigate: (view: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const {
    inventory,
    sales,
    purchases,
    customers,
    dailyOrders,
    expenses,
    settings,
    activities,
    currentUser,
  } = useStore();

  const currentMonth = getTodayDateString().slice(0, 7);
  const todayStr = getTodayDateString();

  // Metrics Calculations
  const salesThisMonth = useMemo(() => {
    return sales
      .filter((s) => s.date && s.date.slice(0, 7) === currentMonth)
      .reduce((sum, s) => sum + Number(s.total || 0), 0);
  }, [sales, currentMonth]);

  const purchThisMonth = useMemo(() => {
    return purchases
      .filter((p) => p.date && p.date.slice(0, 7) === currentMonth)
      .reduce((sum, p) => sum + Number(p.total || 0), 0);
  }, [purchases, currentMonth]);

  const invValue = useMemo(() => {
    return inventory.reduce((sum, i) => sum + Number(i.qty || 0) * Number(i.cost || 0), 0);
  }, [inventory]);

  const lowStockItems = useMemo(() => {
    return inventory.filter((i) => Number(i.qty || 0) <= Number(i.threshold || 0));
  }, [inventory]);

  const ordersToday = useMemo(() => {
    return dailyOrders.filter((o) => o.date === todayStr);
  }, [dailyOrders, todayStr]);

  const customerReceivables = useMemo(() => {
    return sales.reduce((sum, s) => sum + Math.max(0, Number(s.total || 0) - Number(s.paidAmount || 0)), 0);
  }, [sales]);

  const expensesThisMonth = useMemo(() => {
    return expenses
      .filter((e) => e.date && e.date.slice(0, 7) === currentMonth)
      .reduce((sum, e) => sum + Number(e.amount || 0), 0);
  }, [expenses, currentMonth]);

  const grossProfitThisMonth = useMemo(() => {
    return sales
      .filter((s) => s.date && s.date.slice(0, 7) === currentMonth)
      .reduce((sum, s) => {
        const itemProfit = (s.items || []).reduce((acc, it) => {
          if (it.cost == null || isNaN(Number(it.cost))) return acc;
          return acc + (Number(it.price) - Number(it.cost)) * Number(it.qty);
        }, 0);
        return sum + (itemProfit - Number(s.discountAmount || 0));
      }, 0);
  }, [sales, currentMonth]);

  const netProfitThisMonth = grossProfitThisMonth - expensesThisMonth;

  // Top Selling Products Map
  const topProducts = useMemo(() => {
    const map: Record<string, { name: string; qty: number; sales: number; profit: number }> = {};
    sales.forEach((s) => {
      (s.items || []).forEach((it) => {
        const k = it.itemName || 'Unknown';
        if (!map[k]) map[k] = { name: k, qty: 0, sales: 0, profit: 0 };
        map[k].qty += Number(it.qty) || 0;
        map[k].sales += Number(it.price) * Number(it.qty) || 0;
        if (it.cost != null) {
          map[k].profit += (Number(it.price) - Number(it.cost)) * Number(it.qty);
        }
      });
    });
    return Object.values(map)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
  }, [sales]);

  // Operational Alerts
  const alerts = useMemo(() => {
    const list: string[] = [];
    if (lowStockItems.length > 0) {
      list.push(
        `Low stock warning: ${lowStockItems.length} item(s) below threshold (${lowStockItems
          .slice(0, 4)
          .map((i) => i.name)
          .join(', ')}${lowStockItems.length > 4 ? '...' : ''})`
      );
    }
    const overdueOrders = dailyOrders.filter(
      (o) => o.expectedDelivery && o.expectedDelivery < todayStr && o.status !== 'Delivered' && o.status !== 'Cancelled'
    );
    if (overdueOrders.length > 0) {
      list.push(`Overdue delivery orders: ${overdueOrders.length} order(s) pending past expected delivery.`);
    }
    return list;
  }, [lowStockItems, dailyOrders, todayStr]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Quick Action & Greeting Strip */}
      <div className="flex flex-wrap gap-3 items-center justify-between bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Welcome, {currentUser.name}!</h2>
            <p className="text-xs text-slate-500">Overview metrics and ledger summary for {currentMonth}</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => onNavigate('profile')}
            className="px-3.5 py-2 border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <Users className="w-3.5 h-3.5 text-blue-600" />
            My Profile
          </button>
          <button
            onClick={() => onNavigate('sales')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            New POS Sale
          </button>
          <button
            onClick={() => onNavigate('inventory')}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <Package className="w-3.5 h-3.5" />
            Add Product
          </button>
          <button
            onClick={() => onNavigate('daily-orders')}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <ClipboardList className="w-3.5 h-3.5" />
            New Order
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {/* Sales This Month */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Sales Volume</p>
          <p className="font-mono text-2xl font-bold text-slate-900">
            {formatMoney(salesThisMonth, settings.currency)}
          </p>
          <div className="mt-2 text-xs text-emerald-600 font-medium flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            {sales.filter((s) => s.date && s.date.slice(0, 7) === currentMonth).length} invoices recorded
          </div>
        </div>

        {/* Purchases Month */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Stock Purchases</p>
          <p className="font-mono text-2xl font-bold text-slate-900">
            {formatMoney(purchThisMonth, settings.currency)}
          </p>
          <div className="mt-2 text-xs text-slate-400 font-medium">Inbound supplier receipts</div>
        </div>

        {/* Inventory Valuation */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Inventory Value</p>
          <p className="font-mono text-2xl font-bold text-slate-900">
            {formatMoney(invValue, settings.currency)}
          </p>
          <div className="mt-2 text-xs text-blue-600 font-medium">{inventory.length} catalog goods</div>
        </div>

        {/* Low Stock Warning */}
        <div
          onClick={() => onNavigate('inventory')}
          className={`cursor-pointer p-5 rounded-xl border shadow-xs transition-all ${
            lowStockItems.length > 0
              ? 'bg-rose-50/50 border-rose-200 hover:border-rose-300'
              : 'bg-white border-slate-200'
          }`}
        >
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Low Stock Items</p>
          <p
            className={`font-mono text-2xl font-bold ${
              lowStockItems.length > 0 ? 'text-rose-600' : 'text-emerald-600'
            }`}
          >
            {lowStockItems.length}
          </p>
          <div className="mt-2 text-xs font-medium">
            {lowStockItems.length > 0 ? (
              <span className="text-rose-600">Reorder required</span>
            ) : (
              <span className="text-emerald-600">Stock optimal</span>
            )}
          </div>
        </div>

        {/* Registered CRM Clients */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Customers CRM</p>
          <p className="font-mono text-2xl font-bold text-slate-900">{customers.length}</p>
          <div className="mt-2 text-xs text-slate-400 font-medium">Active client accounts</div>
        </div>

        {/* Orders Board Today */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Orders Today</p>
          <p className="font-mono text-2xl font-bold text-slate-900">{ordersToday.length}</p>
          <div className="mt-2 text-xs text-blue-600 font-medium">Packing &amp; dispatch</div>
        </div>

        {/* Customer Receivables */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Customer Receivables</p>
          <p className="font-mono text-2xl font-bold text-rose-600">
            {formatMoney(customerReceivables, settings.currency)}
          </p>
          <div className="mt-2 text-xs text-slate-400 font-medium">Outstanding ledger debt</div>
        </div>

        {/* Net Profit Featured Card */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl shadow-md p-5 text-white">
          <p className="text-xs font-bold text-blue-100 uppercase tracking-wider mb-1">Net Margin This Month</p>
          <p className="font-mono text-2xl font-extrabold text-white">
            {formatMoney(netProfitThisMonth, settings.currency)}
          </p>
          <div className="mt-2 text-xs text-blue-100 font-medium">
            Gross: {formatMoney(grossProfitThisMonth, settings.currency)} − Exp: {formatMoney(expensesThisMonth, settings.currency)}
          </div>
        </div>
      </div>

      {/* Operational Alerts Panel */}
      {alerts.length > 0 && (
        <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wider mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            Operational Alerts ({alerts.length})
          </div>
          <div className="space-y-1.5">
            {alerts.map((alert, idx) => (
              <div key={idx} className="text-xs text-amber-900 font-medium flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                <span>{alert}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Two Column Layout: Top Products & Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Selling Products (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              Top Selling Products
            </h3>
            <button
              onClick={() => onNavigate('sales')}
              className="text-blue-600 text-xs font-semibold hover:underline flex items-center gap-1"
            >
              Sales History <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 overflow-x-auto">
            {topProducts.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">No sales recorded yet this period.</div>
            ) : (
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  <tr>
                    <th className="px-5 py-3">Product Name</th>
                    <th className="px-5 py-3 text-right">Units Sold</th>
                    <th className="px-5 py-3 text-right">Revenue</th>
                    <th className="px-5 py-3 text-right">Net Margin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {topProducts.map((p, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3 font-semibold text-slate-800">{p.name}</td>
                      <td className="px-5 py-3 text-right font-mono font-bold text-slate-900">{p.qty}</td>
                      <td className="px-5 py-3 text-right font-mono text-slate-700">
                        {formatMoney(p.sales, settings.currency)}
                      </td>
                      <td
                        className={`px-5 py-3 text-right font-mono font-bold ${
                          p.profit >= 0 ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {formatMoney(p.profit, settings.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* User Activities Stream (1 Col) */}
        <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              Live Activities
            </h3>
            <button
              onClick={() => onNavigate('activities')}
              className="text-blue-600 text-xs font-semibold hover:underline flex items-center gap-1"
            >
              Full Log <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 flex-1 overflow-y-auto max-h-[380px]">
            {activities.slice(0, 7).map((act) => (
              <div key={act.id} className="p-4 hover:bg-slate-50 transition-colors flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-slate-800 truncate">{act.title}</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 font-semibold uppercase shrink-0">
                      {act.userName}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{act.details}</p>
                </div>
                <span className="text-[10px] text-slate-400 font-mono shrink-0">
                  {formatTimeAgo(act.timestamp)}
                </span>
              </div>
            ))}
            {activities.length === 0 && (
              <div className="p-8 text-center text-xs text-slate-400">No activities logged yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
