import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Database, Copy, Check, Sparkles, Upload } from 'lucide-react';

export const MigrationView: React.FC = () => {
  const { importAllDataFromJson } = useStore();
  const [copied, setCopied] = useState(false);
  const [pastedJson, setPastedJson] = useState('');
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const snippetCode = `// 1. Open your old HTML site in browser
// 2. Press F12 or Right Click -> Inspect -> Console
// 3. Paste this code and press Enter:
(function() {
  const data = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    try {
      data[key] = JSON.parse(localStorage.getItem(key));
    } catch(e) {
      data[key] = localStorage.getItem(key);
    }
  }
  const jsonStr = JSON.stringify(data, null, 2);
  console.log("=== COPY DATA BELOW ===");
  console.log(jsonStr);
  copy(jsonStr);
  alert("Old store data copied to clipboard! Paste it into the new app's Migration tab.");
})();`;

  const handleCopySnippet = () => {
    navigator.clipboard.writeText(snippetCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleProcessImport = () => {
    if (!pastedJson.trim()) return alert('Please paste the exported JSON string first.');
    const res = importAllDataFromJson(pastedJson);
    if (res.success) {
      setImportStatus('✅ Migration successfully imported! All tables and history are live.');
      setPastedJson('');
    } else {
      setImportStatus(`❌ Migration failed: ${res.error}`);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
        <div className="flex items-center gap-2 mb-2">
          <Database className="w-5 h-5 text-teal-600" />
          <h2 className="text-base font-extrabold text-slate-900">One-Click Old HTML Site Migration Assistant</h2>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          Easily extract all data from your old HTML website's localStorage and import it directly into this new React
          Ledger &amp; POS App.
        </p>

        {/* Step 1: Console Snippet */}
        <div className="p-4 bg-slate-900 text-slate-100 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-teal-400">Step 1: Run Extraction Script in Old Site</span>
            <button
              onClick={handleCopySnippet}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied to Clipboard!' : 'Copy Script'}
            </button>
          </div>
          <pre className="text-[11px] font-mono overflow-x-auto text-slate-300 bg-slate-950 p-3 rounded-lg border border-slate-800">
            {snippetCode}
          </pre>
        </div>

        {/* Step 2: Paste & Import */}
        <div className="mt-6 space-y-3">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
            Step 2: Paste Extracted JSON &amp; Import
          </h3>
          <textarea
            rows={8}
            value={pastedJson}
            onChange={(e) => setPastedJson(e.target.value)}
            placeholder="Paste the JSON output copied from the old site console here..."
            className="w-full p-3 border border-slate-300 rounded-xl text-xs font-mono focus:outline-none focus:border-teal-600"
          />

          {importStatus && (
            <div
              className={`p-3 rounded-lg text-xs font-bold ${
                importStatus.startsWith('✅') ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
              }`}
            >
              {importStatus}
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={handleProcessImport}
              className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-xs transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              Migrate &amp; Convert Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
