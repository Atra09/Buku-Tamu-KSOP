import React, { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

/**
 * Reusable & Lightweight Delete Confirmation Modal Component
 *
 * @param {boolean} isOpen - Kontrol visibilitas modal
 * @param {function} onClose - Callback saat modal ditutup / klik batal / escape
 * @param {function} onConfirm - Callback saat tombol hapus diklik
 * @param {boolean} loading - Status proses penghapusan data
 * @param {string} title - Judul modal (default: "Konfirmasi Hapus Data")
 * @param {string|React.ReactNode} message - Pesan konfirmasi khusus (opsional)
 * @param {string} itemName - Nama data yang akan dihapus (opsional)
 * @param {string} itemCode - Kode / No. Reg data yang akan dihapus (opsional)
 * @param {string} confirmText - Teks tombol konfirmasi (default: "Ya, Hapus")
 * @param {string} cancelText - Teks tombol batal (default: "Batal")
 */
const DeleteModal = ({
  isOpen = false,
  onClose,
  onConfirm,
  loading = false,
  title = 'Konfirmasi Hapus Data',
  message,
  itemName = '',
  itemCode = '',
  confirmText = 'Ya, Hapus',
  cancelText = 'Batal'
}) => {
  // Tutup dengan tombol Escape & kunci scroll body saat modal aktif
  useEffect(() => {
    if (!isOpen) return;

    const handleEsc = (e) => {
      if (e.key === 'Escape' && !loading) {
        onClose?.();
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleEsc);

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, loading, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed -top-10 -bottom-10 -left-10 -right-10 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      {/* Backdrop overlay click */}
      <div
        className="fixed inset-0 -top-10 -bottom-10 -left-10 -right-10"
        onClick={() => !loading && onClose?.()}
      />

      {/* Modal Card */}
      <div className="relative bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-rose-100 text-center space-y-4 z-10">
        {/* Warning Icon Badge */}
        <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
          <AlertTriangle className="w-6 h-6" />
        </div>

        {/* Content Section */}
        <div>
          <h3 className="font-extrabold text-slate-800 text-base">{title}</h3>
          <div className="text-xs font-medium text-slate-500 mt-1">
            {message ? (
              typeof message === 'string' ? <p>{message}</p> : message
            ) : (
              <p>
                Apakah Anda yakin ingin menghapus data tamu{' '}
                {itemName && <strong className="text-slate-800">{itemName}</strong>}
                {itemCode && ` (${itemCode})`}?
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl transition-all cursor-pointer disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2.5 px-4 bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white font-extrabold text-xs rounded-xl transition-all shadow-md shadow-rose-500/20 cursor-pointer disabled:opacity-60"
          >
            {loading ? 'Menghapus...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteModal;
export { DeleteModal };
