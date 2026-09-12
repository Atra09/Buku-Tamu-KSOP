import React from 'react';
import { Bot, AlertTriangle, X } from 'lucide-react';

/**
 * Modal Pop-up khusus kasus WA Bot Belum Terhubung saat Submit Tamu
 * @param {Object} props
 * @param {boolean} props.isOpen - Status modal terbuka
 * @param {string} props.message - Pesan notifikasi ("bot belum terhubung, silahkan hubungi admin !!")
 * @param {Function} props.onClose - Function untuk menutup modal pop-up
 */
const NotifPopup = ({ isOpen, message, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed -top-10 -bottom-10 -left-10 -right-10 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn select-none">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-rose-100 text-center space-y-5 transform transition-all animate-scaleUp">
        
        {/* Header Icon Badge */}
        <div className="relative w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200/80 text-rose-600 flex items-center justify-center mx-auto shadow-sm">
          <Bot className="w-8 h-8 text-rose-600" />
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500 flex items-center justify-center text-[9px] text-white font-bold">!</span>
          </span>
        </div>

        {/* Text Content */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-rose-100/70 text-rose-700 border border-rose-200">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>KONEKSI BOT PUTUS</span>
          </div>
          <h3 className="text-lg font-extrabold text-slate-800 tracking-tight leading-snug">
            {message || 'bot belum terhubung, silahkan hubungi admin !!'}
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Data registrasi kunjungan <strong>tidak tersimpan</strong> karena layanan notifikasi WhatsApp pengirim sedang tidak aktif. Silakan hubungi petugas admin untuk menyambungkan bot.
          </p>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-md shadow-rose-600/20 active:scale-[0.98] transition-all cursor-pointer"
          >
            Mengerti &amp; Tutup
          </button>
        </div>

      </div>
    </div>
  );
};

export default NotifPopup;
