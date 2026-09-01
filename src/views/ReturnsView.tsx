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
  const [returnToDelete, setReturnToDelete] = useState<any | null>(null);
  const [formError, setFormError] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    const clean = itemName.trim();
    const amt = parseFloat(amount);
    if (!clean || isNaN(amt) || qty <= 0) {
      setFormError('Please enter product name, quantity, and total refund amount.');
      return;
    }

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
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center justify-between animate-in fade-in">
              <span>{formError}</span>
              <button type="button" onClick={() => setFormError('')} className="text-rose-500 hover:text-rose-700 font-bold ml-2 cursor-pointer">&times;</button>
            </div>
          )}

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
                      type="button"
                      onClick={() => setReturnToDelete(r)}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                      title="Delete Return"
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

      {/* In-App Delete Return Confirmation Modal */}
      {returnToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-left">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Return Record</h3>
                <p className="text-xs text-slate-500 font-mono">#{returnToDelete.id}</p>
              </div>
            </div>

            <div className="p-3.5 bg-rose-50/70 rounded-xl border border-rose-200/80 text-xs text-rose-900 space-y-2">
              <p className="font-semibold text-rose-800">
                Are you sure you want to delete this {returnToDelete.returnType.toLowerCase()} return for <b className="text-rose-950 font-bold">{returnToDelete.itemName}</b>?
              </p>
              <div className="bg-white p-2.5 rounded-lg border border-rose-200 space-y-1 font-mono text-[11px] text-slate-700">
                <div>Date: {returnToDelete.date}</div>
                <div>Quantity: {returnToDelete.qty}</div>
                <div>Refund Amount: <b>{formatMoney(returnToDelete.amount, settings.currency)}</b></div>
                {returnToDelete.reason && <div>Reason: {returnToDelete.reason}</div>}
              </div>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => setReturnToDelete(null)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteReturn(returnToDelete.id);
                  setReturnToDelete(null);
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Return
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
