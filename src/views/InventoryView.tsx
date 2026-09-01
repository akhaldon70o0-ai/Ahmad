import React, { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { formatMoney } from '../utils/audio';
import { InventoryItem } from '../types';
import { Package, Search, Plus, Edit, Trash2, AlertCircle, Boxes, Tag } from 'lucide-react';

interface InventoryViewProps {
  onNavigateToBundles?: (initialItemName?: string) => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({ onNavigateToBundles }) => {
  const { inventory, sales, settings, addInventoryItem, updateInventoryItem, deleteInventoryItem, currentUser } = useStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [barcode, setBarcode] = useState('');
  const [category, setCategory] = useState('');
  const [qty, setQty] = useState<number>(0);
  const [cost, setCost] = useState<number>(0);
  const [price, setPrice] = useState<number>(0);
  const [threshold, setThreshold] = useState<number>(5);

  const isCashier = currentUser.role === 'cashier';

  const resetForm = () => {
    setName('');
    setBarcode('');
    setCategory('');
    setQty(0);
    setCost(0);
    setPrice(0);
    setThreshold(5);
    setEditingItem(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingItem) {
      updateInventoryItem(editingItem.id, {
        name: name.trim(),
        barcode: barcode.trim(),
        category: category.trim(),
        qty: Number(qty) || 0,
        cost: Number(cost) || 0,
        price: Number(price) || 0,
        threshold: Number(threshold) || 0,
      });
    } else {
      addInventoryItem({
        name: name.trim(),
        barcode: barcode.trim(),
        category: category.trim(),
        qty: Number(qty) || 0,
        cost: Number(cost) || 0,
        price: Number(price) || 0,
        threshold: Number(threshold) || 0,
      });
    }

    resetForm();
  };

  const startEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setName(item.name);
    setBarcode(item.barcode || '');
    setCategory(item.category || '');
    setQty(item.qty);
    setCost(item.cost);
    setPrice(item.price);
    setThreshold(item.threshold);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Filtered Products
  const filteredItems = useMemo(() => {
    if (!searchTerm) return inventory;
    const term = searchTerm.toLowerCase();
    return inventory.filter(
      (i) =>
        i.name.toLowerCase().includes(term) ||
        (i.barcode && i.barcode.toLowerCase().includes(term)) ||
        (i.category && i.category.toLowerCase().includes(term))
    );
  }, [inventory, searchTerm]);

  // Stagnant Stock Analysis (>45 days without sales)
  const deadStock = useMemo(() => {
    const now = new Date().getTime();
    const thresholdMs = 45 * 24 * 60 * 60 * 1000;

    return inventory.filter((inv) => {
      if (inv.qty <= 0) return false;
      const matchedSales = sales.filter((s) =>
        s.items.some(
          (it) => it.itemId === inv.id || (it.itemName && it.itemName.toLowerCase() === inv.name.toLowerCase())
        )
      );
      if (!matchedSales.length) return true;
      const latestDateStr = matchedSales.sort((a, b) => b.date.localeCompare(a.date))[0].date;
      const latestTime = new Date(latestDateStr).getTime();
      return now - latestTime > thresholdMs;
    });
  }, [inventory, sales]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Product Add / Edit Form Panel */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
        <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2 mb-4">
          <Package className="w-5 h-5 text-teal-600" />
          {editingItem ? `Edit Product: ${editingItem.name}` : 'Add New Product to Inventory'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="lg:col-span-2">
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Product Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Arabica Coffee Beans (500g)"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium focus:outline-none focus:border-teal-600"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Barcode / SKU</label>
              <input
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="e.g. 629100100201"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:outline-none focus:border-teal-600"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Category</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Beverages, Food"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium focus:outline-none focus:border-teal-600"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Initial Stock Qty *</label>
              <input
                type="number"
                min="0"
                step="1"
                required
                value={qty}
                onChange={(e) => setQty(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold focus:outline-none focus:border-teal-600"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Cost Price *</label>
              <input
                type="number"
                min="0"
                step="any"
                required
                value={cost || ''}
                onChange={(e) => setCost(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:outline-none focus:border-teal-600"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Selling Price *</label>
              <input
                type="number"
                min="0"
                step="any"
                required
                value={price || ''}
                onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold focus:outline-none focus:border-teal-600"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Low Stock Threshold</label>
              <input
                type="number"
                min="0"
                step="1"
                value={threshold}
                onChange={(e) => setThreshold(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:outline-none focus:border-teal-600"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="submit"
              className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              {editingItem ? 'Save Changes' : 'Add Product'}
            </button>
            {editingItem && (
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Inventory List Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-teal-600" />
            <h3 className="font-bold text-sm text-slate-900">Current Goods on Hand ({inventory.length})</h3>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search product name, barcode, category…"
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-teal-600"
            />
          </div>
        </div>

        {filteredItems.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">No goods match your search criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Product Name</th>
                  <th className="px-4 py-3">Barcode</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3 text-center">Stock</th>
                  {!isCashier && <th className="px-4 py-3 text-right">Cost</th>}
                  <th className="px-4 py-3 text-right">Price</th>
                  {!isCashier && <th className="px-4 py-3 text-right">Unit Margin</th>}
                  {!isCashier && <th className="px-4 py-3 text-right">Total Asset Value</th>}
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map((item) => {
                  const isLow = Number(item.qty) <= Number(item.threshold);
                  const unitMargin = item.price - item.cost;
                  const totalAsset = item.qty * item.cost;

                  return (
                    <tr key={item.id} className={`hover:bg-slate-50/70 ${isLow ? 'bg-rose-50/20' : ''}`}>
                      <td className="px-4 py-3 font-semibold text-slate-900 flex items-center gap-2">
                        {item.name}
                        {isLow && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 uppercase tracking-wider">
                            Low Stock
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-600">
                        {item.barcode ? (
                          <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-[11px]">
                            {item.barcode}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{item.category || '—'}</td>
                      <td className="px-4 py-3 text-center font-mono font-extrabold text-slate-900">{item.qty}</td>
                      {!isCashier && (
                        <td className="px-4 py-3 text-right font-mono text-slate-600">
                          {formatMoney(item.cost, settings.currency)}
                        </td>
                      )}
                      <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                        {formatMoney(item.price, settings.currency)}
                      </td>
                      {!isCashier && (
                        <td
                          className={`px-4 py-3 text-right font-mono font-bold ${
                            unitMargin >= 0 ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {formatMoney(unitMargin, settings.currency)}
                        </td>
                      )}
                      {!isCashier && (
                        <td className="px-4 py-3 text-right font-mono font-semibold text-slate-700">
                          {formatMoney(totalAsset, settings.currency)}
                        </td>
                      )}
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => startEdit(item)}
                            className="p-1.5 text-teal-600 hover:bg-teal-50 rounded-lg"
                            title="Edit Product"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setItemToDelete(item)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                            title="Delete Product"
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
          </div>
        )}
      </div>

      {/* In-App Delete Product Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-left">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Product</h3>
                <p className="text-xs text-slate-500 font-mono">#{itemToDelete.id}</p>
              </div>
            </div>

            <div className="p-3.5 bg-rose-50/70 rounded-xl border border-rose-200/80 text-xs text-rose-900 space-y-2">
              <p className="font-semibold text-rose-800">
                Are you sure you want to remove <b className="text-rose-950 font-bold">"{itemToDelete.name}"</b> from inventory?
              </p>
              <div className="bg-white p-2.5 rounded-lg border border-rose-200 space-y-1 font-mono text-[11px] text-slate-700">
                <div>Current Stock: <b>{itemToDelete.qty}</b></div>
                <div>Selling Price: <b>{formatMoney(itemToDelete.price, settings.currency)}</b></div>
                {itemToDelete.barcode && <div>Barcode: {itemToDelete.barcode}</div>}
              </div>
              <p className="text-[11px] text-rose-700 leading-relaxed">
                This item will be removed from your catalog. Past sales records will retain their product names.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteInventoryItem(itemToDelete.id);
                  setItemToDelete(null);
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Product
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stagnant Stock Analysis Panel (>45 days without sales) */}
      <div className="bg-white rounded-xl border border-amber-200 overflow-hidden shadow-xs">
        <div className="p-4 bg-amber-50/50 border-b border-amber-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            <h3 className="font-bold text-sm text-slate-900">
              Stagnant Stock Analysis <span className="text-xs text-slate-500 font-normal">(No sales for &gt;45 days)</span>
            </h3>
          </div>
          <span className="text-xs font-bold text-amber-800">{deadStock.length} items flagged</span>
        </div>

        {deadStock.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500">
            Great news! No stagnant stock detected in the last 45 days.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500">
                <tr>
                  <th className="px-4 py-2.5">Stagnant Product</th>
                  <th className="px-4 py-2.5 text-center">Stock on Hand</th>
                  <th className="px-4 py-2.5 text-right">Tied-Up Capital</th>
                  <th className="px-4 py-2.5 text-center">Recommended Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {deadStock.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5 font-medium text-slate-900">{item.name}</td>
                    <td className="px-4 py-2.5 text-center font-mono font-bold">{item.qty}</td>
                    <td className="px-4 py-2.5 text-right font-mono font-bold text-rose-600">
                      {formatMoney(item.qty * item.cost, settings.currency)}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <button
                        onClick={() => {
                          if (onNavigateToBundles) onNavigateToBundles(item.name);
                        }}
                        className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 rounded-lg text-xs font-bold flex items-center gap-1 mx-auto"
                      >
                        <Boxes className="w-3.5 h-3.5" />
                        Create Promo Bundle
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
