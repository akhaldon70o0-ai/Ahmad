import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { formatMoney, getTodayDateString } from '../utils/audio';
import { AlertTriangle, Plus, Trash2 } from 'lucide-react';

export const DamagedSamplesView: React.FC = () => {
  const { inventory, writeOffs, settings, recordWriteOff, deleteWriteOff } = useStore();

  const [date, setDate] = useState(getTodayDateString());
  const [type, setType] = useState<'Damaged' | 'Sample'>('Damaged');
  const [selectedItemName, setSelectedItemName] = useState('');
  const [qty, setQty] = useState<number>(1);
  const [note, setNote] = useState('');
  const [writeOffToDelete, setWriteOffToDelete] = useState<any | null>(null);
  const [formError, setFormError] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    const clean = selectedItemName.trim();
    if (!clean) {
      setFormError('Please select an existing product.');
      return;
    }

    const match = inventory.find((i) => i.name.toLowerCase() === clean.toLowerCase());
    if (!match) {
      setFormError('Product not found in existing catalog.');
      return;
    }

    const unitCost = Number(match.cost) || 0;
    const totalCost = unitCost * qty;

    recordWriteOff({
      date,
      type,
      itemId: match.id,
      itemName: match.name,
      qty,
      unitCost,
      totalCost,
      note,
    });

    setSelectedItemName('');
    setQty(1);
    setNote('');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Write Off Form */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
        <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2 mb-1">
          <AlertTriangle className="w-5 h-5 text-rose-600" />
          Record Damaged Goods or Promo Samples
        </h2>
        <p className="text-xs text-slate-500 mb-4">
          Deducts quantity from stock and posts total cost value into Expenses automatically.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center justify-between animate-in fade-in">
              <span>{formError}</span>
              <button type="button" onClick={() => setFormError('')} className="text-rose-500 hover:text-rose-700 font-bold ml-2 cursor-pointer">&times;</button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium focus:outline-none focus:border-teal-600"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as 'Damaged' | 'Sample')}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium focus:outline-none focus:border-teal-600"
              >
                <option value="Damaged">Damaged / Expired Goods</option>
                <option value="Sample">Free Promo Sample / Gift</option>
              </select>
            </div>

            <div className="lg:col-span-2">
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Product</label>
              <input
                type="text"
                required
                list="writeoff-inv-list"
                value={selectedItemName}
                onChange={(e) => setSelectedItemName(e.target.value)}
                placeholder="Pick product..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium focus:outline-none focus:border-teal-600"
              />
              <datalist id="writeoff-inv-list">
                {inventory.map((i) => (
                  <option key={i.id} value={i.name}>
                    Stock: {i.qty} · Cost: {formatMoney(i.cost, settings.currency)}
                  </option>
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

          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Reason / Notes</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Broken seal during transit, expiration date reached"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-teal-600"
            />
          </div>

          <div>
            <button
              type="submit"
              className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Process Write-off
            </button>
          </div>
        </form>
      </div>

      {/* Write-offs Log Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <h3 className="font-bold text-sm text-slate-900">Damaged Goods &amp; Samples Log ({writeOffs.length})</h3>
        </div>

        {writeOffs.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">No damaged items or samples logged.</div>
        ) : (
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Product Name</th>
                <th className="px-4 py-3 text-center">Qty</th>
                <th className="px-4 py-3 text-right">Cost Loss</th>
                <th className="px-4 py-3">Reason / Notes</th>
                <th className="px-4 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {writeOffs.map((w) => (
                <tr key={w.id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3 text-slate-600">{w.date}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        w.type === 'Damaged' ? 'bg-rose-100 text-rose-800' : 'bg-teal-100 text-teal-800'
                      }`}
                    >
                      {w.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-bold text-slate-900">{w.itemName}</td>
                  <td className="px-4 py-3 text-center font-mono font-bold">{w.qty}</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-rose-600">
                    {formatMoney(w.totalCost, settings.currency)}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{w.note || '—'}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      type="button"
                      onClick={() => setWriteOffToDelete(w)}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                      title="Delete Write-off"
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

      {/* In-App Delete Write-off Confirmation Modal */}
      {writeOffToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-left">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Write-off Record</h3>
                <p className="text-xs text-slate-500 font-mono">#{writeOffToDelete.id}</p>
              </div>
            </div>

            <div className="p-3.5 bg-rose-50/70 rounded-xl border border-rose-200/80 text-xs text-rose-900 space-y-2">
              <p className="font-semibold text-rose-800">
                Are you sure you want to remove this write-off record for <b className="text-rose-950 font-bold">{writeOffToDelete.itemName}</b>?
              </p>
              <div className="bg-white p-2.5 rounded-lg border border-rose-200 space-y-1 font-mono text-[11px] text-slate-700">
                <div>Type: <span className="font-sans font-bold">{writeOffToDelete.type}</span></div>
                <div>Quantity: {writeOffToDelete.qty}</div>
                <div>Value: <b>{formatMoney(writeOffToDelete.totalCost, settings.currency)}</b></div>
                {writeOffToDelete.note && <div>Note: {writeOffToDelete.note}</div>}
              </div>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => setWriteOffToDelete(null)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteWriteOff(writeOffToDelete.id);
                  setWriteOffToDelete(null);
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
