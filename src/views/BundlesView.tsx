import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { formatMoney } from '../utils/audio';
import { ProductBundle, BundleItemDef } from '../types';
import { Boxes, Plus, Trash2, Edit } from 'lucide-react';

interface BundlesViewProps {
  initialItemName?: string;
}

export const BundlesView: React.FC<BundlesViewProps> = ({ initialItemName }) => {
  const { bundles, inventory, settings, saveBundle, deleteBundle, currentUser } = useStore();

  const [bundleName, setBundleName] = useState(initialItemName ? `Promo Pack - ${initialItemName}` : '');
  const [bundlePrice, setBundlePrice] = useState<string>('');
  const [currentItems, setCurrentItems] = useState<BundleItemDef[]>(
    initialItemName ? [{ id: null, name: initialItemName, qty: 1 }] : []
  );
  const [pickerItem, setPickerItem] = useState(initialItemName || '');
  const [pickerQty, setPickerQty] = useState<number>(1);
  const [editingBundle, setEditingBundle] = useState<ProductBundle | null>(null);
  const [bundleToDelete, setBundleToDelete] = useState<ProductBundle | null>(null);
  const [formError, setFormError] = useState<string>('');

  const isCashier = currentUser.role === 'cashier';

  const resetForm = () => {
    setBundleName('');
    setBundlePrice('');
    setCurrentItems([]);
    setPickerItem('');
    setPickerQty(1);
    setEditingBundle(null);
    setFormError('');
  };

  const handleAddItemToBundle = () => {
    setFormError('');
    const clean = pickerItem.trim();
    if (!clean) {
      setFormError('Please select or type a product to add to the bundle.');
      return;
    }

    const match = inventory.find((i) => i.name.toLowerCase() === clean.toLowerCase());
    const qty = Math.max(1, pickerQty);

    const existingIdx = currentItems.findIndex((x) => x.name.toLowerCase() === clean.toLowerCase());
    if (existingIdx >= 0) {
      setCurrentItems((prev) =>
        prev.map((it, idx) => (idx === existingIdx ? { ...it, qty: it.qty + qty } : it))
      );
    } else {
      setCurrentItems((prev) => [
        ...prev,
        {
          id: match ? match.id : null,
          name: match ? match.name : clean,
          qty,
        },
      ]);
    }

    setPickerItem('');
    setPickerQty(1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    const priceNum = parseFloat(bundlePrice);
    if (!bundleName.trim() || isNaN(priceNum) || currentItems.length === 0) {
      setFormError('Please enter bundle name, selling price, and at least one included product.');
      return;
    }

    saveBundle(
      {
        name: bundleName.trim(),
        price: priceNum,
        items: [...currentItems],
      },
      editingBundle?.id
    );

    resetForm();
  };

  const startEdit = (b: ProductBundle) => {
    setEditingBundle(b);
    setBundleName(b.name);
    setBundlePrice(String(b.price));
    setCurrentItems(b.items.map((i) => ({ ...i })));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Bundle Builder Form */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
        <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2 mb-4">
          <Boxes className="w-5 h-5 text-teal-600" />
          {editingBundle ? `Edit Bundle: ${editingBundle.name}` : 'Create / Edit Product Bundle'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center justify-between animate-in fade-in">
              <span>{formError}</span>
              <button type="button" onClick={() => setFormError('')} className="text-rose-500 hover:text-rose-700 font-bold ml-2 cursor-pointer">&times;</button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Bundle Name *</label>
              <input
                type="text"
                required
                value={bundleName}
                onChange={(e) => setBundleName(e.target.value)}
                placeholder="e.g. Barista Deluxe Combo Set"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium focus:outline-none focus:border-teal-600"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Package Selling Price *</label>
              <input
                type="number"
                min="0"
                step="any"
                required
                value={bundlePrice}
                onChange={(e) => setBundlePrice(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold focus:outline-none focus:border-teal-600"
              />
            </div>
          </div>

          {/* Add Item to Bundle Row */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Select Included Product</label>
              <input
                type="text"
                list="bundle-inv-list"
                value={pickerItem}
                onChange={(e) => setPickerItem(e.target.value)}
                placeholder="Pick existing goods..."
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-teal-600"
              />
              <datalist id="bundle-inv-list">
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
                value={pickerQty}
                onChange={(e) => setPickerQty(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold focus:outline-none focus:border-teal-600"
              />
            </div>

            <div>
              <button
                type="button"
                onClick={handleAddItemToBundle}
                className="w-full py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition-colors"
              >
                + Add to Bundle
              </button>
            </div>
          </div>

          {/* Included Items List */}
          {currentItems.length > 0 && (
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Included Product</th>
                    <th className="px-3 py-2 text-center">Qty</th>
                    <th className="px-3 py-2 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentItems.map((item, idx) => (
                    <tr key={idx}>
                      <td className="px-3 py-2 font-medium">{item.name}</td>
                      <td className="px-3 py-2 text-center font-mono font-bold">{item.qty}</td>
                      <td className="px-3 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => setCurrentItems((prev) => prev.filter((_, i) => i !== idx))}
                          className="text-rose-600 hover:text-rose-800"
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

          <div className="flex items-center gap-2 pt-2">
            <button
              type="submit"
              className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              {editingBundle ? 'Save Changes' : 'Save Bundle'}
            </button>
            {editingBundle && (
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Configured Bundles Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <h3 className="font-bold text-sm text-slate-900">Configured Product Bundles ({bundles.length})</h3>
        </div>

        {bundles.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">No product bundles configured yet.</div>
        ) : (
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              <tr>
                <th className="px-4 py-3">Bundle Name</th>
                <th className="px-4 py-3">Included Products</th>
                <th className="px-4 py-3 text-right">Package Price</th>
                {!isCashier && <th className="px-4 py-3 text-right">Total Cost</th>}
                {!isCashier && <th className="px-4 py-3 text-right">Est. Margin</th>}
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bundles.map((b) => {
                const totalCost = b.items.reduce((sum, bi) => {
                  const it = inventory.find((i) => i.name.toLowerCase() === bi.name.toLowerCase());
                  return sum + (it ? Number(it.cost || 0) * Number(bi.qty || 1) : 0);
                }, 0);
                const margin = b.price - totalCost;

                return (
                  <tr key={b.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-bold text-slate-900">{b.name}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {b.items.map((i) => `${i.name} ×${i.qty}`).join(', ')}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-extrabold text-slate-900">
                      {formatMoney(b.price, settings.currency)}
                    </td>
                    {!isCashier && (
                      <td className="px-4 py-3 text-right font-mono text-slate-500">
                        {formatMoney(totalCost, settings.currency)}
                      </td>
                    )}
                    {!isCashier && (
                      <td
                        className={`px-4 py-3 text-right font-mono font-bold ${
                          margin >= 0 ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {formatMoney(margin, settings.currency)}
                      </td>
                    )}
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => startEdit(b)}
                          className="p-1.5 text-teal-600 hover:bg-teal-50 rounded-lg"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setBundleToDelete(b)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                          title="Delete Bundle"
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

      {/* In-App Delete Bundle Confirmation Modal */}
      {bundleToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-left">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Bundle Combo</h3>
                <p className="text-xs text-slate-500 font-mono">#{bundleToDelete.id}</p>
              </div>
            </div>

            <div className="p-3.5 bg-rose-50/70 rounded-xl border border-rose-200/80 text-xs text-rose-900 space-y-2">
              <p className="font-semibold text-rose-800">
                Are you sure you want to delete bundle <b className="text-rose-950 font-bold">"{bundleToDelete.name}"</b>?
              </p>
              <div className="bg-white p-2.5 rounded-lg border border-rose-200 space-y-1 font-mono text-[11px] text-slate-700">
                <div>Price: <b>{formatMoney(bundleToDelete.price, settings.currency)}</b></div>
                <div>Items: {bundleToDelete.items.map((it) => `${it.name} ×${it.qty}`).join(', ')}</div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => setBundleToDelete(null)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteBundle(bundleToDelete.id);
                  setBundleToDelete(null);
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Bundle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
