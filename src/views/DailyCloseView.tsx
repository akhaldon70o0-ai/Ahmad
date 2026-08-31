import React, { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { formatMoney, getTodayDateString } from '../utils/audio';
import { DailyCloseRecord } from '../types';
import { Landmark, Check, Printer } from 'lucide-react';

export const DailyCloseView: React.FC = () => {
  const { sales, expenses, dailyCloses, settings, recordDailyClose, currentUser } = useStore();
  const [selectedDate, setSelectedDate] = useState(getTodayDateString());
  const [actualCash, setActualCash] = useState<string>('');
  const [notes, setNotes] = useState('');

  // Daily totals calculation
  const daySales = useMemo(() => sales.filter((s) => s.date === selectedDate), [sales, selectedDate]);
  const dayExpenses = useMemo(() => expenses.filter((e) => e.date === selectedDate), [expenses, selectedDate]);

  const totalRevenue = daySales.reduce((sum, s) => sum + Number(s.total || 0), 0);
  const cashSales = daySales
    .filter((s) => s.paymentMethod === 'Cash')
    .reduce((sum, s) => sum + Number(s.paidAmount || 0), 0);
  const cardSales = daySales
    .filter((s) => s.paymentMethod === 'Card')
    .reduce((sum, s) => sum + Number(s.paidAmount || 0), 0);
  const transferSales = daySales
    .filter((s) => s.paymentMethod === 'Transfer')
    .reduce((sum, s) => sum + Number(s.paidAmount || 0), 0);
  const debtSales = daySales.reduce((sum, s) => sum + Number(s.debt || 0), 0);

  const totalExpenseVal = dayExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const expectedCash = Math.max(0, cashSales - totalExpenseVal);
  const actualCashNum = parseFloat(actualCash);
  const variance = !isNaN(actualCashNum) ? actualCashNum - expectedCash : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isNaN(actualCashNum)) return alert('Enter actual counted cash.');

    recordDailyClose({
      date: selectedDate,
      totalSales: totalRevenue,
      cashSales,
      cardSales,
      transferSales,
      debtSales,
      totalExpenses: totalExpenseVal,
      expectedCash,
      actualCash: actualCashNum,
      variance,
      closedBy: currentUser.name,
      notes,
    });

    alert(`Daily close for ${selectedDate} recorded successfully!`);
    setActualCash('');
    setNotes('');
  };

  const printReport = (close: DailyCloseRecord) => {
    const w = window.open('', '_blank', 'width=650,height=750');
    if (!w) return;

    w.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Daily Close Report - ${close.date}</title>
        <style>
          body { font-family: monospace; padding: 24px; color: #0f172a; }
          .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 16px; }
          .row { display: flex; justify-content: space-between; margin-bottom: 8px; }
          .total { border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 8px 0; font-weight: bold; font-size: 16px; margin: 12px 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>${settings.storeName || 'Store Ledger'}</h2>
          <p>DAILY REGISTER CLOSE (Z-REPORT)</p>
          <p>Date: ${close.date} | Closed By: ${close.closedBy}</p>
        </div>
        <div class="row"><span>Total Revenue:</span><span>${formatMoney(close.totalSales, settings.currency)}</span></div>
        <div class="row"><span>Cash Sales:</span><span>${formatMoney(close.cashSales, settings.currency)}</span></div>
        <div class="row"><span>Card / POS:</span><span>${formatMoney(close.cardSales, settings.currency)}</span></div>
        <div class="row"><span>Bank Transfer:</span><span>${formatMoney(close.transferSales, settings.currency)}</span></div>
        <div class="row"><span>Credit / Debt:</span><span>${formatMoney(close.debtSales, settings.currency)}</span></div>
        <div class="row"><span>Daily Expenses:</span><span>-${formatMoney(close.totalExpenses, settings.currency)}</span></div>
        <div class="total row"><span>EXPECTED CASH IN DRAWER:</span><span>${formatMoney(close.expectedCash, settings.currency)}</span></div>
        <div class="row"><span>Actual Counted Cash:</span><span>${formatMoney(close.actualCash, settings.currency)}</span></div>
        <div class="row"><span>Cash Variance / Discrepancy:</span><span>${formatMoney(close.variance, settings.currency)}</span></div>
        ${close.notes ? `<p><strong>Notes:</strong> ${close.notes}</p>` : ''}
        <script>window.print();</script>
      </body>
      </html>
    `);
    w.document.close();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Daily Reconciliation Form */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Landmark className="w-5 h-5 text-teal-600" />
              Daily Cash Register Reconciliation &amp; Close (Z-Report)
            </h2>
            <p className="text-xs text-slate-500">
              Calculate expected drawer balance, reconcile cash on hand, and finalize day closing.
            </p>
          </div>

          <div>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none focus:border-teal-600"
            />
          </div>
        </div>

        {/* Calculated Breakdown Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 my-4">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="text-[10px] uppercase font-bold text-slate-400">Total Sales</div>
            <div className="text-sm font-bold font-mono text-slate-900 mt-1">
              {formatMoney(totalRevenue, settings.currency)}
            </div>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="text-[10px] uppercase font-bold text-slate-400">Cash Inflow</div>
            <div className="text-sm font-bold font-mono text-teal-700 mt-1">
              {formatMoney(cashSales, settings.currency)}
            </div>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="text-[10px] uppercase font-bold text-slate-400">Card / POS</div>
            <div className="text-sm font-bold font-mono text-slate-700 mt-1">
              {formatMoney(cardSales, settings.currency)}
            </div>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="text-[10px] uppercase font-bold text-slate-400">Transfers</div>
            <div className="text-sm font-bold font-mono text-slate-700 mt-1">
              {formatMoney(transferSales, settings.currency)}
            </div>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="text-[10px] uppercase font-bold text-slate-400">Expenses Out</div>
            <div className="text-sm font-bold font-mono text-rose-600 mt-1">
              {formatMoney(totalExpenseVal, settings.currency)}
            </div>
          </div>
          <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg">
            <div className="text-[10px] uppercase font-bold text-teal-800">Expected Cash</div>
            <div className="text-sm font-extrabold font-mono text-teal-900 mt-1">
              {formatMoney(expectedCash, settings.currency)}
            </div>
          </div>
        </div>

        {/* Counted Cash Form */}
        <form onSubmit={handleSubmit} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                Actual Physical Cash Counted *
              </label>
              <input
                type="number"
                min="0"
                step="any"
                required
                value={actualCash}
                onChange={(e) => setActualCash(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono font-bold focus:outline-none focus:border-teal-600"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Closing Notes / Discrepancy Reason</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Minor float adjustment, verified by shift manager"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-teal-600"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="text-xs font-semibold">
              Variance:{' '}
              <span
                className={`font-mono font-bold ${
                  variance === 0 ? 'text-emerald-600' : variance > 0 ? 'text-teal-600' : 'text-rose-600'
                }`}
              >
                {formatMoney(variance, settings.currency)}
              </span>
            </div>

            <button
              type="submit"
              className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              Finalize Daily Register Close
            </button>
          </div>
        </form>
      </div>

      {/* Historical Daily Closes Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <h3 className="font-bold text-sm text-slate-900">Historical Daily Close Records ({dailyCloses.length})</h3>
        </div>

        {dailyCloses.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">No daily closes recorded yet.</div>
        ) : (
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 text-right">Total Revenue</th>
                <th className="px-4 py-3 text-right">Expected Cash</th>
                <th className="px-4 py-3 text-right">Actual Cash</th>
                <th className="px-4 py-3 text-right">Variance</th>
                <th className="px-4 py-3">Closed By</th>
                <th className="px-4 py-3 text-center">Print</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {dailyCloses.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3 font-semibold text-slate-900">{c.date}</td>
                  <td className="px-4 py-3 text-right font-mono font-bold">
                    {formatMoney(c.totalSales, settings.currency)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-slate-600">
                    {formatMoney(c.expectedCash, settings.currency)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-extrabold text-slate-900">
                    {formatMoney(c.actualCash, settings.currency)}
                  </td>
                  <td
                    className={`px-4 py-3 text-right font-mono font-bold ${
                      c.variance >= 0 ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {formatMoney(c.variance, settings.currency)}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{c.closedBy}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => printReport(c)}
                      className="p-1.5 text-teal-600 hover:bg-teal-50 rounded-lg"
                      title="Print Z-Report"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
