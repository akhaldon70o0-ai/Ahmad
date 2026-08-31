import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { formatMoney, getTodayDateString } from '../utils/audio';
import { RotateCcw, Plus, Trash2 } from 'lucide-react';

export const ReturnsView: React.FC = () => {
  const { returns, inventory, settings, recordReturn, deleteReturn } = useStore();

  const [date, setDate] = useState(getTodayDateString());
  const [returnType, setReturnType] = useState<'Customer' | 'Supplier'>('Customer');
  const [itemName, setItemName] = useState('');
  const [qty, setQty] = useState<number>(1);
  const [amount, setAmount] = useState<string>('');
  const [reason, setReason] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = itemName.trim();
    const amt = parseFloat(amount);
    if (!clean || isNaN(amt) || qty <= 0) return alert('Enter product, quantity, and total refund amount.');

    const match = inventory.find((i) => i.name.toLowerCase() === clean.toLowerCase());

    recordReturn({
      date,
      returnType,
      itemId: match ? match.id : null,
      itemName: match ? match.name : clean,
      qty: Number(qty),
      amount: amt,
      reason,
    });

    setItemName('');
    setQty(1);
    setAmount('');
    setReason('');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Record Return Form */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
        <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2 mb-4">
          <RotateCcw className="w-5 h-5 text-teal-600" />
          Process Return &amp; Stock Adjustment
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Return Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium focus:outline-none focus:border-teal-600"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Return Type</label>
              <select
                value={returnType}
                onChange={(e) => setReturnType(e.target.value as 'Customer' | 'Supplier')}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none focus:border-teal-600"
              >
                <option value="Customer">Customer Return (+Stock / -Revenue)</option>
                <option value="Supplier">Supplier Return (-Stock / +Refund)</option>
              </select>
            </div>

            <div className="lg:col-span-2">
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Product Item *</label>
              <input
                type="text"
                required
                list="returns-inv-list"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="Select product..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium focus:outline-none focus:border-teal-600"
              />
              <datalist id="returns-inv-list">
                {inventory.map((i) => (
                  <option key={i.id} value={i.name} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Quantity</label>
              <input
                type="number"
                min="1"
                step="1"
                required
                value={qty}
                onChange={(e) => setQty(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold focus:outline-none focus:border-teal-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Refund / Credit Amount *</label>
              <input
                type="number"
                min="0"
                step="any"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold focus:outline-none focus:border-teal-600"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Reason / Notes</label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Customer changed mind, wrong roast profile"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-teal-600"
              />
            </div>

            <div>
              <button
                type="submit"
                className="w-full py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Process Return
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Returns History Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <h3 className="font-bold text-sm text-slate-900">Returns &amp; Refunds Log ({returns.length})</h3>
        </div>

        {returns.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">No return records logged yet.</div>
        ) : (
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Product Name</th>
                <th className="px-4 py-3 text-center">Qty</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3">Reason</th>
                <th className="px-4 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {returns.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3 text-slate-600">{r.date}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        r.returnType === 'Customer' ? 'bg-teal-100 text-teal-800' : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {r.returnType}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-bold text-slate-900">{r.itemName}</td>
                  <td className="px-4 py-3 text-center font-mono font-bold">{r.qty}</td>
                  <td className="px-4 py-3 text-right font-mono font-extrabold text-slate-900">
                    {formatMoney(r.amount, settings.currency)}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{r.reason || '—'}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => {
                        if (window.confirm('Delete return record?')) {
                          deleteReturn(r.id);
                        }
                      }}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
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
