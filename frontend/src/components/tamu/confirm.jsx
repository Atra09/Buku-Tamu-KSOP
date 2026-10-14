import React, { useEffect, memo } from 'react';
import { CheckCircle2, RotateCcw } from 'lucide-react';

/**
 * Ultra-Lightweight Status Confirmation Modal Component
 * Didesain tanpa menyimpan objek data tamu utuh agar performa tetap maksimal dan hemat memori.
 *
 * @param {boolean} isOpen - Kontrol visibilitas modal
 * @param {string} currentStatus - Status kunjungan saat ini ('Berkunjung' | 'Selesai')
 * @param {function} onClose - Callback tutup / batal
 * @param {function} onConfirm - Callback konfirmasi aksi ubah status
 * @param {boolean} loading - Status sedang memproses request ke server
 */
const StatusConfirmModal = memo(({
  isOpen = false,
  currentStatus = 'Berkunjung',
  onClose,
  onConfirm,
  loading = false
}) => {
  // Tutup dengan Escape & kunci scroll body saat modal terbuka
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

  const isFinishing = currentStatus === 'Berkunjung';

  return (
    <div className="fixed -top-32 -bottom-32 -left-32 -right-32 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 -top-32 -bottom-32 -left-32 -right-32"
        onClick={() => !loading && onClose?.()}
      />

      {/* Modal Dialog Card */}
      <div className="relative bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 text-center space-y-4 z-10 transition-transform duration-150">
        {/* Dynamic Icon Badge */}
        <div
          className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto shadow-inner transition-colors ${
            isFinishing
              ? 'bg-emerald-100 text-emerald-600 border border-emerald-200'
              : 'bg-amber-100 text-amber-600 border border-amber-200'
          }`}
        >
          {isFinishing ? (
            <CheckCircle2 className="w-7 h-7" />
          ) : (
            <RotateCcw className="w-7 h-7" />
          )}
        </div>

        {/* Content Section */}
        <div className="space-y-1.5">
          <h3 className="font-extrabold text-slate-800 text-base">
            {isFinishing ? 'Konfirmasi Selesai Berkunjung' : 'Konfirmasi Berkunjung Kembali'}
          </h3>
          <p className="text-xs font-medium text-slate-600 leading-relaxed px-2">
            {isFinishing
              ? 'Apakah anda ingin mengubah data ini berstatus selesai berkunjung?'
              : 'Apakah anda ingin mengubah data berstatus selesai menjadi berkunjung kembali?'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl transition-all cursor-pointer disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 py-2.5 px-4 text-white font-extrabold text-xs rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-60 flex items-center justify-center gap-1.5 ${
              isFinishing
                ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                : 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20'
            }`}
          >
            {loading ? (
              'Memproses...'
            ) : isFinishing ? (
              'Ya, Selesai'
            ) : (
              'Ya, Berkunjung'
            )}
          </button>
        </div>
      </div>
    </div>
  );
});

StatusConfirmModal.displayName = 'StatusConfirmModal';

export default StatusConfirmModal;
