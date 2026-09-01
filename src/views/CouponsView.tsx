import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { formatMoney, getTodayDateString } from '../utils/audio';
import { PromoCoupon } from '../types';
import { Ticket, Plus, Edit, Trash2 } from 'lucide-react';

export const CouponsView: React.FC = () => {
  const { coupons, settings, saveCoupon, deleteCoupon } = useStore();

  const [code, setCode] = useState('');
  const [type, setType] = useState<'percent' | 'fixed'>('percent');
  const [value, setValue] = useState<number>(10);
  const [limit, setLimit] = useState<string>('');
  const [expiry, setExpiry] = useState<string>('');
  const [active, setActive] = useState<boolean>(true);
  const [editingCoupon, setEditingCoupon] = useState<PromoCoupon | null>(null);
  const [couponToDelete, setCouponToDelete] = useState<PromoCoupon | null>(null);
  const [formError, setFormError] = useState<string>('');

  const resetForm = () => {
    setCode('');
    setType('percent');
    setValue(10);
    setLimit('');
    setExpiry('');
    setActive(true);
    setEditingCoupon(null);
    setFormError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode || value <= 0) {
      setFormError('Please enter a valid coupon code and discount value.');
      return;
    }

    saveCoupon(
      {
        code: cleanCode,
        type,
        value: Number(value),
        limit: limit ? parseInt(limit) : null,
        expiry: expiry || null,
        active,
      },
      editingCoupon?.id
    );

    resetForm();
  };

  const startEdit = (c: PromoCoupon) => {
    setEditingCoupon(c);
    setCode(c.code);
    setType(c.type);
    setValue(c.value);
    setLimit(c.limit ? String(c.limit) : '');
    setExpiry(c.expiry || '');
    setActive(c.active);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Coupon Generator Form */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
        <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2 mb-4">
          <Ticket className="w-5 h-5 text-teal-600" />
          {editingCoupon ? `Edit Promo Code: ${editingCoupon.code}` : 'Create Promo Code / Coupon'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center justify-between animate-in fade-in">
              <span>{formError}</span>
              <button type="button" onClick={() => setFormError('')} className="text-rose-500 hover:text-rose-700 font-bold ml-2 cursor-pointer">&times;</button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            <div className="lg:col-span-2">
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Coupon Code *</label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. SUMMER25"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold focus:outline-none focus:border-teal-600 uppercase"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Discount Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as 'percent' | 'fixed')}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium focus:outline-none focus:border-teal-600"
              >
                <option value="percent">Percentage (%)</option>
                <option value="fixed">Fixed Amount ({settings.currency})</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Discount Value *</label>
              <input
                type="number"
                min="0"
                step="any"
                required
                value={value}
                onChange={(e) => setValue(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold focus:outline-none focus:border-teal-600"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Usage Limit (Optional)</label>
              <input
                type="number"
                min="1"
                step="1"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                placeholder="e.g. 50"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:outline-none focus:border-teal-600"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Expiry Date</label>
              <input
                type="date"
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium focus:outline-none focus:border-teal-600"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 pt-2">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
              />
              <span>Active and ready to use in POS</span>
            </label>

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="submit"
                className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                {editingCoupon ? 'Save Changes' : 'Save Coupon'}
              </button>
              {editingCoupon && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* Configured Coupons Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <h3 className="font-bold text-sm text-slate-900">Active &amp; Configured Promo Codes ({coupons.length})</h3>
        </div>

        {coupons.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">No promo coupons configured yet.</div>
        ) : (
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Discount</th>
                <th className="px-4 py-3 text-center">Usage Count</th>
                <th className="px-4 py-3">Expiry Date</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {coupons.map((c) => {
                const isExpired = c.expiry && c.expiry < getTodayDateString();
                const isExhausted = c.limit && c.usedCount >= c.limit;
                const statusLabel = !c.active ? 'Disabled' : isExpired ? 'Expired' : isExhausted ? 'Exhausted' : 'Active';
                const statusClass =
                  statusLabel === 'Active'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800';

                return (
                  <tr key={c.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-mono font-extrabold text-slate-900">{c.code}</td>
                    <td className="px-4 py-3 font-bold text-teal-700">
                      {c.type === 'percent' ? `${c.value}%` : formatMoney(c.value, settings.currency)}
                    </td>
                    <td className="px-4 py-3 text-center font-mono">
                      {c.limit ? `${c.usedCount} / ${c.limit}` : `${c.usedCount} (Unlimited)`}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{c.expiry || 'No Expiry'}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusClass}`}>
                        {statusLabel}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => startEdit(c)}
                          className="p-1.5 text-teal-600 hover:bg-teal-50 rounded-lg"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setCouponToDelete(c)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                          title="Delete Coupon"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* In-App Delete Coupon Confirmation Modal */}
      {couponToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-left">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Coupon Code</h3>
                <p className="text-xs text-slate-500 font-mono">#{couponToDelete.id}</p>
              </div>
            </div>

            <div className="p-3.5 bg-rose-50/70 rounded-xl border border-rose-200/80 text-xs text-rose-900 space-y-2">
              <p className="font-semibold text-rose-800">
                Are you sure you want to delete promo code <b className="text-rose-950 font-bold font-mono">"{couponToDelete.code}"</b>?
              </p>
              <div className="bg-white p-2.5 rounded-lg border border-rose-200 space-y-1 font-mono text-[11px] text-slate-700">
                <div>Discount: {couponToDelete.type === 'percent' ? `${couponToDelete.value}%` : formatMoney(couponToDelete.value, settings.currency)}</div>
                <div>Used Count: {couponToDelete.usedCount}</div>
                {couponToDelete.expiry && <div>Expiry: {couponToDelete.expiry}</div>}
              </div>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => setCouponToDelete(null)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteCoupon(couponToDelete.id);
                  setCouponToDelete(null);
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Coupon
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
