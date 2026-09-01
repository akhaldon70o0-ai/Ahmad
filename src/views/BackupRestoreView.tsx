import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { getTodayDateString } from '../utils/audio';
import {
  Download,
  Upload,
  Shield,
  Key,
  Trash2,
  Globe,
  Settings as SettingsIcon,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { WipeDataModal } from '../components/WipeDataModal';

export const BackupRestoreView: React.FC = () => {
  const {
    settings,
    updateSettings,
    exportAllDataAsJson,
    importAllDataFromJson,
    resetToFactorySettings,
    wipeAllData,
    currentUser,
    users,
    setPin,
  } = useStore();

  const [storeName, setStoreName] = useState(settings.storeName || '');
  const [currency, setCurrency] = useState(settings.currency || 'USD');
  const [taxRate, setTaxRate] = useState<number>(settings.taxRate || 0);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(settings.soundEnabled ?? true);
  const [lowStockAlert, setLowStockAlert] = useState<boolean>(settings.lowStockAlert ?? true);
  const [cloudWebhookUrl, setCloudWebhookUrl] = useState(settings.cloudWebhookUrl || '');
  const [newPin, setNewPinState] = useState('');
  const [showWipeModal, setShowWipeModal] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const isOwner = currentUser.role === 'admin' || currentUser.role === 'manager';

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      storeName: storeName.trim(),
      currency: currency.trim(),
      taxRate: Number(taxRate) || 0,
      soundEnabled,
      lowStockAlert,
      cloudWebhookUrl: cloudWebhookUrl.trim(),
    });
    setFeedbackMsg({ type: 'success', text: 'Store settings saved successfully!' });
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const handleDownloadBackup = () => {
    const dataStr = exportAllDataAsJson();
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `store-ledger-backup-${getTodayDateString()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setFeedbackMsg({ type: 'success', text: 'Backup JSON downloaded successfully.' });
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const jsonStr = event.target?.result as string;
        const res = importAllDataFromJson(jsonStr);
        if (res.success) {
          setFeedbackMsg({ type: 'success', text: 'Store data restored successfully from backup file!' });
        } else {
          setFeedbackMsg({ type: 'error', text: `Import failed: ${res.error}` });
        }
      } catch (err: any) {
        setFeedbackMsg({ type: 'error', text: `Failed to parse backup JSON: ${err.message}` });
      }
      setTimeout(() => setFeedbackMsg(null), 5000);
    };
    reader.readAsText(file);
  };

  const handleChangePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length !== 4 || !/^\d+$/.test(newPin)) {
      setFeedbackMsg({ type: 'error', text: 'PIN must be exactly 4 digits.' });
      return;
    }
    setPin(newPin);
    setFeedbackMsg({ type: 'success', text: 'Manager PIN updated successfully!' });
    setNewPinState('');
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {feedbackMsg && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <span>{feedbackMsg.text}</span>
          <button
            type="button"
            onClick={() => setFeedbackMsg(null)}
            className="font-bold ml-2 cursor-pointer hover:opacity-75"
          >
            &times;
          </button>
        </div>
      )}
      {/* General Store Settings */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
        <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2 mb-4">
          <SettingsIcon className="w-5 h-5 text-teal-600" />
          General Store Configuration
        </h2>

        <form onSubmit={handleSaveSettings} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Store / Business Name</label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="My Store Ledger"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none focus:border-teal-600"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Currency Code / Symbol</label>
              <input
                type="text"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                placeholder="USD, EUR, JOD, SAR..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold focus:outline-none focus:border-teal-600"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Default Sales Tax Rate (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                step="any"
                value={taxRate}
                onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                placeholder="0"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:outline-none focus:border-teal-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <label className="flex items-center gap-2.5 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={soundEnabled}
                onChange={(e) => setSoundEnabled(e.target.checked)}
                className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
              />
              <span>Synthesizer Audio Feedback (Barcode Beep &amp; Register Chime)</span>
            </label>

            <label className="flex items-center gap-2.5 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={lowStockAlert}
                onChange={(e) => setLowStockAlert(e.target.checked)}
                className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
              />
              <span>Show Low Stock Badge Warnings</span>
            </label>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
              Cloud Backup Webhook Endpoint URL (Optional)
            </label>
            <input
              type="url"
              value={cloudWebhookUrl}
              onChange={(e) => setCloudWebhookUrl(e.target.value)}
              placeholder="https://api.example.com/sync-store"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:outline-none focus:border-teal-600"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              If configured, backups and state changes will be posted automatically to your endpoint.
            </p>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              Save Configuration
            </button>
          </div>
        </form>
      </div>

      {/* Backup & Restore Layer */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Export JSON */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2 mb-2">
              <Download className="w-4 h-4 text-teal-600" />
              Export Full JSON Database
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Download all products, sales records, customers, supplier debts, audit logs, and settings in a single
              portable JSON file.
            </p>
          </div>

          <button
            onClick={handleDownloadBackup}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors"
          >
            <Download className="w-4 h-4" />
            Download Complete JSON Backup
          </button>
        </div>

        {/* Import JSON */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2 mb-2">
              <Upload className="w-4 h-4 text-teal-600" />
              Restore / Import JSON Database
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Upload a previously downloaded JSON backup file to instantly populate and restore the full database.
            </p>
          </div>

          <label className="w-full py-2.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-lg text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors">
            <Upload className="w-4 h-4" />
            Select JSON File to Restore
            <input type="file" accept=".json" onChange={handleFileImport} className="hidden" />
          </label>
        </div>
      </div>

      {/* Security & PIN Settings (Owner only) */}
      {isOwner && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
          <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2 mb-3">
            <Key className="w-4 h-4 text-teal-600" />
            Manager PIN Security
          </h3>

          <form onSubmit={handleChangePin} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Set New 4-Digit PIN</label>
              <input
                type="password"
                maxLength={4}
                required
                value={newPin}
                onChange={(e) => setNewPinState(e.target.value)}
                placeholder="e.g. 1234"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold text-center tracking-widest focus:outline-none focus:border-teal-600"
              />
            </div>

            <div>
              <button
                type="submit"
                className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition-colors"
              >
                Update Manager PIN
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Danger Zone: Wipe Store Data & Factory Reset */}
      <div className="bg-rose-50/70 rounded-xl border border-rose-200 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-extrabold text-sm text-rose-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              Wipe Store Data &amp; Reset System
            </h3>
            <p className="text-xs text-rose-700 mt-0.5">
              Permanently wipe transaction history, reset all inventory products, or start fresh with a blank workspace.
            </p>
          </div>

          <button
            onClick={() => setShowWipeModal(true)}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors whitespace-nowrap"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Wipe Store Data...
          </button>
        </div>
      </div>

      <WipeDataModal isOpen={showWipeModal} onClose={() => setShowWipeModal(false)} />
    </div>
  );
};
