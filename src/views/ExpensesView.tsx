import React, { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { formatMoney, getTodayDateString } from '../utils/audio';
import { ExpenseRecord } from '../types';
import { Receipt, Plus, Trash2, Search } from 'lucide-react';

export const ExpensesView: React.FC = () => {
  const { expenses, settings, recordExpense, deleteExpense } = useStore();

  const [date, setDate] = useState(getTodayDateString());
  const [category, setCategory] = useState('Rent & Utilities');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [expenseToDelete, setExpenseToDelete] = useState<ExpenseRecord | null>(null);
  const [formError, setFormError] = useState<string>('');

  const EXPENSE_CATEGORIES = [
    'Rent & Utilities',
    'Salaries & Wages',
    'Packaging & Shipping',
    'Marketing & Ads',
    'Equipment & Maintenance',
    'Office & Consumables',
    'Damaged Stock Write-off',
    'Promo Samples Write-off',
    'Miscellaneous',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    const amt = parseFloat(amount);
    if (!description.trim() || isNaN(amt) || amt <= 0) {
      setFormError('Please enter a valid description and expense amount.');
      return;
    }

    recordExpense({
      date,
      category,
      description: description.trim(),
      amount: amt,
    });

    setDescription('');
    setAmount('');
  };

  const filtered = useMemo(() => {
    return expenses.filter((e) => {
      if (categoryFilter && e.category !== categoryFilter) return false;
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return e.description.toLowerCase().includes(term) || e.date.includes(term);
    });
  }, [expenses, categoryFilter, searchTerm]);

  const totalExpenseVal = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Record Expense Form */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
        <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2 mb-4">
          <Receipt className="w-5 h-5 text-teal-600" />
          Record Store Operating Expense
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center justify-between animate-in fade-in">
              <span>{formError}</span>
              <button type="button" onClick={() => setFormError('')} className="text-rose-500 hover:text-rose-700 font-bold ml-2 cursor-pointer">&times;</button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Expense Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium focus:outline-none focus:border-teal-600"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none focus:border-teal-600"
              >
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Description *</label>
              <input
                type="text"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Electricity bill, Coffee bean bags"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-teal-600"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Amount *</label>
              <input
                type="number"
                min="0"
                step="any"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold focus:outline-none focus:border-teal-600"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Save Expense
            </button>
          </div>
        </form>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row gap-3 items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-900">Expenses Log ({expenses.length})</h3>
            <span className="text-xs text-slate-500 font-mono font-bold">
              Total Expenses: {formatMoney(totalExpenseVal, settings.currency)}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none"
            >
              <option value="">All Categories</option>
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <div className="relative flex-1 md:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search description, date…"
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-teal-600"
              />
            </div>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">No expenses recorded.</div>
        ) : (
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3 text-slate-600">{e.date}</td>
                  <td className="px-4 py-3">
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                      {e.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900">{e.description}</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-rose-600">
                    {formatMoney(e.amount, settings.currency)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      type="button"
                      onClick={() => setExpenseToDelete(e)}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                      title="Delete Expense"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* In-App Delete Expense Confirmation Modal */}
      {expenseToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-left">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Expense Record</h3>
                <p className="text-xs text-slate-500 font-mono">#{expenseToDelete.id}</p>
              </div>
            </div>

            <div className="p-3.5 bg-rose-50/70 rounded-xl border border-rose-200/80 text-xs text-rose-900 space-y-2">
              <p className="font-semibold text-rose-800">
                Are you sure you want to delete this expense record?
              </p>
              <div className="bg-white p-2.5 rounded-lg border border-rose-200 space-y-1 font-mono text-[11px] text-slate-700">
                <div>Date: {expenseToDelete.date}</div>
                <div>Category: <span className="font-sans font-bold">{expenseToDelete.category}</span></div>
                <div>Description: {expenseToDelete.description}</div>
                <div>Amount: <b>{formatMoney(expenseToDelete.amount, settings.currency)}</b></div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => setExpenseToDelete(null)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteExpense(expenseToDelete.id);
                  setExpenseToDelete(null);
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Expense
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
