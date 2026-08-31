import React, { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { formatMoney, getTodayDateString } from '../utils/audio';
import { PackageCheck, Search, Plus, Trash2 } from 'lucide-react';

export const PurchasesView: React.FC = () => {
  const { purchases, inventory, suppliers, settings, recordPurchase, deletePurchase } = useStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [date, setDate] = useState(getTodayDateString());
  const [itemName, setItemName] = useState('');
  const [qty, setQty] = useState<number>(1);
  const [cost, setCost] = useState<string>('');
  const [supplier, setSupplier] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = itemName.trim();
    const costNum = parseFloat(cost);
    if (!cleanName || isNaN(costNum) || costNum < 0 || qty <= 0) {
      return alert('Please provide product name, quantity received, and unit cost price.');
    }

    const match = inventory.find((i) => i.name.toLowerCase() === cleanName.toLowerCase());

    recordPurchase({
      date,
      itemId: match ? match.id : null,
      itemName: match ? match.name : cleanName,
      qty: Number(qty),
      cost: costNum,
      total: Number(qty) * costNum,
      supplier: supplier.trim() || undefined,
    });

    setItemName('');
    setQty(1);
    setCost('');
    setSupplier('');
  };

  const filteredPurchases = useMemo(() => {
    if (!searchTerm) return purchases;
    const term = searchTerm.toLowerCase();
    return purchases.filter(
      (p) =>
        p.itemName.toLowerCase().includes(term) ||
        p.date.includes(term) ||
        (p.supplier && p.supplier.toLowerCase().includes(term))
    );
  }, [purchases, searchTerm]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Record Purchase Form */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
        <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2 mb-4">
          <PackageCheck className="w-5 h-5 text-teal-600" />
          Record Incoming Stock from Supplier
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Purchase Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium focus:outline-none focus:border-teal-600"
              />
            </div>

            <div className="lg:col-span-2">
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Product Item *</label>
              <input
                type="text"
                required
                list="purch-inv-list"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="Type or pick existing product..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium focus:outline-none focus:border-teal-600"
              />
              <datalist id="purch-inv-list">
                {inventory.map((i) => (
                  <option key={i.id} value={i.name}>
                    Current Stock: {i.qty} · Avg Cost: {formatMoney(i.cost, settings.currency)}
                  </option>
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Quantity Received *</label>
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

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Unit Cost Price *</label>
              <input
                type="number"
                min="0"
                step="any"
                required
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold focus:outline-none focus:border-teal-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Supplier / Vendor</label>
              <input
                type="text"
                list="purch-sup-list"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                placeholder="Supplier name or pick from directory..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-teal-600"
              />
              <datalist id="purch-sup-list">
                {suppliers.map((s) => (
                  <option key={s.id} value={s.name} />
                ))}
              </datalist>
            </div>

            <div>
              <button
                type="submit"
                className="w-full py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Record Purchase &amp; Update Stock
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Purchases History Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="flex items-center gap-2">
            <PackageCheck className="w-4 h-4 text-teal-600" />
            <h3 className="font-bold text-sm text-slate-900">Purchases Log ({purchases.length})</h3>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search product, supplier, date…"
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-teal-600"
            />
          </div>
        </div>

        {filteredPurchases.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">No purchases recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Product Name</th>
                  <th className="px-4 py-3 text-center">Qty Received</th>
                  <th className="px-4 py-3 text-right">Unit Cost</th>
                  <th className="px-4 py-3 text-right">Total Invoiced</th>
                  <th className="px-4 py-3">Supplier</th>
                  <th className="px-4 py-3 text-right">New Avg Cost</th>
                  <th className="px-4 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPurchases.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3 text-slate-600">{p.date}</td>
                    <td className="px-4 py-3 font-bold text-slate-900">{p.itemName}</td>
                    <td className="px-4 py-3 text-center font-mono font-bold">{p.qty}</td>
                    <td className="px-4 py-3 text-right font-mono">{formatMoney(p.cost, settings.currency)}</td>
                    <td className="px-4 py-3 text-right font-mono font-extrabold text-slate-900">
                      {formatMoney(p.total, settings.currency)}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{p.supplier || '—'}</td>
                    <td className="px-4 py-3 text-right font-mono text-teal-700 font-bold">
                      {p.newAverageCost != null ? formatMoney(p.newAverageCost, settings.currency) : '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => {
                          if (window.confirm('Delete purchase record? Stock will be adjusted.')) {
                            deletePurchase(p.id);
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
          </div>
        )}
      </div>
    </div>
  );
};
