import React, { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { formatMoney } from '../utils/audio';
import { SupplierRecord } from '../types';
import { Building2, Search, Plus, Edit, Trash2 } from 'lucide-react';

export const SuppliersView: React.FC = () => {
  const { suppliers, purchases, settings, addSupplier, updateSupplier, deleteSupplier } = useStore();

  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [address, setAddress] = useState('');
  const [editingSupplier, setEditingSupplier] = useState<SupplierRecord | null>(null);
  const [selectedLedgerId, setSelectedLedgerId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const resetForm = () => {
    setName('');
    setMobile('');
    setAddress('');
    setEditingSupplier(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingSupplier) {
      updateSupplier(editingSupplier.id, {
        name: name.trim(),
        mobile: mobile.trim(),
        address: address.trim(),
      });
    } else {
      addSupplier({
        name: name.trim(),
        mobile: mobile.trim(),
        address: address.trim(),
      });
    }
    resetForm();
  };

  const startEdit = (s: SupplierRecord) => {
    setEditingSupplier(s);
    setName(s.name);
    setMobile(s.mobile || '');
    setAddress(s.address || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filteredSuppliers = useMemo(() => {
    if (!searchTerm) return suppliers;
    const term = searchTerm.toLowerCase();
    return suppliers.filter(
      (s) =>
        s.name.toLowerCase().includes(term) ||
        (s.mobile && s.mobile.includes(term)) ||
        (s.address && s.address.toLowerCase().includes(term))
    );
  }, [suppliers, searchTerm]);

  const selectedSupplier = useMemo(() => {
    if (!selectedLedgerId) return null;
    return suppliers.find((s) => s.id === selectedLedgerId) || null;
  }, [suppliers, selectedLedgerId]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Supplier Form */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
        <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2 mb-4">
          <Building2 className="w-5 h-5 text-teal-600" />
          {editingSupplier ? `Edit Supplier: ${editingSupplier.name}` : 'Add Supplier / Vendor'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Supplier Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Origin Coffee Importers"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium focus:outline-none focus:border-teal-600"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Phone Number</label>
              <input
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="0798123456"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:outline-none focus:border-teal-600"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Address / City</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="City, Commercial Port"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-teal-600"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="submit"
              className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              {editingSupplier ? 'Save Changes' : 'Add Supplier'}
            </button>
            {editingSupplier && (
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

      {/* Supplier Directory Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900">Suppliers &amp; Vendors Directory ({suppliers.length})</h3>
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search supplier, phone, city…"
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-teal-600"
            />
          </div>
        </div>

        {filteredSuppliers.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">No suppliers registered yet.</div>
        ) : (
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              <tr>
                <th className="px-4 py-3">Supplier Name</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Address</th>
                <th className="px-4 py-3 text-right">Total Purchases</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSuppliers.map((s) => {
                const vendorPurchases = purchases.filter(
                  (p) => p.supplier && p.supplier.toLowerCase() === s.name.toLowerCase()
                );
                const totalPurchasesVal = vendorPurchases.reduce((sum, p) => sum + Number(p.total || 0), 0);

                return (
                  <tr key={s.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-bold text-slate-900">{s.name}</td>
                    <td className="px-4 py-3 font-mono text-slate-600">{s.mobile || '—'}</td>
                    <td className="px-4 py-3 text-slate-500">{s.address || '—'}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                      {formatMoney(totalPurchasesVal, settings.currency)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setSelectedLedgerId(s.id)}
                          className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-700 font-bold rounded-lg text-xs"
                        >
                          View Ledger
                        </button>
                        <button
                          onClick={() => startEdit(s)}
                          className="p-1 text-slate-600 hover:bg-slate-100 rounded-lg"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Delete supplier "${s.name}"?`)) {
                              deleteSupplier(s.id);
                            }
                          }}
                          className="p-1 text-rose-600 hover:bg-rose-50 rounded-lg"
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

      {/* Selected Supplier Ledger Modal / Panel */}
      {selectedSupplier && (
        <div className="bg-white rounded-xl border border-teal-300 shadow-lg p-5 space-y-3 animate-in fade-in duration-150">
          <div className="flex justify-between items-center pb-2 border-b border-slate-200">
            <div>
              <h4 className="text-sm font-extrabold text-slate-900">Supplier Ledger: {selectedSupplier.name}</h4>
              <p className="text-xs text-slate-500">{selectedSupplier.mobile} · {selectedSupplier.address}</p>
            </div>
            <button
              onClick={() => setSelectedLedgerId(null)}
              className="px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-semibold"
            >
              Close
            </button>
          </div>

          {(() => {
            const vendorPurchases = purchases.filter(
              (p) => p.supplier && p.supplier.toLowerCase() === selectedSupplier.name.toLowerCase()
            );

            if (vendorPurchases.length === 0) {
              return <div className="p-6 text-center text-xs text-slate-400">No purchases recorded for this supplier.</div>;
            }

            return (
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Date</th>
                    <th className="px-3 py-2">Product Item</th>
                    <th className="px-3 py-2 text-center">Qty</th>
                    <th className="px-3 py-2 text-right">Unit Cost</th>
                    <th className="px-3 py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {vendorPurchases.map((p) => (
                    <tr key={p.id}>
                      <td className="px-3 py-2 text-slate-600">{p.date}</td>
                      <td className="px-3 py-2 font-bold">{p.itemName}</td>
                      <td className="px-3 py-2 text-center font-mono">{p.qty}</td>
                      <td className="px-3 py-2 text-right font-mono">{formatMoney(p.cost, settings.currency)}</td>
                      <td className="px-3 py-2 text-right font-mono font-extrabold text-slate-900">
                        {formatMoney(p.total, settings.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            );
          })()}
        </div>
      )}
    </div>
  );
};
