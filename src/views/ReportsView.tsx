import React, { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { formatMoney, getTodayDateString } from '../utils/audio';
import { BarChart3, Download, TrendingUp, DollarSign, ArrowUpRight, ArrowDownRight, Calendar } from 'lucide-react';

export const ReportsView: React.FC = () => {
  const { sales, expenses, purchases, inventory, settings, currentUser } = useStore();

  const [dateRange, setDateRange] = useState<'all' | 'today' | 'this_month' | 'custom'>('this_month');
  const [customStart, setCustomStart] = useState(getTodayDateString());
  const [customEnd, setCustomEnd] = useState(getTodayDateString());

  const isCashier = currentUser.role === 'cashier';

  // Filter dates
  const filteredSales = useMemo(() => {
    const today = getTodayDateString();
    const currentMonth = today.substring(0, 7);

    return sales.filter((s) => {
      if (dateRange === 'today') return s.date === today;
      if (dateRange === 'this_month') return s.date.startsWith(currentMonth);
      if (dateRange === 'custom') return s.date >= customStart && s.date <= customEnd;
      return true;
    });
  }, [sales, dateRange, customStart, customEnd]);

  const filteredExpenses = useMemo(() => {
    const today = getTodayDateString();
    const currentMonth = today.substring(0, 7);

    return expenses.filter((e) => {
      if (dateRange === 'today') return e.date === today;
      if (dateRange === 'this_month') return e.date.startsWith(currentMonth);
      if (dateRange === 'custom') return e.date >= customStart && e.date <= customEnd;
      return true;
    });
  }, [expenses, dateRange, customStart, customEnd]);

  // Aggregate Metrics
  const totalRevenue = filteredSales.reduce((sum, s) => sum + Number(s.total || 0), 0);
  const totalCost = filteredSales.reduce((sum, s) => sum + Number(s.costTotal || 0), 0);
  const grossProfit = totalRevenue - totalCost;
  const totalExpensesVal = filteredExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const netProfit = grossProfit - totalExpensesVal;

  // Payment Breakdown
  const paymentBreakdown = useMemo(() => {
    const map: { [method: string]: number } = { Cash: 0, Card: 0, Transfer: 0, Debt: 0 };
    filteredSales.forEach((s) => {
      if (s.debt && s.debt > 0) map.Debt += Number(s.debt);
      const m = s.paymentMethod || 'Cash';
      map[m] = (map[m] || 0) + Number(s.paidAmount || 0);
    });
    return map;
  }, [filteredSales]);

  // Month over Month matrix (Last 6 Months)
  const momData = useMemo(() => {
    const monthsMap: { [m: string]: { revenue: number; cost: number; expenses: number } } = {};

    sales.forEach((s) => {
      const m = s.date.substring(0, 7);
      if (!monthsMap[m]) monthsMap[m] = { revenue: 0, cost: 0, expenses: 0 };
      monthsMap[m].revenue += Number(s.total || 0);
      monthsMap[m].cost += Number(s.costTotal || 0);
    });

    expenses.forEach((e) => {
      const m = e.date.substring(0, 7);
      if (!monthsMap[m]) monthsMap[m] = { revenue: 0, cost: 0, expenses: 0 };
      monthsMap[m].expenses += Number(e.amount || 0);
    });

    return Object.entries(monthsMap)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .slice(0, 6)
      .map(([month, data]) => {
        const gross = data.revenue - data.cost;
        const net = gross - data.expenses;
        const margin = data.revenue > 0 ? ((net / data.revenue) * 100).toFixed(1) : '0';
        return {
          month,
          ...data,
          gross,
          net,
          margin,
        };
      });
  }, [sales, expenses]);

  // Export CSV Report
  const exportFullReport = () => {
    const headers = ['Invoice ID', 'Date', 'Customer', 'Payment Method', 'Total Revenue', 'Cost', 'Gross Profit'];
    const rows = filteredSales.map((s) => [
      s.id,
      s.date,
      `"${(s.customer || 'Walk-in').replace(/"/g, '""')}"`,
      s.paymentMethod,
      s.total,
      s.costTotal || 0,
      (s.total || 0) - (s.costTotal || 0),
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `financial-report-${getTodayDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Date Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-teal-600" />
          <h2 className="font-extrabold text-sm text-slate-900">Financial Reports &amp; Analytics</h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex bg-slate-100 p-1 rounded-lg">
            {(['this_month', 'today', 'all', 'custom'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setDateRange(r)}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${
                  dateRange === r ? 'bg-white text-teal-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {r === 'this_month' ? 'This Month' : r === 'today' ? 'Today' : r === 'all' ? 'All Time' : 'Custom'}
              </button>
            ))}
          </div>

          {dateRange === 'custom' && (
            <div className="flex items-center gap-1 text-xs">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="px-2 py-1 bg-white border border-slate-300 rounded text-xs"
              />
              <span>to</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="px-2 py-1 bg-white border border-slate-300 rounded text-xs"
              />
            </div>
          )}

          <button
            onClick={exportFullReport}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Primary KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[10px] uppercase font-bold text-slate-400">Total Sales Revenue</div>
          <div className="text-xl font-extrabold text-slate-900 mt-1 font-mono">
            {formatMoney(totalRevenue, settings.currency)}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">{filteredSales.length} Transactions</div>
        </div>

        {!isCashier && (
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="text-[10px] uppercase font-bold text-slate-400">Gross Profit (Margin)</div>
            <div className="text-xl font-extrabold text-emerald-600 mt-1 font-mono">
              {formatMoney(grossProfit, settings.currency)}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100).toFixed(1) : 0}% Gross Margin
            </div>
          </div>
        )}

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[10px] uppercase font-bold text-slate-400">Operating Expenses</div>
          <div className="text-xl font-extrabold text-rose-600 mt-1 font-mono">
            {formatMoney(totalExpensesVal, settings.currency)}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">{filteredExpenses.length} Expense Logs</div>
        </div>

        {!isCashier && (
          <div className="bg-white p-4 rounded-xl border border-teal-200 shadow-xs">
            <div className="text-[10px] uppercase font-bold text-teal-800">Net Profit (Take-Home)</div>
            <div
              className={`text-xl font-extrabold mt-1 font-mono ${
                netProfit >= 0 ? 'text-teal-700' : 'text-rose-600'
              }`}
            >
              {formatMoney(netProfit, settings.currency)}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">After all operating overhead</div>
          </div>
        )}
      </div>

      {/* Payment Methods Breakdown */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <h3 className="font-bold text-sm text-slate-900 mb-3">Revenue Collection by Payment Channel</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.entries(paymentBreakdown).map(([method, amt]) => (
            <div key={method} className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="text-[11px] font-bold text-slate-600">{method}</div>
              <div className="font-mono text-base font-extrabold text-slate-900 mt-0.5">
                {formatMoney(Number(amt || 0), settings.currency)}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {totalRevenue > 0 ? ((Number(amt || 0) / totalRevenue) * 100).toFixed(0) : 0}% of volume
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Month-over-Month Performance Matrix */}
      {!isCashier && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200">
            <h3 className="font-bold text-sm text-slate-900">Month-over-Month (MoM) Financial Matrix</h3>
          </div>

          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              <tr>
                <th className="px-4 py-3">Month</th>
                <th className="px-4 py-3 text-right">Revenue</th>
                <th className="px-4 py-3 text-right">Cost of Goods</th>
                <th className="px-4 py-3 text-right">Gross Profit</th>
                <th className="px-4 py-3 text-right">Expenses</th>
                <th className="px-4 py-3 text-right">Net Profit</th>
                <th className="px-4 py-3 text-right">Net Margin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {momData.map((m) => (
                <tr key={m.month} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-bold text-slate-900">{m.month}</td>
                  <td className="px-4 py-3 text-right font-mono font-bold">
                    {formatMoney(m.revenue, settings.currency)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-slate-500">
                    {formatMoney(m.cost, settings.currency)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-emerald-600">
                    {formatMoney(m.gross, settings.currency)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-rose-600">
                    {formatMoney(m.expenses, settings.currency)}
                  </td>
                  <td
                    className={`px-4 py-3 text-right font-mono font-extrabold ${
                      m.net >= 0 ? 'text-teal-700' : 'text-rose-600'
                    }`}
                  >
                    {formatMoney(m.net, settings.currency)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-slate-700">{m.margin}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
