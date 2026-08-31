import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import {
  AlertTriangle,
  Trash2,
  X,
  RotateCcw,
  Sparkles,
  Database,
  Receipt,
  Check,
  ShieldAlert,
  Users,
  Package,
  Layers,
} from 'lucide-react';

interface WipeDataModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WipeDataModal: React.FC<WipeDataModalProps> = ({ isOpen, onClose }) => {
  const {
    wipeAllData,
    resetToFactorySettings,
    wipeTransactionsOnly,
    wipeAllUsersExceptAdmin,
    sales,
    inventory,
    customers,
    users,
    dailyOrders,
    expenses,
  } = useStore();

  const [wipeMode, setWipeMode] = useState<'blank' | 'factory' | 'transactions_only' | 'users_only'>('blank');
  const [confirmText, setConfirmText] = useState('');
  const [isWiping, setIsWiping] = useState(false);
  const [wipeCompleted, setWipeCompleted] = useState(false);
  const [wipedMessage, setWipedMessage] = useState('');

  if (!isOpen) return null;

  const isConfirmed = confirmText.trim().toUpperCase() === 'WIPE' || confirmText.trim().toUpperCase() === 'RESET';

  const handleExecuteWipe = () => {
    if (!isConfirmed) return;

    setIsWiping(true);
    setTimeout(() => {
      if (wipeMode === 'factory') {
        resetToFactorySettings();
        setWipedMessage('Restored demo sample inventory, customers, and starter accounts.');
      } else if (wipeMode === 'blank') {
        wipeAllData({ mode: 'blank' });
        setWipedMessage('Completely wiped all inventory, sales, customers, and accounts (0 records).');
      } else if (wipeMode === 'transactions_only') {
        wipeTransactionsOnly();
        setWipedMessage('All sales, orders, debts, and transaction history wiped clean. Catalog preserved.');
      } else if (wipeMode === 'users_only') {
        wipeAllUsersExceptAdmin();
        setWipedMessage('Removed all extra user accounts and reset to default admin.');
      }

      setIsWiping(false);
      setWipeCompleted(true);
      setTimeout(() => {
        setWipeCompleted(false);
        setConfirmText('');
        onClose();
      }, 1500);
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-rose-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-rose-100 bg-rose-50/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-xs">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-rose-950 flex items-center gap-2">
                Wipe Store Data
              </h3>
              <p className="text-xs text-rose-700 font-medium">
                Reset database, delete test transactions, or start completely clean
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-white/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {wipeCompleted ? (
            <div className="py-10 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center animate-bounce">
                <Check className="w-8 h-8" />
              </div>
              <h4 className="text-base font-bold text-slate-900">Data Successfully Wiped!</h4>
              <p className="text-xs text-slate-600 max-w-sm mx-auto font-medium">
                {wipedMessage}
              </p>
            </div>
          ) : (
            <>
              {/* Summary of current database records */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-slate-600" />
                  Current Stored Records in Ledger:
                </div>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="bg-white p-2 rounded-lg border border-slate-200/80">
                    <div className="text-sm font-black text-slate-900">{sales.length}</div>
                    <div className="text-[10px] text-slate-500 font-medium">Sales</div>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200/80">
                    <div className="text-sm font-black text-slate-900">{inventory.length}</div>
                    <div className="text-[10px] text-slate-500 font-medium">Products</div>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200/80">
                    <div className="text-sm font-black text-slate-900">{customers.length}</div>
                    <div className="text-[10px] text-slate-500 font-medium">Customers</div>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200/80">
                    <div className="text-sm font-black text-slate-900">{users.length}</div>
                    <div className="text-[10px] text-slate-500 font-medium">Profiles</div>
                  </div>
                </div>
              </div>

              {/* Mode Selection */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  Select Wipe Option:
                </label>
                <div className="space-y-2.5">
                  {/* Option 1: Clean Slate (Blank) */}
                  <label
                    onClick={() => setWipeMode('blank')}
                    className={`block p-3.5 rounded-xl border cursor-pointer transition-all ${
                      wipeMode === 'blank'
                        ? 'border-rose-500 bg-rose-50/50 ring-2 ring-rose-500/20'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-rose-100 text-rose-700 mt-0.5">
                        <Trash2 className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900">
                            Clean Slate (Complete Blank Wipe)
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-rose-100 text-rose-800 rounded-full">
                            Zero (0) Records
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Wipes everything to an empty state: 0 products, 0 sales, 0 customers, 0 debts, 0 orders, and resets to 1 clean Admin account.
                        </p>
                      </div>
                    </div>
                  </label>

                  {/* Option 2: Transactions Only */}
                  <label
                    onClick={() => setWipeMode('transactions_only')}
                    className={`block p-3.5 rounded-xl border cursor-pointer transition-all ${
                      wipeMode === 'transactions_only'
                        ? 'border-rose-500 bg-rose-50/50 ring-2 ring-rose-500/20'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-amber-100 text-amber-700 mt-0.5">
                        <Receipt className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900">
                            Wipe Transactions Only (Keep Products &amp; Customers)
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full">
                            Clear History
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Clears sales history, purchases, daily orders, customer debts, expenses, and logs, but keeps all product catalog items intact.
                        </p>
                      </div>
                    </div>
                  </label>

                  {/* Option 3: Factory Reset */}
                  <label
                    onClick={() => setWipeMode('factory')}
                    className={`block p-3.5 rounded-xl border cursor-pointer transition-all ${
                      wipeMode === 'factory'
                        ? 'border-rose-500 bg-rose-50/50 ring-2 ring-rose-500/20'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-blue-100 text-blue-700 mt-0.5">
                        <RotateCcw className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900">
                            Factory Demo Reset (Sample Data)
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">
                            Sample Catalog
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Restores fresh sample coffee &amp; grocery products, categories, sample customers, and demo cashier/manager users.
                        </p>
                      </div>
                    </div>
                  </label>

                  {/* Option 4: Users / Profiles Reset */}
                  <label
                    onClick={() => setWipeMode('users_only')}
                    className={`block p-3.5 rounded-xl border cursor-pointer transition-all ${
                      wipeMode === 'users_only'
                        ? 'border-rose-500 bg-rose-50/50 ring-2 ring-rose-500/20'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-purple-100 text-purple-700 mt-0.5">
                        <Users className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900">
                            Wipe Extra User Accounts (Reset Profiles)
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-purple-100 text-purple-800 rounded-full">
                            Users Only
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Deletes all created/previous profiles and resets to a single primary Admin account.
                        </p>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Confirmation Input */}
              <div className="bg-rose-50/70 border border-rose-200/80 rounded-xl p-4 space-y-2.5">
                <div className="flex items-center gap-2 text-rose-800 font-bold text-xs">
                  <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Safety Confirmation Required</span>
                </div>
                <p className="text-[11px] text-rose-700">
                  To proceed with this wipe, please type <b className="font-mono bg-rose-200/80 px-1.5 py-0.5 rounded text-rose-950">WIPE</b> in the box below:
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder="Type WIPE here..."
                    className="w-full px-3 py-2 border border-rose-300 rounded-lg text-xs font-mono font-bold text-slate-900 uppercase focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-600 bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setConfirmText('WIPE')}
                    className="px-2.5 py-2 text-[11px] font-semibold text-rose-700 hover:text-rose-900 bg-rose-100 hover:bg-rose-200 rounded-lg whitespace-nowrap transition-colors"
                  >
                    Auto-fill
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        {!wipeCompleted && (
          <div className="p-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-bold transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!isConfirmed || isWiping}
              onClick={handleExecuteWipe}
              className="px-5 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all"
            >
              <Trash2 className="w-4 h-4" />
              {isWiping ? 'Wiping Database...' : 'Confirm & Wipe Data'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
