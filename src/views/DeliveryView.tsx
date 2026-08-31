import React, { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { formatMoney } from '../utils/audio';
import { OrderStatus } from '../types';
import { Truck, Search, CheckCircle, Clock } from 'lucide-react';

export const DeliveryView: React.FC = () => {
  const { dailyOrders, settings, updateOrderStatus } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [partnerFilter, setPartnerFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const partners = useMemo(() => {
    const set = new Set<string>();
    dailyOrders.forEach((o) => {
      if (o.deliveryPartner) set.add(o.deliveryPartner);
    });
    return Array.from(set);
  }, [dailyOrders]);

  const filtered = useMemo(() => {
    return dailyOrders.filter((o) => {
      if (partnerFilter && o.deliveryPartner !== partnerFilter) return false;
      if (statusFilter && o.status !== statusFilter) return false;
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        o.customerName.toLowerCase().includes(term) ||
        o.phone.includes(term) ||
        (o.trackingNumber && o.trackingNumber.toLowerCase().includes(term)) ||
        (o.deliveryPartner && o.deliveryPartner.toLowerCase().includes(term)) ||
        o.address.toLowerCase().includes(term)
      );
    });
  }, [dailyOrders, partnerFilter, statusFilter, searchTerm]);

  // Delivery metrics
  const totalDeliveries = dailyOrders.length;
  const inTransit = dailyOrders.filter((o) => o.status === 'With Courier').length;
  const delivered = dailyOrders.filter((o) => o.status === 'Delivered').length;
  const totalFees = dailyOrders.reduce((sum, o) => sum + Number(o.deliveryFee || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Metrics Banner */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] uppercase font-bold text-slate-400">Total Shipments</div>
          <div className="text-xl font-extrabold text-slate-900 mt-1">{totalDeliveries}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] uppercase font-bold text-slate-400">Out with Courier</div>
          <div className="text-xl font-extrabold text-amber-600 mt-1 flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            {inTransit}
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] uppercase font-bold text-slate-400">Delivered Completed</div>
          <div className="text-xl font-extrabold text-emerald-600 mt-1 flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4" />
            {delivered}
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] uppercase font-bold text-slate-400">Collected Shipping Fees</div>
          <div className="text-xl font-extrabold text-slate-900 mt-1 font-mono">
            {formatMoney(totalFees, settings.currency)}
          </div>
        </div>
      </div>

      {/* Shipments List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-teal-600" />
            <h3 className="font-bold text-sm text-slate-900">Shipments &amp; Delivery Tracking</h3>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            <select
              value={partnerFilter}
              onChange={(e) => setPartnerFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none"
            >
              <option value="">All Carriers</option>
              {partners.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>

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

            <div className="relative flex-1 md:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search tracking, customer, phone…"
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-teal-600"
              />
            </div>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">No shipments found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Recipient</th>
                  <th className="px-4 py-3">Carrier / Partner</th>
                  <th className="px-4 py-3">Tracking #</th>
                  <th className="px-4 py-3">Destination</th>
                  <th className="px-4 py-3 text-right">Order Value</th>
                  <th className="px-4 py-3 text-right">Shipping Fee</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3 text-slate-600">{o.date}</td>
                    <td className="px-4 py-3 font-bold text-slate-900">
                      {o.customerName}
                      <span className="block text-[10px] text-slate-500 font-mono font-normal">{o.phone}</span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-700">{o.deliveryPartner || 'Standard Local'}</td>
                    <td className="px-4 py-3 font-mono font-bold text-teal-700">{o.trackingNumber || '—'}</td>
                    <td className="px-4 py-3 text-slate-600 truncate max-w-xs">{o.address}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                      {formatMoney(o.saleTotal, settings.currency)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-600">
                      {formatMoney(o.deliveryFee, settings.currency)}
                    </td>
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
