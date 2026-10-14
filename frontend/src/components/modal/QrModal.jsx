import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { 
  RefreshCw, 
  X, 
  Maximize2, 
  Minimize2, 
  Copy, 
  Check, 
  Clock, 
  CalendarDays,
  ChevronDown,
  Info
} from 'lucide-react';
import { createPortal } from 'react-dom';
import { getStoredToken } from '../../utils/session';

// Helper waktu di luar komponen agar tidak direalokasi setiap detik
const formatTimer = (secs) => {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
};

const QrModal = ({ isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [qrData, setQrData] = useState(null);
  const [timeLeft, setTimeLeft] = useState(600);
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [error, setError] = useState(null);
  const modalRef = useRef(null);
  const timerRef = useRef(null);

  // Ambil token barcode dinamis (bisa gunakan sesi aktif yang ada atau paksa baru)
  const fetchToken = useCallback(async (force = false) => {
    setLoading(true);
    setError(null);
    try {
      const token = getStoredToken();
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const res = await axios.get('/api/qr/generate', {
        params: {
          ...(force ? { force: 'true' } : {}),
          origin
        },
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      if (res.data?.success) {
        setQrData(res.data.data);
        const secs = res.data.data.remaining_seconds !== undefined
          ? res.data.data.remaining_seconds
          : (res.data.data.duration_seconds || 600);
        setTimeLeft(secs);
      } else {
        setError(res.data?.message || 'Gagal memuat token barcode.');
      }
    } catch (err) {
      console.error('Error fetching dynamic QR:', err);
      setError(err.response?.data?.message || 'Gagal terhubung ke server untuk membuat barcode.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Manajemen buka/tutup modal & scroll lock
  useEffect(() => {
    if (!isOpen) {
      if (timerRef.current) clearInterval(timerRef.current);
      setError(null);
      setShowDetails(false);
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
      return;
    }

    // Modal dibuka: gunakan sesi aktif yang masih berlaku (force = false)
    fetchToken(false);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, fetchToken]);

  // Countdown timer & auto-refresh saat waktu habis
  useEffect(() => {
    if (!isOpen || !qrData) return;

    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          fetchToken(true);
          return 600;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, qrData?.token, fetchToken]);

  // Listener fullscreen
  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!modalRef.current) return;
    if (!document.fullscreenElement) {
      modalRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  const handleCopyLink = useCallback(() => {
    const fullUrl = qrData?.registration_url || (qrData?.registration_path ? `${window.location.origin}${qrData.registration_path}` : '');
    if (!fullUrl) return;
    navigator.clipboard.writeText(fullUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [qrData?.registration_url, qrData?.registration_path]);

  // Early return jika modal tidak aktif
  if (!isOpen) return null;

  const totalSecs = qrData?.duration_seconds || 600;
  const progressPercent = Math.max(0, Math.min(100, (timeLeft / totalSecs) * 100));

  const modalContent = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      {/* Backdrop overlay */}
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      <div
        ref={modalRef}
        className={`relative w-full max-w-[94vw] sm:max-w-[420px] bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-sky-100 overflow-hidden flex flex-col transition-all duration-300 z-10 ${
          isFullscreen ? 'max-w-none h-screen rounded-none justify-center items-center p-6 sm:p-8 bg-gradient-to-b from-sky-50 via-white to-sky-100' : ''
        }`}
      >
        {/* Header Bar */}
        <div className={`flex items-center justify-between px-4 sm:px-5 py-3 sm:py-3.5 bg-gradient-to-r from-sky-500 via-sky-600 to-blue-600 text-white shrink-0 ${isFullscreen ? 'w-full max-w-md rounded-2xl mb-4 shadow-lg' : ''}`}>
          <div className="pr-2">
            <h3 className="text-sm sm:text-base font-extrabold tracking-tight text-white leading-tight">
              Barcode Registrasi Tamu
            </h3>
            <p className="text-[10px] sm:text-[11px] text-sky-100/90 font-medium leading-tight mt-0.5">
              Pindai untuk pendaftaran mandiri
            </p>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Keluar Layar Penuh' : 'Mode Layar Penuh'}
              className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl text-sky-100 hover:text-white hover:bg-white/20 transition-all cursor-pointer"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              title="Tutup Modal"
              className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl text-sky-100 hover:text-white hover:bg-rose-500/40 transition-all cursor-pointer"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className={`p-4 sm:p-5 flex flex-col items-center text-center ${isFullscreen ? 'w-full max-w-md bg-white rounded-3xl shadow-2xl border border-sky-100 p-6 sm:p-8' : ''}`}>
          {/* QR Code Container */}
          <div className="relative p-2.5 sm:p-3 bg-white rounded-2xl border border-sky-100 shadow-xs">
            {loading ? (
              <div className="w-56 h-56 sm:w-64 sm:h-64 flex flex-col items-center justify-center gap-2.5 bg-slate-50/60 rounded-xl">
                <RefreshCw className="w-7 h-7 text-sky-600 animate-spin" />
                <span className="text-xs font-bold text-slate-500">Menghasilkan Barcode Baru...</span>
              </div>
            ) : error ? (
              <div className="w-56 h-56 sm:w-64 sm:h-64 flex flex-col items-center justify-center p-4 bg-rose-50/60 rounded-xl text-rose-600 gap-2">
                <p className="text-xs font-bold">{error}</p>
                <button
                  type="button"
                  onClick={fetchToken}
                  className="mt-2 px-3 py-1.5 bg-rose-600 text-white text-xs font-bold rounded-xl shadow-xs hover:bg-rose-700 transition cursor-pointer"
                >
                  Coba Lagi
                </button>
              </div>
            ) : qrData?.qr_image ? (
              <img
                src={qrData.qr_image}
                alt="Dynamic QR Code Registrasi Tamu"
                className="w-56 h-56 sm:w-64 sm:h-64 object-contain rounded-xl"
              />
            ) : null}
          </div>

          {/* Realtime Countdown Progress Bar */}
          <div className="w-full mt-3.5 sm:mt-4">
            <div className="flex items-center justify-between text-[11px] sm:text-xs font-extrabold text-slate-600 mb-1.5 px-0.5">
              <span className="flex items-center gap-1.5 text-slate-500">
                <Clock className="w-3.5 h-3.5 text-sky-600" />
                Masa Berlaku Barcode:
              </span>
              <span className={`font-mono text-xs sm:text-sm font-black ${timeLeft <= 60 ? 'text-rose-600 animate-pulse' : 'text-sky-700'}`}>
                {formatTimer(timeLeft)}
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/80 shadow-inner">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${
                  timeLeft <= 60
                    ? 'bg-rose-500'
                    : timeLeft <= 180
                    ? 'bg-amber-500'
                    : 'bg-gradient-to-r from-sky-400 via-sky-500 to-blue-600'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Collapsible Accordion Toggle for Officer Info */}
          <div className="w-full mt-3 text-left">
            <button
              type="button"
              onClick={() => setShowDetails(!showDetails)}
              className="w-full flex items-center justify-between py-2 px-3 bg-sky-50/70 hover:bg-sky-100/70 border border-sky-200/60 rounded-xl text-[11px] font-extrabold text-sky-950 transition-all cursor-pointer shadow-2xs group"
            >
              <span className="flex items-center gap-1.5 text-sky-900">
                <Info className="w-3.5 h-3.5 text-sky-600 group-hover:scale-110 transition-transform" />
                <span>Informasi Lanjutan</span>
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-sky-600 transition-transform duration-300 ${
                  showDetails ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Collapsible Content */}
            {showDetails && (
              <div className="mt-2 space-y-2 animate-fadeIn">
                {qrData && (
                  <div className="w-full flex items-center justify-between bg-white border border-sky-200/80 rounded-xl px-3.5 py-2 shadow-xs">
                    <div className="flex items-center gap-2 text-left">
                      <CalendarDays className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                      <div>
                        <span className="text-[9px] font-extrabold uppercase tracking-wider text-sky-700 block">
                          Jadwal Piket Hari Ini
                        </span>
                        <span className="text-[11px] font-black text-slate-800">
                          {qrData.hari} &bull; {qrData.shift}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block">
                        Petugas Bertugas
                      </span>
                      <span className="text-[11px] font-black text-sky-900">
                        {qrData.pos_info?.petugas_nama || 'Petugas KSOP'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Actions: Refresh & Copy Link */}
          <div className="w-full grid grid-cols-2 gap-2 mt-3.5 sm:mt-4">
            <button
              type="button"
              onClick={() => fetchToken(true)}
              disabled={loading}
              className="flex items-center justify-center gap-1.5 py-2 px-3 bg-sky-50 hover:bg-sky-100 text-sky-800 text-[11px] sm:text-xs font-extrabold rounded-xl border border-sky-200 transition shadow-xs cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Perbarui Barcode
            </button>
            <button
              type="button"
              onClick={handleCopyLink}
              disabled={!qrData}
              className="flex items-center justify-center gap-1.5 py-2 px-3 bg-sky-500 hover:bg-sky-600 text-white text-[11px] sm:text-xs font-extrabold rounded-xl transition shadow-xs shadow-sky-500/20 cursor-pointer disabled:opacity-50"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-200" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Tersalin!' : 'Salin Tautan'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};

export default QrModal;
