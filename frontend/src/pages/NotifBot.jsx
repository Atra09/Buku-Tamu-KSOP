import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  MessageSquare, CheckCircle2, QrCode, LogOut, RefreshCw, 
  Smartphone, ShieldCheck, AlertTriangle, Server, Zap 
} from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import Flash from '../components/flash/flash';

const NotifBot = () => {
  const [botStatus, setBotStatus] = useState({
    isConnected: false,
    isInitializing: false,
    qr: null,
    connectedUser: { phone: null, name: null }
  });
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchBotStatus = async () => {
    try {
      const res = await axios.get('/api/wa-bot/status');
      if (res.data?.success) {
        setBotStatus({
          isConnected: res.data.isConnected,
          isInitializing: res.data.isInitializing,
          qr: res.data.qr,
          connectedUser: res.data.connectedUser || { phone: null, name: null }
        });
      }
    } catch (err) {
      console.error('Error fetching WA Bot status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBotStatus();
    const interval = setInterval(fetchBotStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      const res = await axios.post('/api/wa-bot/disconnect');
      if (res.data?.success) {
        showToast('Koneksi WhatsApp Bot berhasil diputuskan.', 'success');
        setShowConfirmModal(false);
        fetchBotStatus();
      } else {
        showToast('Gagal memutuskan koneksi bot', 'error');
      }
    } catch (err) {
      console.error('Error disconnecting WA Bot:', err);
      showToast('Terjadi kesalahan saat memutuskan koneksi bot', 'error');
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <AdminLayout
      title="Kelola Akun WhatsApp"
      subtitle="Integrasi pengiriman pesan otomatis presensi tamu via Local WA Bot (Baileys)"
    >
      <div className="space-y-6 pb-12">
        {toast && <Flash message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-sky-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Manajemen WA Bot Notifikasi</h1>
              <p className="text-xs text-slate-500">Integrasi pengiriman pesan otomatis presensi tamu via Local WA Bot (Baileys)</p>
            </div>
          </div>

          <button
            onClick={fetchBotStatus}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Status
          </button>
        </div>

        {/* Main Content Area */}
        {loading && !botStatus.isConnected && !botStatus.qr ? (
          <div className="bg-white p-12 rounded-2xl border border-sky-100 shadow-sm text-center">
            <RefreshCw className="w-8 h-8 text-sky-500 animate-spin mx-auto mb-3" />
            <p className="text-slate-600 text-sm font-medium">Memuat status koneksi WhatsApp Bot...</p>
          </div>
        ) : botStatus.isConnected ? (
          /* State 1: Connected */
          <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm overflow-hidden">
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
                onClick={() => setShowConfirmModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-rose-600 bg-white hover:bg-rose-50 rounded-xl shadow-sm transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                Putuskan Koneksi
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl">
                  <span className="text-xs font-medium text-emerald-700">Nomor WA Bot</span>
                  <p className="text-lg font-bold text-slate-800">
                    {botStatus.connectedUser.phone ? `+${botStatus.connectedUser.phone}` : '-'}
                  </p>
                </div>

                <div className="p-4 bg-sky-50/50 border border-sky-100 rounded-xl">
                  <span className="text-xs font-medium text-sky-700">Nama Akun WhatsApp</span>
                  <p className="text-lg font-bold text-slate-800">
                    {botStatus.connectedUser.name || 'KSOP Local WA Bot'}
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
        ) : (
          /* State 2: QR Code Scan */
          <div className="bg-white rounded-2xl border border-sky-100 shadow-sm p-6 md:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              
              {/* QR Container */}
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

              {/* Instructions */}
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
        )}

        {/* Modal Confirm Disconnect */}
        {showConfirmModal && (
          <div className="fixed -top-10 -bottom-10 -left-10 -right-10 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-3 sm:p-4">
            <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6 shadow-xl border border-slate-100 space-y-4">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-5 h-5" />
              </div>

              <div className="text-center">
                <h3 className="text-base font-bold text-slate-800">Putuskan Koneksi WA Bot?</h3>
                <p className="text-xs text-slate-500 mt-1">Sesi WhatsApp Bot akan dikeluarkan. Anda perlu scan QR Code baru jika ingin menghubungkannya lagi.</p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  disabled={disconnecting}
                  className="flex-1 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleDisconnect}
                  disabled={disconnecting}
                  className="flex-1 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm inline-flex items-center justify-center gap-2 cursor-pointer"
                >
                  {disconnecting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Ya, Putuskan'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default NotifBot;
