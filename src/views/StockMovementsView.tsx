import React, { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { formatMoney } from '../utils/audio';
import { History, Search } from 'lucide-react';

export const StockMovementsView: React.FC = () => {
  const { stockMovements, settings } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const filtered = useMemo(() => {
    return stockMovements.filter((m) => {
      if (typeFilter && m.type !== typeFilter) return false;
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        m.itemName.toLowerCase().includes(term) ||
        m.date.includes(term) ||
        (m.reference && m.reference.toLowerCase().includes(term))
      );
    });
  }, [stockMovements, typeFilter, searchTerm]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-teal-600" />
            <h3 className="font-bold text-sm text-slate-900">Inventory Movement &amp; Audit Log ({stockMovements.length})</h3>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none"
            >
              <option value="">All Movement Types</option>
              <option value="SALE">SALE (Sold)</option>
              <option value="PURCHASE">PURCHASE (Received)</option>
              <option value="RETURN">RETURN (Restocked)</option>
              <option value="WRITE_OFF">WRITE_OFF (Damaged/Sample)</option>
              <option value="AUDIT_ADJUSTMENT">AUDIT_ADJUSTMENT</option>
            </select>

            <div className="relative flex-1 md:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search item, date, reference…"
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-teal-600"
              />
            </div>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">No stock movement logs recorded.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Product Name</th>
                  <th className="px-4 py-3 text-center">Change Qty</th>
                  <th className="px-4 py-3 text-center">Stock Before</th>
                  <th className="px-4 py-3 text-center">Stock After</th>
                  <th className="px-4 py-3">Reference / Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((m) => {
                  const isPositive = m.qtyChange > 0;
                  return (
                    <tr key={m.id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-3 text-slate-600 font-mono text-[11px]">{m.date}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                            m.type === 'SALE'
                              ? 'bg-rose-100 text-rose-800'
                              : m.type === 'PURCHASE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : m.type === 'RETURN'
                              ? 'bg-teal-100 text-teal-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {m.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-900">{m.itemName}</td>
                      <td
                        className={`px-4 py-3 text-center font-mono font-extrabold ${
                          isPositive ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {isPositive ? `+${m.qtyChange}` : m.qtyChange}
                      </td>
                      <td className="px-4 py-3 text-center font-mono text-slate-500">{m.previousQty}</td>
                      <td className="px-4 py-3 text-center font-mono font-bold text-slate-900">{m.newQty}</td>
                      <td className="px-4 py-3 text-slate-500">{m.reference || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
