import React, { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { formatMoney, getTodayDateString, playSound } from '../utils/audio';
import { CartItem, SaleRecord } from '../types';
import {
  ShoppingCart,
  Barcode,
  Camera,
  Ticket,
  Plus,
  Trash2,
  Printer,
  Edit,
  Search,
  CheckCircle2,
  X,
  CreditCard,
  User,
} from 'lucide-react';
import { BarcodeScannerModal } from '../components/BarcodeScannerModal';

export const SalesPosView: React.FC = () => {
  const {
    inventory,
    bundles,
    coupons,
    customers,
    sales,
    settings,
    recordSale,
    deleteSale,
    useCoupon,
    currentUser,
  } = useStore();

  // POS Form State
  const [saleDate, setSaleDate] = useState(getTodayDateString());
  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [paidAmount, setPaidAmount] = useState<number>(0);

  // Barcode & Promo inputs
  const [quickBarcodeInput, setQuickBarcodeInput] = useState('');
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; type: 'percent' | 'fixed'; value: number } | null>(null);

  // Cart Item Selector Form
  const [selectedItemName, setSelectedItemName] = useState('');
  const [itemQty, setItemQty] = useState<number>(1);
  const [itemPrice, setItemPrice] = useState<string>('');
  const [itemCost, setItemCost] = useState<string>('');
  const [invoiceDiscountType, setInvoiceDiscountType] = useState<'none' | 'percent' | 'fixed'>('none');
  const [invoiceDiscountValue, setInvoiceDiscountValue] = useState<number>(0);

  // Cart List
  const [cart, setCart] = useState<CartItem[]>([]);
  const [editingSaleId, setEditingSaleId] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [historySearch, setHistorySearch] = useState<string>('');
  const [saleToDelete, setSaleToDelete] = useState<SaleRecord | null>(null);

  const isCashier = currentUser.role === 'cashier';

  // Autocomplete Item selection change
  const handleItemSelectChange = (name: string) => {
    setSelectedItemName(name);
    const clean = name.trim();
    if (!clean) return;

    // Check bundles
    const isBundle = clean.startsWith('[Bundle]');
    const bundleName = clean.replace(/^\[Bundle\]\s*/i, '').trim();
    const bundleMatch = bundles.find((b) => b.name.toLowerCase() === bundleName.toLowerCase());

    if (bundleMatch) {
      setItemPrice(String(bundleMatch.price));
      const calcCost = bundleMatch.items.reduce((sum, bi) => {
        const match = inventory.find((i) => i.name.toLowerCase() === bi.name.toLowerCase());
        return sum + (match ? Number(match.cost || 0) * Number(bi.qty || 1) : 0);
      }, 0);
      setItemCost(calcCost > 0 ? String(calcCost) : '');
      return;
    }

    // Check inventory
    const invMatch = inventory.find((i) => i.name.toLowerCase() === clean.toLowerCase());
    if (invMatch) {
      setItemPrice(String(invMatch.price));
      setItemCost(String(invMatch.cost));
    }
  };

  // Fast Barcode Detected
  const handleBarcodeDetected = (code: string) => {
    const clean = code.trim();
    if (!clean) return;

    setErrorMsg('');
    const found = inventory.find(
      (i) => (i.barcode && i.barcode.trim() === clean) || i.name.toLowerCase() === clean.toLowerCase()
    );

    if (found) {
      playSound('beep', settings.soundEnabled);
      setCart((prev) => {
        const existingIdx = prev.findIndex((c) => c.itemId === found.id);
        if (existingIdx >= 0) {
          const updated = [...prev];
          updated[existingIdx].qty += 1;
          return updated;
        } else {
          return [
            ...prev,
            {
              itemId: found.id,
              bundleId: null,
              isBundle: false,
              bundleItems: null,
              itemName: found.name,
              qty: 1,
              price: found.price,
              cost: found.cost,
              discountType: 'none',
              discountValue: 0,
            },
          ];
        }
      });
      setStatusMsg(`Added: ${found.name}`);
      setTimeout(() => setStatusMsg(''), 2500);
    } else {
      setErrorMsg(`No product found in catalog with barcode: "${clean}"`);
      setTimeout(() => setErrorMsg(''), 4000);
    }
  };

  // Apply Promo Coupon
  const handleApplyCoupon = () => {
    setErrorMsg('');
    const code = promoCodeInput.trim().toUpperCase();
    if (!code) return;

    const coupon = coupons.find((c) => c.code.toUpperCase() === code);
    if (!coupon) {
      setErrorMsg('Promo code not found.');
      setTimeout(() => setErrorMsg(''), 3500);
      return;
    }
    if (!coupon.active) {
      setErrorMsg('This coupon is currently inactive.');
      setTimeout(() => setErrorMsg(''), 3500);
      return;
    }
    if (coupon.expiry && coupon.expiry < getTodayDateString()) {
      setErrorMsg('This promo code has expired.');
      setTimeout(() => setErrorMsg(''), 3500);
      return;
    }
    if (coupon.limit && coupon.usedCount >= coupon.limit) {
      setErrorMsg('This promo code has reached its maximum usage limit.');
      setTimeout(() => setErrorMsg(''), 3500);
      return;
    }

    setAppliedPromo({ code: coupon.code, type: coupon.type, value: coupon.value });
    setInvoiceDiscountType(coupon.type);
    setInvoiceDiscountValue(coupon.value);
    playSound('cash', settings.soundEnabled);
    setStatusMsg(`Coupon "${coupon.code}" applied!`);
    setTimeout(() => setStatusMsg(''), 3000);
  };

  // Add Item to Cart
  const handleAddToCart = () => {
    setErrorMsg('');
    const clean = selectedItemName.trim();
    if (!clean) {
      setErrorMsg('Please select or type a product name.');
      setTimeout(() => setErrorMsg(''), 3000);
      return;
    }

    const priceNum = parseFloat(itemPrice);
    if (isNaN(priceNum) || priceNum < 0) {
      setErrorMsg('Please enter a valid selling price.');
      setTimeout(() => setErrorMsg(''), 3000);
      return;
    }

    const qtyNum = Math.max(1, itemQty);
    const costNum = itemCost !== '' ? parseFloat(itemCost) : null;

    const isBundle = clean.startsWith('[Bundle]');
    const bundleName = clean.replace(/^\[Bundle\]\s*/i, '').trim();
    const bundleMatch = bundles.find((b) => b.name.toLowerCase() === bundleName.toLowerCase());
    const invMatch = inventory.find((i) => i.name.toLowerCase() === clean.toLowerCase());

    const newCartItem: CartItem = {
      itemId: invMatch ? invMatch.id : null,
      bundleId: bundleMatch ? bundleMatch.id : null,
      isBundle: !!bundleMatch || isBundle,
      bundleItems: bundleMatch ? bundleMatch.items.map((i) => ({ ...i })) : null,
      itemName: bundleMatch ? `[Bundle] ${bundleMatch.name}` : invMatch ? invMatch.name : clean,
      qty: qtyNum,
      price: priceNum,
      cost: costNum,
      discountType: 'none',
      discountValue: 0,
    };

    setCart((prev) => [...prev, newCartItem]);
    setSelectedItemName('');
    setItemQty(1);
    setItemPrice('');
    setItemCost('');
    playSound('beep', settings.soundEnabled);
  };

  // Summary Calculations
  const cartSummary = useMemo(() => {
    let subtotal = 0;
    let itemDiscountsTotal = 0;
    let costTotal = 0;

    cart.forEach((c) => {
      const gross = c.qty * c.price;
      let itemDisc = 0;
      if (c.discountType === 'percent') {
        itemDisc = (gross * Math.max(0, c.discountValue)) / 100;
      } else if (c.discountType === 'fixed') {
        itemDisc = Math.min(gross, Math.max(0, c.discountValue));
      }
      subtotal += gross;
      itemDiscountsTotal += itemDisc;
      if (c.cost != null) costTotal += c.cost * c.qty;
    });

    const afterItemDisc = subtotal - itemDiscountsTotal;
    let invoiceDisc = 0;
    if (invoiceDiscountType === 'percent') {
      invoiceDisc = (afterItemDisc * Math.max(0, invoiceDiscountValue)) / 100;
    } else if (invoiceDiscountType === 'fixed') {
      invoiceDisc = Math.min(afterItemDisc, Math.max(0, invoiceDiscountValue));
    }

    const finalTotal = Math.max(0, afterItemDisc - invoiceDisc);
    const paid = Number(paidAmount) || 0;
    const debt = Math.max(0, finalTotal - paid);
    const totalProfit = finalTotal - costTotal;

    return {
      subtotal,
      itemDiscountsTotal,
      invoiceDisc,
      finalTotal,
      paid,
      debt,
      costTotal,
      totalProfit,
    };
  }, [cart, invoiceDiscountType, invoiceDiscountValue, paidAmount]);

  // Complete Sale
  const handleCompleteSale = () => {
    if (cart.length === 0) {
      setErrorMsg('Cart is empty. Add at least one item.');
      setTimeout(() => setErrorMsg(''), 3000);
      return;
    }

    if (appliedPromo) {
      useCoupon(appliedPromo.code);
    }

    recordSale(
      {
        date: saleDate,
        customer: customerName.trim() || 'Walk-in Customer',
        items: [...cart],
        subtotal: cartSummary.subtotal,
        itemDiscountAmount: cartSummary.itemDiscountsTotal,
        discountType: invoiceDiscountType,
        discountValue: invoiceDiscountValue,
        discountAmount: cartSummary.invoiceDisc,
        total: cartSummary.finalTotal,
        paidAmount: Math.min(cartSummary.finalTotal, cartSummary.paid),
        debt: cartSummary.debt,
        paymentMethod,
        costTotal: cartSummary.costTotal,
        profit: cartSummary.totalProfit,
      },
      editingSaleId || undefined
    );

    // Reset form
    setCart([]);
    setEditingSaleId(null);
    setCustomerName('');
    setPaidAmount(0);
    setPromoCodeInput('');
    setAppliedPromo(null);
    setInvoiceDiscountType('none');
    setInvoiceDiscountValue(0);
    setStatusMsg(editingSaleId ? 'Sale modifications saved!' : 'Sale completed successfully!');
    setTimeout(() => setStatusMsg(''), 3500);
  };

  const startEditSale = (s: SaleRecord) => {
    setEditingSaleId(s.id);
    setSaleDate(s.date);
    setCustomerName(s.customer || '');
    setPaymentMethod(s.paymentMethod || 'Cash');
    setPaidAmount(s.paidAmount || 0);
    setInvoiceDiscountType(s.discountType || 'none');
    setInvoiceDiscountValue(s.discountValue || 0);
    setCart(s.items.map((i) => ({ ...i })));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingSaleId(null);
    setCart([]);
    setCustomerName('');
    setPaidAmount(0);
    setInvoiceDiscountType('none');
    setInvoiceDiscountValue(0);
  };

  // Print Invoice
  const handlePrintSale = (s: SaleRecord) => {
    const w = window.open('', '_blank', 'width=750,height=800');
    if (!w) return;
    const itemsHtml = s.items
      .map(
        (it) => `
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #eee;">${it.itemName}</td>
        <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:center;">${it.qty}</td>
        <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;">${formatMoney(it.price, settings.currency)}</td>
        <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;">${formatMoney(it.qty * it.price, settings.currency)}</td>
      </tr>
    `
      )
      .join('');

    w.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt #${s.id}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 30px; color: #1e293b; }
          .header { text-align: center; margin-bottom: 24px; border-bottom: 2px solid #0f766e; padding-bottom: 16px; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 13px; }
          th { text-align: left; padding: 6px 0; border-bottom: 2px solid #cbd5e1; font-size: 11px; text-transform: uppercase; color: #64748b; }
          .totals { margin-top: 20px; float: right; width: 260px; font-size: 13px; }
          .tot-row { display: flex; justify-content: space-between; padding: 4px 0; }
          .tot-final { font-size: 16px; font-weight: 800; border-top: 1px solid #cbd5e1; padding-top: 8px; margin-top: 4px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2 style="margin:0;color:#0f766e;">${settings.storeName || 'Store Ledger'}</h2>
          <p style="margin:4px 0;font-size:12px;color:#64748b;">Official Sales Receipt / Invoice</p>
          <p style="margin:2px 0;font-size:11px;color:#94a3b8;">Receipt #${s.id} · ${s.date} · Cashier: ${s.cashierName || 'Staff'}</p>
        </div>
        <div style="font-size:12px;margin-bottom:12px;">
          <strong>Customer:</strong> ${s.customer || 'Walk-in'}<br>
          <strong>Payment Method:</strong> ${s.paymentMethod || 'Cash'}
        </div>
        <table>
          <thead>
            <tr>
              <th>Item / Bundle</th>
              <th style="text-align:center;">Qty</th>
              <th style="text-align:right;">Price</th>
              <th style="text-align:right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
        <div class="totals">
          <div class="tot-row"><span>Subtotal:</span><span>${formatMoney(s.subtotal, settings.currency)}</span></div>
          ${s.discountAmount ? `<div class="tot-row" style="color:#0f766e;"><span>Discount:</span><span>-${formatMoney(s.discountAmount, settings.currency)}</span></div>` : ''}
          <div class="tot-row tot-final"><span>Total Due:</span><span>${formatMoney(s.total, settings.currency)}</span></div>
          <div class="tot-row"><span>Paid:</span><span>${formatMoney(s.paidAmount || 0, settings.currency)}</span></div>
          <div class="tot-row" style="color:${s.debt > 0 ? '#ef4444' : '#10b981'};font-weight:700;"><span>Balance Due:</span><span>${formatMoney(s.debt, settings.currency)}</span></div>
        </div>
        <script>window.print();</script>
      </body>
      </html>
    `);
    w.document.close();
  };

  // Filtered Sales History
  const filteredSales = useMemo(() => {
    if (!historySearch) return sales;
    const term = historySearch.toLowerCase();
    return sales.filter((s) => {
      return (
        s.date.includes(term) ||
        (s.customer && s.customer.toLowerCase().includes(term)) ||
        (s.cashierName && s.cashierName.toLowerCase().includes(term)) ||
        s.id.toLowerCase().includes(term) ||
        s.items.some((it) => it.itemName.toLowerCase().includes(term))
      );
    });
  }, [sales, historySearch]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Barcode Camera Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onDetected={handleBarcodeDetected}
      />

      {/* POS Top Section: Form Panel */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-teal-600" />
              {editingSaleId ? `Editing Invoice #${editingSaleId}` : 'Point of Sale (POS)'}
            </h2>
            <p className="text-xs text-slate-500">Record customer sales with barcode scanning, coupons &amp; credit ledger.</p>
          </div>
          {editingSaleId && (
            <button
              onClick={cancelEdit}
              className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold cursor-pointer"
            >
              Cancel Edit
            </button>
          )}
        </div>

        {/* Status / Error Toast Banners */}
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center justify-between animate-in fade-in">
            <span>{errorMsg}</span>
            <button onClick={() => setErrorMsg('')} className="text-rose-500 hover:text-rose-700 font-bold ml-2 cursor-pointer">&times;</button>
          </div>
        )}
        {statusMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs flex items-center justify-between animate-in fade-in">
            <span className="font-semibold">{statusMsg}</span>
            <button onClick={() => setStatusMsg('')} className="text-emerald-500 hover:text-emerald-700 font-bold ml-2 cursor-pointer">&times;</button>
          </div>
        )}

        {/* Invoice Metadata Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Invoice Date</label>
            <input
              type="date"
              value={saleDate}
              onChange={(e) => setSaleDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium focus:outline-none focus:border-teal-600"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Customer</label>
            <input
              type="text"
              list="pos-cust-list"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Walk-in Customer"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium focus:outline-none focus:border-teal-600"
            />
            <datalist id="pos-cust-list">
              {customers.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.mobile}
                </option>
              ))}
            </datalist>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Payment Method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium focus:outline-none focus:border-teal-600"
            >
              <option value="Cash">Cash Drawer</option>
              <option value="Card">Card / POS Terminal</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Credit">Credit / On Account</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Paid Amount</label>
            <input
              type="number"
              min="0"
              step="any"
              value={paidAmount || ''}
              onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold focus:outline-none focus:border-teal-600"
            />
          </div>
        </div>

        {/* Fast Barcode & Coupon Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
          {/* Barcode Quick Scanner */}
          <div className="p-3 rounded-xl bg-teal-50/60 border border-teal-200/80 flex items-center gap-2">
            <Barcode className="w-5 h-5 text-teal-700 shrink-0" />
            <div className="flex-1">
              <input
                type="text"
                value={quickBarcodeInput}
                onChange={(e) => setQuickBarcodeInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleBarcodeDetected(quickBarcodeInput);
                    setQuickBarcodeInput('');
                  }
                }}
                placeholder="Scan / Type Barcode & hit Enter..."
                className="w-full px-2.5 py-1.5 bg-white border border-teal-300 rounded-lg text-xs font-mono focus:outline-none focus:border-teal-600"
              />
            </div>
            <button
              onClick={() => setIsCameraOpen(true)}
              className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shrink-0 transition-colors shadow-2xs"
            >
              <Camera className="w-3.5 h-3.5" />
              Camera
            </button>
          </div>

          {/* Coupon Code Input */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2">
            <Ticket className="w-5 h-5 text-slate-600 shrink-0" />
            <div className="flex-1">
              <input
                type="text"
                value={promoCodeInput}
                onChange={(e) => setPromoCodeInput(e.target.value)}
                placeholder="Enter Coupon / Promo Code"
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs uppercase font-mono focus:outline-none focus:border-teal-600"
              />
            </div>
            <button
              onClick={handleApplyCoupon}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold shrink-0 transition-colors"
            >
              Apply
            </button>
          </div>
        </div>

        {/* Add Product to Cart Form */}
        <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 items-end">
          <div className="lg:col-span-2">
            <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Pick Product or Bundle</label>
            <input
              type="text"
              list="pos-item-list"
              value={selectedItemName}
              onChange={(e) => handleItemSelectChange(e.target.value)}
              placeholder="Search or pick product..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium focus:outline-none focus:border-teal-600"
            />
            <datalist id="pos-item-list">
              {inventory.map((i) => (
                <option key={i.id} value={i.name}>
                  Stock: {i.qty} · {formatMoney(i.price, settings.currency)}
                </option>
              ))}
              {bundles.map((b) => (
                <option key={b.id} value={`[Bundle] ${b.name}`}>
                  Package: {formatMoney(b.price, settings.currency)}
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
              value={itemQty}
              onChange={(e) => setItemQty(parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold focus:outline-none focus:border-teal-600"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Unit Price</label>
            <input
              type="number"
              min="0"
              step="any"
              value={itemPrice}
              onChange={(e) => setItemPrice(e.target.value)}
              placeholder="0.00"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold focus:outline-none focus:border-teal-600"
            />
          </div>

          {!isCashier && (
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Unit Cost</label>
              <input
                type="number"
                min="0"
                step="any"
                value={itemCost}
                onChange={(e) => setItemCost(e.target.value)}
                placeholder="Cost..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:outline-none focus:border-teal-600"
              />
            </div>
          )}

          <div>
            <button
              type="button"
              onClick={handleAddToCart}
              className="w-full py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add to Cart
            </button>
          </div>
        </div>

        {/* Live Cart Table */}
        <div className="border border-slate-200 rounded-xl overflow-hidden mt-4">
          <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800">Current Cart Items ({cart.length})</span>
            {cart.length > 0 && (
              <button
                onClick={() => setCart([])}
                className="text-[11px] text-rose-600 hover:underline font-semibold"
              >
                Clear Cart
              </button>
            )}
          </div>

          {cart.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">Cart is empty. Scan a barcode or pick items above.</div>
          ) : (
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-2">Product / Package</th>
                  <th className="px-4 py-2 text-center">Qty</th>
                  <th className="px-4 py-2 text-right">Price</th>
                  {!isCashier && <th className="px-4 py-2 text-right">Cost</th>}
                  {!isCashier && <th className="px-4 py-2 text-right">Est. Profit</th>}
                  <th className="px-4 py-2 text-right">Subtotal</th>
                  <th className="px-4 py-2 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cart.map((c, idx) => {
                  const lineTotal = c.qty * c.price;
                  const profit = c.cost != null ? lineTotal - c.cost * c.qty : null;
                  return (
                    <tr key={idx} className="hover:bg-slate-50/60">
                      <td className="px-4 py-2 font-medium text-slate-900">
                        {c.itemName}
                        {c.isBundle && (
                          <span className="ml-2 text-[9px] px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 font-bold uppercase">
                            Bundle
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-center">
                        <input
                          type="number"
                          min="1"
                          value={c.qty}
                          onChange={(e) => {
                            const val = Math.max(1, parseInt(e.target.value) || 1);
                            setCart((prev) => prev.map((item, i) => (i === idx ? { ...item, qty: val } : item)));
                          }}
                          className="w-14 text-center px-1.5 py-1 border border-slate-300 rounded text-xs font-mono font-bold"
                        />
                      </td>
                      <td className="px-4 py-2 text-right font-mono">{formatMoney(c.price, settings.currency)}</td>
                      {!isCashier && (
                        <td className="px-4 py-2 text-right font-mono text-slate-500">
                          {c.cost != null ? formatMoney(c.cost, settings.currency) : '—'}
                        </td>
                      )}
                      {!isCashier && (
                        <td
                          className={`px-4 py-2 text-right font-mono font-bold ${
                            profit != null && profit >= 0 ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {profit != null ? formatMoney(profit, settings.currency) : '—'}
                        </td>
                      )}
                      <td className="px-4 py-2 text-right font-mono font-extrabold text-slate-900">
                        {formatMoney(lineTotal, settings.currency)}
                      </td>
                      <td className="px-4 py-2 text-center">
                        <button
                          onClick={() => {
                            setCart((prev) => prev.filter((_, i) => i !== idx));
                            playSound('delete', settings.soundEnabled);
                          }}
                          className="text-rose-600 hover:text-rose-800 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Totals Summary Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="text-[10px] uppercase font-bold text-slate-500">Gross Subtotal</div>
            <div className="font-mono text-base font-bold text-slate-900 mt-0.5">
              {formatMoney(cartSummary.subtotal, settings.currency)}
            </div>
          </div>

          <div className="p-3 bg-teal-50/50 border border-teal-200 rounded-xl">
            <div className="text-[10px] uppercase font-bold text-teal-700">Total Discounts</div>
            <div className="font-mono text-base font-bold text-teal-700 mt-0.5">
              -{formatMoney(cartSummary.itemDiscountsTotal + cartSummary.invoiceDisc, settings.currency)}
            </div>
          </div>

          <div className="p-3 bg-slate-900 text-white rounded-xl">
            <div className="text-[10px] uppercase font-bold text-teal-300">Final Total Due</div>
            <div className="font-mono text-lg font-extrabold text-white mt-0.5">
              {formatMoney(cartSummary.finalTotal, settings.currency)}
            </div>
          </div>

          <div
            className={`p-3 rounded-xl border ${
              cartSummary.debt > 0 ? 'bg-rose-50 border-rose-200' : 'bg-emerald-50 border-emerald-200'
            }`}
          >
            <div
              className={`text-[10px] uppercase font-bold ${
                cartSummary.debt > 0 ? 'text-rose-700' : 'text-emerald-700'
              }`}
            >
              Remaining Balance Due
            </div>
            <div
              className={`font-mono text-base font-extrabold mt-0.5 ${
                cartSummary.debt > 0 ? 'text-rose-700' : 'text-emerald-700'
              }`}
            >
              {formatMoney(cartSummary.debt, settings.currency)}
            </div>
          </div>
        </div>

        {/* Complete Sale CTA */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCompleteSale}
              disabled={cart.length === 0}
              className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-xl text-xs font-extrabold flex items-center gap-2 shadow-sm transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              {editingSaleId ? 'Save Sale Modifications' : 'Complete Sale & Log Invoice'}
            </button>
            {statusMsg && <span className="text-xs font-semibold text-emerald-600">{statusMsg}</span>}
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Cashier: <b className="text-slate-800">{currentUser.name}</b> ({currentUser.role})
          </div>
        </div>
      </div>

      {/* Sales History Log Panel */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-teal-600" />
            <h3 className="font-bold text-sm text-slate-900">Sales Invoices History</h3>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              placeholder="Search invoice, customer, product…"
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-teal-600"
            />
          </div>
        </div>

        {filteredSales.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">No recorded sales found.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredSales.map((s) => (
              <div key={s.id} className="p-4 hover:bg-slate-50/70 transition-colors">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-xs text-slate-900">#{s.id}</span>
                    <span className="text-xs text-slate-500 font-medium">{s.date}</span>
                    <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-400" />
                      {s.customer || 'Walk-in'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    {!isCashier && (
                      <span
                        className={`text-xs font-mono font-bold ${
                          (s.profit || 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        Profit: {formatMoney(s.profit, settings.currency)}
                      </span>
                    )}
                    <span className="font-mono text-sm font-extrabold text-slate-900">
                      {formatMoney(s.total, settings.currency)}
                    </span>
                    <button
                      onClick={() => handlePrintSale(s)}
                      className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200"
                      title="Print Invoice Receipt"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => startEditSale(s)}
                      className="p-1.5 text-teal-600 hover:bg-teal-50 rounded-lg border border-teal-200"
                      title="Edit Sale"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setSaleToDelete(s)}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200 cursor-pointer transition-colors"
                      title="Delete / Void Sale"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Items in Invoice */}
                <div className="mt-2 text-xs text-slate-600 flex flex-wrap gap-2">
                  {s.items.map((it, i) => (
                    <span key={i} className="px-2 py-0.5 bg-slate-100 rounded text-[11px]">
                      {it.itemName} ×{it.qty} ({formatMoney(it.price, settings.currency)})
                    </span>
                  ))}
                </div>

                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                  <span>
                    Payment: <b className="text-slate-600">{s.paymentMethod || 'Cash'}</b> · Paid: {formatMoney(s.paidAmount || 0, settings.currency)}
                    {s.debt > 0 && <span className="ml-2 font-bold text-rose-600">· Due: {formatMoney(s.debt, settings.currency)}</span>}
                  </span>
                  <span>Recorded by: {s.cashierName || 'Staff'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* In-App Delete Sale Confirmation Modal */}
      {saleToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-left">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Void &amp; Delete Invoice</h3>
                <p className="text-xs text-slate-500 font-mono">#{saleToDelete.id}</p>
              </div>
            </div>

            <div className="p-3.5 bg-rose-50/70 rounded-xl border border-rose-200/80 text-xs text-rose-900 space-y-2">
              <p className="font-semibold text-rose-800">
                Are you sure you want to delete this invoice?
              </p>
              <div className="bg-white p-2.5 rounded-lg border border-rose-200 space-y-1 font-mono text-[11px] text-slate-700">
                <div>Customer: <b className="text-slate-900 font-sans">{saleToDelete.customer || 'Walk-in'}</b></div>
                <div>Date: {saleToDelete.date}</div>
                <div>Total Amount: <b>{formatMoney(saleToDelete.total, settings.currency)}</b></div>
                <div>Items: {saleToDelete.items?.map((it) => `${it.itemName} (×${it.qty})`).join(', ')}</div>
              </div>
              <p className="text-[11px] text-rose-700 leading-relaxed">
                Sold items will automatically be returned back to inventory stock, customer balance will be adjusted, and the transaction will be removed from financial reports.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => setSaleToDelete(null)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const id = saleToDelete.id;
                  deleteSale(id);
                  setSaleToDelete(null);
                  setStatusMsg(`Invoice #${id} has been voided & deleted.`);
                  setTimeout(() => setStatusMsg(''), 4000);
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Void &amp; Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
