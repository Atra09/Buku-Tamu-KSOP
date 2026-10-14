import React, { memo } from 'react';
import { AlertTriangle, RefreshCw, LogOut } from 'lucide-react';
import Modal from '../modal/Modal';

/**
 * Reusable & Lightweight Modal Konfirmasi Putus Koneksi WA Bot
 */
const WaDisconnectModal = memo(({
  isOpen = false,
  onClose,
  onConfirm,
  disconnecting = false
}) => {
  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
    >
      <div className="space-y-4 text-center">
        <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>

        <div>
          <h3 className="text-base font-bold text-slate-800">Putuskan Koneksi WA Bot?</h3>
          <p className="text-xs text-slate-500 mt-1">
            Sesi WhatsApp Bot akan dikeluarkan. Anda perlu scan QR Code baru jika ingin menghubungkannya lagi.
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={disconnecting}
            className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={disconnecting}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all disabled:opacity-50 cursor-pointer shadow-sm"
          >
            {disconnecting ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <LogOut className="w-3.5 h-3.5" />
            )}
            {disconnecting ? 'Memproses...' : 'Ya, Putuskan'}
          </button>
        </div>
      </div>
    </Modal>
  );
});

WaDisconnectModal.displayName = 'WaDisconnectModal';

export default WaDisconnectModal;
