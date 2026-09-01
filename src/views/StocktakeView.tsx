import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { formatMoney, getTodayDateString } from '../utils/audio';
import { CheckCheck, Save, AlertCircle, CheckCircle2 } from 'lucide-react';

export const StocktakeView: React.FC = () => {
  const { inventory, settings, performStocktake } = useStore();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [successToast, setSuccessToast] = useState('');
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

    performStocktake(updates);
    setShowConfirmModal(false);
    setSuccessToast('Physical stocktake adjustments have been successfully applied and reconciled.');
    setTimeout(() => setSuccessToast(''), 4000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {successToast && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessToast('')}
            className="text-emerald-600 hover:text-emerald-800 font-bold ml-2 cursor-pointer"
          >
            &times;
          </button>
        </div>
      )}

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
            type="button"
            onClick={() => setShowConfirmModal(true)}
            className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
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

      {/* In-App Stocktake Audit Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-left">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
                <CheckCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Apply Stocktake Audit</h3>
                <p className="text-xs text-slate-500">Physical Stock Count Reconciliation</p>
              </div>
            </div>

            <div className="p-3.5 bg-teal-50/70 rounded-xl border border-teal-200/80 text-xs text-teal-900 space-y-2">
              <p className="font-semibold text-teal-950">
                Are you sure you want to apply these physical inventory counts to live system quantities?
              </p>
              <p className="text-[11px] text-teal-800 leading-relaxed">
                Stock counts will be updated to match the physical audit values, and inventory variance audit logs will be preserved in activity history.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyStocktake}
                className="flex-1 py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-extrabold shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                Apply Adjustments
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
