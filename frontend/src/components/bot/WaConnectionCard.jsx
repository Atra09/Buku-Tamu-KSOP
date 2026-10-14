import React, { memo } from 'react';
import {
  CheckCircle2, LogOut, Server, QrCode, RefreshCw, AlertTriangle
} from 'lucide-react';

/**
 * Reusable & Lightweight Card untuk Status Koneksi WA Bot (Terhubung / QR Code Scan)
 * Dibungkus dengan React.memo agar render efisien.
 */
const WaConnectionCard = memo(({
  loading = false,
  botStatus = { isConnected: false, isInitializing: false, qr: null, connectedUser: { phone: null, name: null } },
  onRequestDisconnect
}) => {
  if (loading && !botStatus.isConnected && !botStatus.qr) {
    return (
      <div className="bg-white p-12 rounded-2xl border border-sky-100 shadow-sm text-center">
        <RefreshCw className="w-8 h-8 text-sky-500 animate-spin mx-auto mb-3" />
        <p className="text-slate-600 text-sm font-medium">Memuat status koneksi WhatsApp Bot...</p>
      </div>
    );
  }

  if (botStatus.isConnected) {
    return (
      <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm overflow-hidden">
        {/* Banner Hijau Terhubung */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl">
              <CheckCircle2 className="w-8 h-8 text-white" />
            </div>
            <div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-400/30 text-white border border-white/20">
                🟢 Status: TERHUBUNG
              </span>
              <h2 className="text-xl font-bold mt-1">Bot Notifikasi WhatsApp Aktif</h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onRequestDisconnect}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-rose-600 bg-white hover:bg-rose-50 rounded-xl shadow-sm transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Putuskan Koneksi
          </button>
        </div>

        {/* Info Grid Akun WA */}
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl">
              <span className="text-xs font-medium text-emerald-700">Nomor WA Bot</span>
              <p className="text-lg font-bold text-slate-800">
                {botStatus.connectedUser?.phone ? `+${botStatus.connectedUser.phone}` : '-'}
              </p>
            </div>

            <div className="p-4 bg-sky-50/50 border border-sky-100 rounded-xl">
              <span className="text-xs font-medium text-sky-700">Nama Akun WhatsApp</span>
              <p className="text-lg font-bold text-slate-800">
                {botStatus.connectedUser?.name || 'KSOP Local WA Bot'}
              </p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-xs font-medium text-slate-500">Tipe Service Backend</span>
              <p className="text-sm font-bold text-slate-800 flex items-center gap-1.5 mt-1">
                <Server className="w-4 h-4 text-emerald-600" />
                Local Baileys
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // State: Belum Terhubung (QR Code Scan)
  return (
    <div className="bg-white rounded-2xl border border-sky-100 shadow-sm p-6 md:p-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Kolom Kiri: Box QR Code */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center p-6 bg-slate-50 border border-slate-200 rounded-2xl">
          <div className="flex items-center gap-2 mb-3 text-slate-700 font-semibold text-xs">
            <QrCode className="w-4 h-4 text-emerald-600" />
            Scan QR Code Di Bawah Ini
          </div>

          <div className="p-3 bg-white rounded-2xl shadow-md border border-slate-200">
            {botStatus.qr ? (
              <img src={botStatus.qr} alt="WhatsApp Bot QR Code" className="w-56 h-56 object-contain rounded-lg" />
            ) : (
              <div className="w-56 h-56 flex flex-col items-center justify-center text-center p-4 bg-slate-50 rounded-lg">
                <RefreshCw className="w-7 h-7 text-sky-500 animate-spin mb-2" />
                <p className="text-xs text-slate-500 font-medium">Menyiapkan QR Code...</p>
              </div>
            )}
          </div>

          <div className="mt-3 flex items-center gap-2 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            Auto-refresh status setiap 3 detik
          </div>
        </div>

        {/* Kolom Kanan: Panduan & Info */}
        <div className="lg:col-span-7 space-y-4">
          <div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-600 border border-rose-200 inline-block mb-2">
              🔴 Status: Belum Terhubung
            </span>
            <h2 className="text-xl font-bold text-slate-800">Sambungkan WhatsApp Bot Pengirim</h2>
            <p className="text-xs text-slate-500 mt-0.5">Pindai QR Code untuk mengaktifkan notifikasi kedatangan tamu otomatis.</p>
          </div>

          <div className="space-y-3 bg-sky-50/50 p-4 rounded-2xl border border-sky-100 text-xs text-slate-700">
            <h3 className="font-bold text-slate-800">Langkah-Langkah Penyambungan:</h3>
            <ol className="space-y-2">
              <li className="flex items-start gap-2">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-sky-600 text-white font-bold text-[10px] shrink-0 mt-0.5">1</span>
                <span>Buka aplikasi <strong>WhatsApp</strong> di HP pengirim.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-sky-600 text-white font-bold text-[10px] shrink-0 mt-0.5">2</span>
                <span>Ketuk <strong>Titik Tiga (⋮)</strong> / <strong>Pengaturan</strong> -&gt; <strong>Perangkat Tertaut</strong>.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-sky-600 text-white font-bold text-[10px] shrink-0 mt-0.5">3</span>
                <span>Tekan <strong>Tautkan Perangkat</strong> dan arahkan kamera HP ke <strong>QR Code</strong> di samping.</span>
              </li>
            </ol>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800">
              Setelah QR Code berhasil di-scan, halaman ini akan otomatis berubah menjadi status <strong>Terhubung</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});

WaConnectionCard.displayName = 'WaConnectionCard';

export default WaConnectionCard;
