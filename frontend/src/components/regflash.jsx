import React, { useEffect } from 'react';
import { Clock, ShieldAlert, AlertTriangle, CheckCircle2, X } from 'lucide-react';

/**
 * RegFlash - Modal Pop-up Pusat Notifikasi Registrasi Tamu
 * Responsif & Mobile-Friendly untuk instruksi awal durasi registrasi (10 menit)
 * serta penanganan tiket kedaluwarsa / tiket tidak valid.
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Status pop-up tampil
 * @param {Function} props.onClose - Callback saat tombol tutup / mulai diklik
 * @param {Function} [props.onAction] - Custom action callback saat tombol utama diklik
 * @param {'info' | 'error' | 'warning' | 'success'} [props.type='info'] - Jenis notifikasi
 * @param {boolean} [props.isClosable] - Jika false, modal terkunci (tidak ada tombol X, backdrop klik mati, tombol aksi disembunyikan)
 * @param {string} [props.title] - Judul modal
 * @param {string} [props.message] - Pesan utama
 * @param {string} [props.subMessage] - Keterangan tambahan di bawah pesan utama
 * @param {string} [props.badgeText] - Teks badge kecil di atas judul
 * @param {string} [props.buttonText] - Label tombol aksi
 */
const RegFlash = ({
  isOpen,
  onClose,
  onAction,
  type = 'info',
  isClosable,
  title,
  message,
  subMessage,
  badgeText,
  buttonText
}) => {
  // Modal terkunci secara otomatis jika type === 'error' atau type === 'success' (tiket selesai digunakan atau dibatalkan/kedaluwarsa).
  // Hanya mode 'info' (panduan awal) yang dapat ditutup, kecuali ditentukan secara eksplisit via prop isClosable.
  const canClose = isClosable !== undefined ? isClosable : type === 'info';

  // Prevent background scroll saat modal aktif
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Konfigurasi tema visual berdasarkan type
  const config = {
    info: {
      border: 'border-sky-200',
      iconBg: 'bg-sky-50 text-sky-600 border-sky-200',
      badgeBg: 'bg-sky-100 text-sky-800 border-sky-200',
      badgeLabel: badgeText || 'PANDUAN REGISTRASI',
      badgeIcon: <Clock className="w-3.5 h-3.5 text-sky-600" />,
      defaultTitle: title || 'Perhatian Waktu Registrasi',
      defaultMessage: message || 'Silahkan Lakukan registrasi dengan durasi waktu Maksimal 10 menit',
      buttonBg: 'bg-gradient-to-r from-sky-500 via-sky-600 to-blue-600 hover:from-sky-600 hover:to-blue-700 shadow-sky-600/25',
      defaultButtonText: buttonText || 'Mulai Registrasi Tamu',
      icon: <Clock className="w-7 h-7 sm:w-8 sm:h-8 text-sky-600" />
    },
    error: {
      border: 'border-rose-200',
      iconBg: 'bg-rose-50 text-rose-600 border-rose-200',
      badgeBg: 'bg-rose-100 text-rose-800 border-rose-200',
      badgeLabel: badgeText || 'TIKET KEDALUWARSA / TIDAK VALID',
      badgeIcon: <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />,
      defaultTitle: title || 'Tiket Barcode Tidak Berlaku / Sesi Berakhir',
      defaultMessage: message || 'Masa berlaku tiket barcode telah habis atau sudah pernah digunakan.',
      buttonBg: 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/25',
      defaultButtonText: buttonText || 'Tutup',
      icon: <ShieldAlert className="w-7 h-7 sm:w-8 sm:h-8 text-rose-600" />
    },
    warning: {
      border: 'border-amber-200',
      iconBg: 'bg-amber-50 text-amber-600 border-amber-200',
      badgeBg: 'bg-amber-100 text-amber-800 border-amber-200',
      badgeLabel: badgeText || 'PERINGATAN WAKTU',
      badgeIcon: <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />,
      defaultTitle: title || 'Perhatian Registrasi',
      defaultMessage: message || 'Harap segera lengkapi formulir pendaftaran sebelum batas waktu berakhir.',
      buttonBg: 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/25',
      defaultButtonText: buttonText || 'Lanjutkan Mengisi',
      icon: <AlertTriangle className="w-7 h-7 sm:w-8 sm:h-8 text-amber-600" />
    },
    success: {
      border: 'border-emerald-200',
      iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-200',
      badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      badgeLabel: badgeText || 'BERHASIL DISIMPAN',
      badgeIcon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />,
      defaultTitle: title || 'Pendaftaran Berhasil',
      defaultMessage: message || 'Data registrasi tamu Anda telah berhasil dicatat.',
      buttonBg: 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/25',
      defaultButtonText: buttonText || 'Selesai',
      icon: <CheckCircle2 className="w-7 h-7 sm:w-8 sm:h-8 text-emerald-600" />
    }
  }[type] || {};

  const handleAction = () => {
    if (onAction) {
      onAction();
    } else if (canClose) {
      onClose && onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3.5 sm:p-4 bg-slate-950/75 backdrop-blur-xs select-none animate-fadeIn">
      {/* Backdrop: Hanya bisa ditutup klik luar jika canClose === true */}
      <div
        className="absolute inset-0"
        onClick={canClose ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div
        role="dialog"
        aria-modal="true"
        className={`relative z-10 bg-white rounded-3xl max-w-[92vw] sm:max-w-md w-full p-5 sm:p-7 shadow-2xl border ${config.border} text-center space-y-4 sm:space-y-5 transform transition-all animate-scaleUp`}
      >
        {/* Close Icon Button (Top Right) - Hanya dirender jika canClose bernilai true */}
        {canClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup notifikasi"
            className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Floating Icon Header */}
        <div className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border ${config.iconBg} flex items-center justify-center mx-auto shadow-sm`}>
          {config.icon}
          {type === 'info' && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-sky-500 text-[9px] text-white font-bold items-center justify-center">i</span>
            </span>
          )}
          {type === 'error' && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500 text-[9px] text-white font-bold items-center justify-center">!</span>
            </span>
          )}
        </div>

        {/* Content Section */}
        <div className="space-y-2">
          {/* Badge Label */}
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-black border ${config.badgeBg}`}>
            {config.badgeIcon}
            <span className="uppercase tracking-wider">{config.badgeLabel}</span>
          </div>

          {/* Title */}
          <h3 className="text-base sm:text-lg font-black text-slate-800 tracking-tight leading-snug pt-1">
            {config.defaultTitle}
          </h3>

          {/* Message */}
          <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed px-1">
            {config.defaultMessage}
          </p>

          {/* SubMessage Optional */}
          {subMessage && (
            <p className="text-[11px] sm:text-xs text-slate-500 bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 mt-2 leading-relaxed">
              {subMessage}
            </p>
          )}
        </div>

        {/* Action Button - Hanya dirender jika canClose bernilai true (disembunyikan saat modal terkunci) */}
        {canClose && (
          <div className="pt-2">
            <button
              type="button"
              onClick={handleAction}
              className={`w-full py-3 sm:py-3.5 text-xs sm:text-sm font-black text-white rounded-xl shadow-md ${config.buttonBg} active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2`}
            >
              <span>{config.defaultButtonText}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RegFlash;
