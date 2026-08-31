import React, { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { formatMoney, getTodayDateString } from '../utils/audio';
import { CustomerRecord } from '../types';
import { Users, Search, Plus, Edit, Trash2, CreditCard, DollarSign, Calendar } from 'lucide-react';

export const CustomersCrmView: React.FC = () => {
  const {
    customers,
    sales,
    customerPayments,
    settings,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    recordCustomerPayment,
  } = useStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [segmentFilter, setSegmentFilter] = useState('');
  const [editingCustomer, setEditingCustomer] = useState<CustomerRecord | null>(null);
  const [selectedLedgerCustomerId, setSelectedLedgerCustomerId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  // Payment Form State
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState(getTodayDateString());
  const [paymentNote, setPaymentNote] = useState('');

  const resetForm = () => {
    setName('');
    setMobile('');
    setAddress('');
    setNotes('');
    setEditingCustomer(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !mobile.trim()) return;

    if (editingCustomer) {
      updateCustomer(editingCustomer.id, {
        name: name.trim(),
        mobile: mobile.trim(),
        address: address.trim(),
        notes: notes.trim(),
      });
    } else {
      addCustomer({
        name: name.trim(),
        mobile: mobile.trim(),
        address: address.trim(),
        notes: notes.trim(),
      });
    }
    resetForm();
  };

  const startEdit = (c: CustomerRecord) => {
    setEditingCustomer(c);
    setName(c.name);
    setMobile(c.mobile);
    setAddress(c.address || '');
    setNotes(c.notes || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Helper stats for a customer
  const getCustomerStats = (c: CustomerRecord) => {
    const cName = c.name.trim().toLowerCase();
    const custSales = sales.filter((s) => s.customer && s.customer.trim().toLowerCase() === cName);
    const totalPurchased = custSales.reduce((sum, s) => sum + Number(s.total || 0), 0);
    const invoicePaid = custSales.reduce(
      (sum, s) => sum + Math.min(Number(s.total || 0), Number(s.paidAmount || 0)),
      0
    );
    const manualPayments = customerPayments
      .filter((p) => p.customerId === c.id)
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const totalPaid = invoicePaid + manualPayments;
    const debt = Math.max(0, totalPurchased - totalPaid);

    // Segment classification
    let segment = 'New';
    let segmentLabel = '🔵 New';
    let segmentClass = 'bg-blue-100 text-blue-800';

    if (custSales.length >= 3 || totalPurchased >= 200) {
      segment = 'VIP';
      segmentLabel = '⭐ VIP';
      segmentClass = 'bg-emerald-100 text-emerald-800';
    } else if (custSales.length > 0) {
      const latestDate = custSales.sort((a, b) => b.date.localeCompare(a.date))[0].date;
      const daysDiff = (new Date().getTime() - new Date(latestDate).getTime()) / (1000 * 60 * 60 * 24);
      if (daysDiff > 45) {
        segment = 'Inactive';
        segmentLabel = '🔴 Inactive (>45d)';
        segmentClass = 'bg-rose-100 text-rose-800';
      } else {
        segment = 'Active';
        segmentLabel = '🟢 Active';
        segmentClass = 'bg-teal-100 text-teal-800';
      }
    }

    return {
      custSales,
      totalPurchased,
      totalPaid,
      debt,
      segment,
      segmentLabel,
      segmentClass,
    };
  };

  // Filtered customers
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const stats = getCustomerStats(c);
      if (segmentFilter && stats.segment !== segmentFilter) return false;
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        c.name.toLowerCase().includes(term) ||
        c.mobile.includes(term) ||
        (c.address && c.address.toLowerCase().includes(term))
      );
    });
  }, [customers, sales, customerPayments, segmentFilter, searchTerm]);

  // Selected Ledger Customer
  const selectedLedgerCustomer = useMemo(() => {
    if (!selectedLedgerCustomerId) return null;
    return customers.find((c) => c.id === selectedLedgerCustomerId) || null;
  }, [customers, selectedLedgerCustomerId]);

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLedgerCustomerId) return;
    const amt = parseFloat(paymentAmount);
    if (isNaN(amt) || amt <= 0) return alert('Enter a valid payment amount.');

    recordCustomerPayment(selectedLedgerCustomerId, amt, paymentDate, paymentNote);
    setPaymentAmount('');
    setPaymentNote('');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Customer Form */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
        <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-teal-600" />
          {editingCustomer ? `Edit Customer: ${editingCustomer.name}` : 'Add New Customer'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Customer Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Johnathan Doe"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium focus:outline-none focus:border-teal-600"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Mobile / Phone *</label>
              <input
                type="tel"
                required
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="0791234567"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:outline-none focus:border-teal-600"
              />
            </div>

            <div className="lg:col-span-2">
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Delivery Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="City, neighborhood, street address"
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
              {editingCustomer ? 'Save Changes' : 'Add Customer'}
            </button>
            {editingCustomer && (
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

      {/* Customer Directory Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-teal-600" />
            <h3 className="font-bold text-sm text-slate-900">Customer Directory ({customers.length})</h3>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            <select
              value={segmentFilter}
              onChange={(e) => setSegmentFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none"
            >
              <option value="">All Segments</option>
              <option value="VIP">⭐ VIP</option>
              <option value="Active">🟢 Active</option>
              <option value="Inactive">🔴 Inactive (&gt;45d)</option>
              <option value="New">🔵 New</option>
            </select>

            <div className="relative flex-1 md:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search name, phone, address…"
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-teal-600"
              />
            </div>
          </div>
        </div>

        {filteredCustomers.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">No customers match your search criteria.</div>
        ) : (
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              <tr>
                <th className="px-4 py-3">Customer Name</th>
                <th className="px-4 py-3">Segment</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Address</th>
                <th className="px-4 py-3 text-right">Total Purchased</th>
                <th className="px-4 py-3 text-right">Balance Due</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.map((c) => {
                const stats = getCustomerStats(c);
                return (
                  <tr key={c.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-bold text-slate-900">{c.name}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${stats.segmentClass}`}>
                        {stats.segmentLabel}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600">{c.mobile}</td>
                    <td className="px-4 py-3 text-slate-500 truncate max-w-xs">{c.address || '—'}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                      {formatMoney(stats.totalPurchased, settings.currency)}
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-mono font-bold ${
                        stats.debt > 0 ? 'text-rose-600' : 'text-emerald-600'
                      }`}
                    >
                      {formatMoney(stats.debt, settings.currency)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setSelectedLedgerCustomerId(c.id)}
                          className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-700 font-bold rounded-lg text-xs"
                        >
                          View Ledger
                        </button>
                        <button
                          onClick={() => startEdit(c)}
                          className="p-1 text-slate-600 hover:bg-slate-100 rounded-lg"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Delete customer "${c.name}"? Past invoices will remain saved.`)) {
                              deleteCustomer(c.id);
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

      {/* Customer Ledger Drawer Panel */}
      {selectedLedgerCustomer && (
        <div className="bg-white rounded-xl border border-teal-300 shadow-lg overflow-hidden animate-in fade-in duration-150">
          {(() => {
            const stats = getCustomerStats(selectedLedgerCustomer);
            const manualPayments = customerPayments.filter((p) => p.customerId === selectedLedgerCustomer.id);

            return (
              <div>
                <div className="p-4 bg-teal-800 text-white flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <CreditCard className="w-5 h-5 text-teal-300" />
                    <div>
                      <h3 className="font-extrabold text-sm text-white">
                        Customer Ledger: {selectedLedgerCustomer.name}
                      </h3>
                      <p className="text-[11px] text-teal-200">
                        {selectedLedgerCustomer.mobile} · {selectedLedgerCustomer.address || 'No address'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedLedgerCustomerId(null)}
                    className="text-teal-200 hover:text-white px-3 py-1 bg-teal-900/60 rounded-lg text-xs font-bold"
                  >
                    Close Ledger
                  </button>
                </div>

                {/* Ledger Metrics */}
                <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 border-b border-slate-200">
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Total Invoiced</div>
                    <div className="font-mono text-base font-bold text-slate-900 mt-0.5">
                      {formatMoney(stats.totalPurchased, settings.currency)}
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Total Settled / Paid</div>
                    <div className="font-mono text-base font-bold text-emerald-600 mt-0.5">
                      {formatMoney(stats.totalPaid, settings.currency)}
                    </div>
                  </div>
                  <div
                    className={`p-3 rounded-lg border ${
                      stats.debt > 0 ? 'bg-rose-50 border-rose-200' : 'bg-emerald-50 border-emerald-200'
                    }`}
                  >
                    <div className="text-[10px] uppercase font-bold text-slate-400">Outstanding Balance</div>
                    <div
                      className={`font-mono text-base font-extrabold mt-0.5 ${
                        stats.debt > 0 ? 'text-rose-600' : 'text-emerald-600'
                      }`}
                    >
                      {formatMoney(stats.debt, settings.currency)}
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Invoices Count</div>
                    <div className="font-mono text-base font-bold text-slate-900 mt-0.5">{stats.custSales.length}</div>
                  </div>
                </div>

                {/* Record Settle Payment Form */}
                <div className="p-4 border-b border-slate-200 bg-white">
                  <h4 className="text-xs font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-teal-600" />
                    Record Debt Payment / Receipt
                  </h4>
                  <form onSubmit={handleRecordPayment} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Amount *</label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        required
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono font-bold focus:outline-none focus:border-teal-600"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Payment Date</label>
                      <input
                        type="date"
                        required
                        value={paymentDate}
                        onChange={(e) => setPaymentDate(e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-teal-600"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Notes / Ref</label>
                      <input
                        type="text"
                        value={paymentNote}
                        onChange={(e) => setPaymentNote(e.target.value)}
                        placeholder="e.g. Bank transfer, cash settlement"
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-teal-600"
                      />
                    </div>
                    <div>
                      <button
                        type="submit"
                        className="w-full py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
                      >
                        Record Payment
                      </button>
                    </div>
                  </form>
                </div>

                {/* Invoices List */}
                <div className="p-4">
                  <h4 className="text-xs font-bold text-slate-900 mb-2">Purchase &amp; Invoice History</h4>
                  {stats.custSales.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">No purchases recorded for this customer yet.</div>
                  ) : (
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500">
                        <tr>
                          <th className="px-3 py-2">Date</th>
                          <th className="px-3 py-2">Invoice Ref</th>
                          <th className="px-3 py-2 text-right">Total</th>
                          <th className="px-3 py-2 text-right">Paid</th>
                          <th className="px-3 py-2 text-right">Balance</th>
                          <th className="px-3 py-2">Items</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {stats.custSales.map((s) => (
                          <tr key={s.id}>
                            <td className="px-3 py-2 text-slate-600">{s.date}</td>
                            <td className="px-3 py-2 font-mono">#{s.id}</td>
                            <td className="px-3 py-2 text-right font-mono font-bold">
                              {formatMoney(s.total, settings.currency)}
                            </td>
                            <td className="px-3 py-2 text-right font-mono text-slate-600">
                              {formatMoney(s.paidAmount || 0, settings.currency)}
                            </td>
                            <td
                              className={`px-3 py-2 text-right font-mono font-bold ${
                                s.debt > 0 ? 'text-rose-600' : 'text-emerald-600'
                              }`}
                            >
                              {formatMoney(s.debt, settings.currency)}
                            </td>
                            <td className="px-3 py-2 text-slate-500">
                              {s.items.map((it) => `${it.itemName} ×${it.qty}`).join(', ')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};
