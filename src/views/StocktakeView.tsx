import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { formatMoney, getTodayDateString } from '../utils/audio';
import { CheckCheck, Save } from 'lucide-react';

export const StocktakeView: React.FC = () => {
  const { inventory, settings, performStocktake } = useStore();
  const [counts, setCounts] = useState<{ [id: string]: number }>(() => {
    const init: { [id: string]: number } = {};
    inventory.forEach((i) => {
      init[i.id] = i.qty;
    });
    return init;
  });

  const handleQtyChange = (id: string, val: string) => {
    const num = parseFloat(val);
    setCounts((prev) => ({
      ...prev,
      [id]: isNaN(num) ? 0 : num,
    }));
  };

  const handleApplyStocktake = () => {
    const updates = Object.entries(counts).map(([itemId, countedQty]) => ({
      itemId,
      countedQty: Number(countedQty || 0),
    }));

    if (window.confirm('Apply physical stock audit adjustments to current inventory?')) {
      performStocktake(updates);
      alert('Physical inventory count audit applied successfully.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <CheckCheck className="w-5 h-5 text-teal-600" />
              Physical Stocktake &amp; Audit
            </h2>
            <p className="text-xs text-slate-500">
              Audit physical on-shelf quantities and automatically record variance reconciliations.
            </p>
          </div>

          <button
            onClick={handleApplyStocktake}
            className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-xs transition-colors"
          >
            <Save className="w-4 h-4" />
            Apply Stock Audit
          </button>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              <tr>
                <th className="px-4 py-3">Product Name</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3 text-center">System Qty</th>
                <th className="px-4 py-3 text-center">Physical Count</th>
                <th className="px-4 py-3 text-center">Variance</th>
                <th className="px-4 py-3 text-right">Unit Cost</th>
                <th className="px-4 py-3 text-right">Variance Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {inventory.map((item) => {
                const counted = counts[item.id] !== undefined ? counts[item.id] : item.qty;
                const variance = counted - item.qty;
                const varianceValue = variance * item.cost;

                return (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold text-slate-900">{item.name}</td>
                    <td className="px-4 py-3 text-slate-500">{item.category || '—'}</td>
                    <td className="px-4 py-3 text-center font-mono font-bold text-slate-700">{item.qty}</td>
                    <td className="px-4 py-3 text-center">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={counted}
                        onChange={(e) => handleQtyChange(item.id, e.target.value)}
                        className="w-20 px-2 py-1 bg-white border border-slate-300 rounded font-mono font-bold text-center focus:outline-none focus:border-teal-600"
                      />
                    </td>
                    <td
                      className={`px-4 py-3 text-center font-mono font-bold ${
                        variance > 0 ? 'text-emerald-600' : variance < 0 ? 'text-rose-600' : 'text-slate-400'
                      }`}
                    >
                      {variance > 0 ? `+${variance}` : variance}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-600">
                      {formatMoney(item.cost, settings.currency)}
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-mono font-bold ${
                        varianceValue > 0 ? 'text-emerald-600' : varianceValue < 0 ? 'text-rose-600' : 'text-slate-400'
                      }`}
                    >
                      {formatMoney(varianceValue, settings.currency)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
