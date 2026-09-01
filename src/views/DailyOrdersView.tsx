import React, { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { formatMoney, getTodayDateString } from '../utils/audio';
import { DailyOrder, OrderStatus } from '../types';
import { ClipboardList, Search, Plus, Edit, Trash2, Printer, CheckSquare, Download, Truck } from 'lucide-react';

export const DailyOrdersView: React.FC = () => {
  const {
    dailyOrders,
    customers,
    settings,
    addDailyOrder,
    updateOrderStatus,
    deleteDailyOrder,
  } = useStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [showPackingChecklist, setShowPackingChecklist] = useState(false);
  const [editingOrder, setEditingOrder] = useState<DailyOrder | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<DailyOrder | null>(null);
  const [formError, setFormError] = useState<string>('');

  // Form State
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [orderDate, setOrderDate] = useState(getTodayDateString());
  const [details, setDetails] = useState('');
  const [saleTotal, setSaleTotal] = useState<number>(0);
  const [deliveryFee, setDeliveryFee] = useState<number>(0);
  const [deliveryPartner, setDeliveryPartner] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [expectedDelivery, setExpectedDelivery] = useState('');
  const [status, setStatus] = useState<OrderStatus>('Ready');

  const resetForm = () => {
    setCustomerName('');
    setPhone('');
    setAddress('');
    setOrderDate(getTodayDateString());
    setDetails('');
    setSaleTotal(0);
    setDeliveryFee(0);
    setDeliveryPartner('');
    setTrackingNumber('');
    setExpectedDelivery('');
    setStatus('Ready');
    setEditingOrder(null);
  };

  const handleCustomerSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const found = customers.find((c) => c.id === e.target.value);
    if (found) {
      setCustomerName(found.name);
      setPhone(found.mobile);
      setAddress(found.address || '');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!customerName.trim() || !phone.trim() || !address.trim() || !details.trim()) {
      setFormError('Please fill in customer name, phone, address, and order items.');
      return;
    }

    addDailyOrder(
      {
        date: orderDate,
        customerName: customerName.trim(),
        phone: phone.trim(),
        address: address.trim(),
        details: details.trim(),
        saleTotal: Number(saleTotal) || 0,
        status,
        deliveryPartner: deliveryPartner.trim(),
        trackingNumber: trackingNumber.trim(),
        deliveryFee: Number(deliveryFee) || 0,
        expectedDelivery: expectedDelivery || undefined,
      },
      editingOrder?.id
    );

    resetForm();
  };

  const startEdit = (o: DailyOrder) => {
    setEditingOrder(o);
    setCustomerName(o.customerName);
    setPhone(o.phone);
    setAddress(o.address);
    setOrderDate(o.date);
    setDetails(o.details);
    setSaleTotal(o.saleTotal || 0);
    setDeliveryFee(o.deliveryFee || 0);
    setDeliveryPartner(o.deliveryPartner || '');
    setTrackingNumber(o.trackingNumber || '');
    setExpectedDelivery(o.expectedDelivery || '');
    setStatus(o.status);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return dailyOrders.filter((o) => {
      if (statusFilter && o.status !== statusFilter) return false;
      if (dateFilter && o.date !== dateFilter) return false;
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        o.customerName.toLowerCase().includes(term) ||
        o.phone.includes(term) ||
        o.address.toLowerCase().includes(term) ||
        o.details.toLowerCase().includes(term) ||
        (o.deliveryPartner && o.deliveryPartner.toLowerCase().includes(term)) ||
        (o.trackingNumber && o.trackingNumber.toLowerCase().includes(term))
      );
    });
  }, [dailyOrders, statusFilter, dateFilter, searchTerm]);

  // Printable packing slip
  const printPackingSlips = () => {
    const activeOrders = dailyOrders.filter((o) => o.status === 'Preparing' || o.status === 'Ready');
    if (!activeOrders.length) {
      setFormError('No orders in Preparation or Ready status to print.');
      return;
    }

    const w = window.open('', '_blank', 'width=750,height=800');
    if (!w) return;

    const content = activeOrders
      .map(
        (o) => `
      <div style="border-bottom: 2px dashed #cbd5e1; padding: 16px 0; margin-bottom: 16px;">
        <h3 style="margin:0;font-size:16px;">Order #${o.id} · ${o.customerName} (${o.phone})</h3>
        <p style="margin:4px 0;font-size:12px;color:#64748b;">Address: ${o.address} | Date: ${o.date} | Courier: ${o.deliveryPartner || 'Standard'}</p>
        <div style="background:#f8fafc;padding:10px;border-radius:6px;margin:8px 0;font-size:13px;">
          <strong>Items to Pack:</strong> ${o.details}
        </div>
        <p style="font-size:11px;color:#94a3b8;">[  ] Checked &amp; Packed &nbsp;&nbsp;&nbsp;&nbsp; [  ] Quality Inspected &nbsp;&nbsp;&nbsp;&nbsp; Inspector: ___________</p>
      </div>
    `
      )
      .join('');

    w.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Packing Slips - ${getTodayDateString()}</title>
        <style>body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 24px; color:#1e293b; }</style>
      </head>
      <body>
        <h2 style="color:#0f766e;margin-top:0;">${settings.storeName || 'Store Ledger'} - Warehouse Picking &amp; Packing List</h2>
        <p style="font-size:12px;color:#64748b;">Printed at ${new Date().toLocaleString()} · ${activeOrders.length} Order(s)</p>
        ${content}
        <script>window.print();</script>
      </body>
      </html>
    `);
    w.document.close();
  };

  const exportOrdersCsv = () => {
    if (!dailyOrders.length) return;
    const headers = ['Order ID', 'Date', 'Customer', 'Phone', 'Address', 'Details', 'Total', 'Shipping Fee', 'Courier', 'Tracking #', 'Status'];
    const rows = dailyOrders.map((o) => [
      o.id,
      o.date,
      `"${o.customerName.replace(/"/g, '""')}"`,
      o.phone,
      `"${o.address.replace(/"/g, '""')}"`,
      `"${o.details.replace(/"/g, '""')}"`,
      o.saleTotal,
      o.deliveryFee,
      `"${(o.deliveryPartner || '').replace(/"/g, '""')}"`,
      o.trackingNumber || '',
      o.status,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `daily-orders-${getTodayDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const KANBAN_STATUSES: OrderStatus[] = ['Ready', 'Preparing', 'With Courier', 'Delivered'];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Order Creation Form */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
        <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2 mb-4">
          <ClipboardList className="w-5 h-5 text-teal-600" />
          {editingOrder ? `Edit Daily Order #${editingOrder.id}` : 'Create Daily Delivery Order'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center justify-between animate-in fade-in">
              <span>{formError}</span>
              <button type="button" onClick={() => setFormError('')} className="text-rose-500 hover:text-rose-700 font-bold ml-2 cursor-pointer">&times;</button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="lg:col-span-2">
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                Select Existing Customer (Optional)
              </label>
              <select
                onChange={handleCustomerSelect}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium focus:outline-none focus:border-teal-600"
              >
                <option value="">Walk-in or select customer...</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.mobile})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Customer Name *</label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Sarah Connor"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium focus:outline-none focus:border-teal-600"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Phone Number *</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0791234567"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:outline-none focus:border-teal-600"
              />
            </div>

            <div className="lg:col-span-2">
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Delivery Address *</label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="City, neighborhood, street address"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-teal-600"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Order Date</label>
              <input
                type="date"
                required
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium focus:outline-none focus:border-teal-600"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Order Total</label>
              <input
                type="number"
                min="0"
                step="any"
                value={saleTotal}
                onChange={(e) => setSaleTotal(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold focus:outline-none focus:border-teal-600"
              />
            </div>

            <div className="lg:col-span-2">
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Order Details / Items *</label>
              <input
                type="text"
                required
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="e.g. 2x Arabica Coffee (500g), 1x Burr Grinder"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-teal-600"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Courier / Carrier</label>
              <input
                type="text"
                value={deliveryPartner}
                onChange={(e) => setDeliveryPartner(e.target.value)}
                placeholder="e.g. Aramex, Local Driver"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-teal-600"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Tracking Number</label>
              <input
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="e.g. TRK-9901"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:outline-none focus:border-teal-600"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Shipping Fee</label>
              <input
                type="number"
                min="0"
                step="any"
                value={deliveryFee}
                onChange={(e) => setDeliveryFee(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:outline-none focus:border-teal-600"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Expected Delivery ETA</label>
              <input
                type="date"
                value={expectedDelivery}
                onChange={(e) => setExpectedDelivery(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-teal-600"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as OrderStatus)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none focus:border-teal-600"
              >
                <option value="Ready">Ready</option>
                <option value="Preparing">Preparing</option>
                <option value="With Courier">With Courier</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-2">
            <button
              type="submit"
              className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              {editingOrder ? 'Save Changes' : 'Save Order'}
            </button>
            <button
              type="button"
              onClick={() => setShowPackingChecklist(!showPackingChecklist)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold flex items-center gap-1.5"
            >
              <CheckSquare className="w-3.5 h-3.5 text-teal-600" />
              {showPackingChecklist ? 'Hide Checklist' : '📦 Packing &amp; Quality Checklist'}
            </button>
            <button
              type="button"
              onClick={exportOrdersCsv}
              className="px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
            {editingOrder && (
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

      {/* Packing Checklist Panel */}
      {showPackingChecklist && (
        <div className="bg-white rounded-xl border-2 border-teal-600 p-5 shadow-md space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-teal-600" />
                Warehouse Picking &amp; Quality Inspection Checklist
              </h3>
              <p className="text-xs text-slate-500">Orders currently in Ready or Preparing stages</p>
            </div>
            <button
              onClick={printPackingSlips}
              className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Packing Slips
            </button>
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto">
            {dailyOrders
              .filter((o) => o.status === 'Ready' || o.status === 'Preparing')
              .map((o) => (
                <div key={o.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-900">
                      {o.customerName} ({o.phone})
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 font-bold">
                      {o.status}
                    </span>
                  </div>
                  <p className="text-slate-600">📍 {o.address}</p>
                  <div className="bg-white p-2 rounded border border-slate-200 font-medium text-slate-800">
                    {o.details}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Order Status Kanban Board */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
        <h3 className="font-bold text-sm text-slate-900 mb-3 flex items-center gap-2">
          <Truck className="w-4 h-4 text-teal-600" />
          Order Status Kanban Board
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {KANBAN_STATUSES.map((st) => {
            const list = dailyOrders.filter((o) => o.status === st);
            return (
              <div key={st} className="bg-slate-50 rounded-xl p-3 border border-slate-200 flex flex-col">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 font-bold text-xs text-slate-700">
                  <span>{st}</span>
                  <span className="bg-white px-2 py-0.5 rounded-full border border-slate-200 text-[10px]">
                    {list.length}
                  </span>
                </div>

                <div className="space-y-2 mt-2 flex-1 max-h-72 overflow-y-auto pr-1">
                  {list.map((o) => (
                    <div key={o.id} className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs text-xs space-y-1">
                      <div className="font-bold text-slate-900 flex items-center justify-between">
                        <span>{o.customerName}</span>
                        <span className="font-mono text-[11px] text-teal-700">{formatMoney(o.saleTotal, settings.currency)}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-1">{o.details}</p>
                      <select
                        value={o.status}
                        onChange={(e) => updateOrderStatus(o.id, e.target.value as OrderStatus)}
                        className="w-full mt-1 px-1.5 py-1 bg-slate-50 border border-slate-200 rounded text-[10px] font-semibold text-slate-700"
                      >
                        <option value="Ready">Ready</option>
                        <option value="Preparing">Preparing</option>
                        <option value="With Courier">With Courier</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>
                  ))}
                  {list.length === 0 && <div className="p-4 text-center text-slate-400 text-[11px]">No orders</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Orders Directory Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row gap-3 items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900">All Daily Orders ({dailyOrders.length})</h3>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="Ready">Ready</option>
              <option value="Preparing">Preparing</option>
              <option value="With Courier">With Courier</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
            </select>

            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none"
            />

            <div className="relative flex-1 md:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search customer, phone, tracking…"
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-teal-600"
              />
            </div>
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">No daily orders match your search criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Address</th>
                  <th className="px-4 py-3">Details</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-right">Shipping</th>
                  <th className="px-4 py-3">Carrier</th>
                  <th className="px-4 py-3">Tracking #</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3 text-slate-600">{o.date}</td>
                    <td className="px-4 py-3 font-bold text-slate-900">{o.customerName}</td>
                    <td className="px-4 py-3 font-mono text-slate-600">{o.phone}</td>
                    <td className="px-4 py-3 text-slate-500 truncate max-w-xs">{o.address}</td>
                    <td className="px-4 py-3 text-slate-700 truncate max-w-xs font-medium">{o.details}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                      {formatMoney(o.saleTotal, settings.currency)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-600">
                      {formatMoney(o.deliveryFee, settings.currency)}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{o.deliveryPartner || '—'}</td>
                    <td className="px-4 py-3 font-mono text-slate-600">{o.trackingNumber || '—'}</td>
                    <td className="px-4 py-3">
                      <select
                        value={o.status}
                        onChange={(e) => updateOrderStatus(o.id, e.target.value as OrderStatus)}
                        className="px-2 py-1 bg-slate-100 border border-slate-300 rounded text-[11px] font-bold text-slate-800"
                      >
                        <option value="Ready">Ready</option>
                        <option value="Preparing">Preparing</option>
                        <option value="With Courier">With Courier</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => startEdit(o)}
                          className="p-1 text-teal-600 hover:bg-teal-50 rounded-lg"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setOrderToDelete(o)}
                          className="p-1 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                          title="Delete Order"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* In-App Delete Order Confirmation Modal */}
      {orderToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-left">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Delivery Order</h3>
                <p className="text-xs text-slate-500 font-mono">#{orderToDelete.id}</p>
              </div>
            </div>

            <div className="p-3.5 bg-rose-50/70 rounded-xl border border-rose-200/80 text-xs text-rose-900 space-y-2">
              <p className="font-semibold text-rose-800">
                Are you sure you want to delete the order for <b className="text-rose-950 font-bold">{orderToDelete.customerName}</b>?
              </p>
              <div className="bg-white p-2.5 rounded-lg border border-rose-200 space-y-1 font-mono text-[11px] text-slate-700">
                <div>Phone: {orderToDelete.phone}</div>
                <div>Address: {orderToDelete.address}</div>
                <div>Total: <b>{formatMoney(orderToDelete.saleTotal, settings.currency)}</b></div>
                <div>Status: <span className="font-bold">{orderToDelete.status}</span></div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => setOrderToDelete(null)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteDailyOrder(orderToDelete.id);
                  setOrderToDelete(null);
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
