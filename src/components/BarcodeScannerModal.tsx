import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, AlertCircle } from 'lucide-react';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDetected: (barcode: string) => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({ isOpen, onClose, onDetected }) => {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const qrRegionId = 'qr-reader-region';

  useEffect(() => {
    if (!isOpen) {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {}).then(() => {
          scannerRef.current = null;
        });
      }
      return;
    }

    setErrorMsg(null);
    const html5QrCode = new Html5Qrcode(qrRegionId);
    scannerRef.current = html5QrCode;

    html5QrCode
      .start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 180 },
        },
        (decodedText) => {
          onDetected(decodedText);
          onClose();
        },
        () => {
          // ignore transient scan frame misses
        }
      )
      .catch((err) => {
        console.error('Camera scan error:', err);
        setErrorMsg('Camera access was denied or no camera device was found. You can still scan or type barcodes using the text input.');
      });

    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {}).then(() => {
          scannerRef.current = null;
        });
      }
    };
  }, [isOpen, onDetected, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-slate-100 overflow-hidden text-center">
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-left">
            <Camera className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-sm text-white">Scan Barcode / QR</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          {errorMsg ? (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-start gap-2 text-left">
              <AlertCircle className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          ) : (
            <div className="space-y-2">
              <div
                id={qrRegionId}
                className="w-full min-h-[220px] bg-slate-950 rounded-xl overflow-hidden shadow-inner border border-slate-800"
              />
              <p className="text-[11px] text-slate-500 font-medium">
                Hold product barcode or QR code steadily in front of the camera lens.
              </p>
            </div>
          )}

          <div className="pt-2">
            <button
              onClick={onClose}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
            >
              Cancel Scan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
