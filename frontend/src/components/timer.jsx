import React, { useState, useEffect, useRef, memo } from 'react';

// Konfigurasi tema statis di luar komponen untuk mencegah alokasi memori berulang
const THEMES = {
  safe: {
    container: 'bg-white/95 text-sky-950 border-sky-200/90 shadow-sky-900/5',
    dotPing: 'bg-sky-400',
    dotBase: 'bg-sky-500',
    progressBar: 'bg-gradient-to-r from-sky-400 to-blue-600',
    badgeText: 'text-sky-700',
    timeText: 'text-sky-950'
  },
  warning: {
    container: 'bg-amber-50/95 text-amber-950 border-amber-300 shadow-amber-500/10',
    dotPing: 'bg-amber-400',
    dotBase: 'bg-amber-500',
    progressBar: 'bg-gradient-to-r from-amber-400 to-orange-500',
    badgeText: 'text-amber-700',
    timeText: 'text-amber-950'
  },
  critical: {
    container: 'bg-rose-50/95 text-rose-950 border-rose-300 shadow-rose-500/15 animate-pulse',
    dotPing: 'bg-rose-500',
    dotBase: 'bg-rose-600',
    progressBar: 'bg-gradient-to-r from-rose-500 to-red-600',
    badgeText: 'text-rose-700',
    timeText: 'text-rose-950'
  },
  expired: {
    container: 'bg-slate-100 text-slate-500 border-slate-300 opacity-90',
    dotPing: 'bg-slate-300',
    dotBase: 'bg-slate-400',
    progressBar: 'bg-slate-300',
    badgeText: 'text-slate-500',
    timeText: 'text-slate-600'
  }
};

/**
 * Komponen Timer QR Barcode KSOP Si-Tamu (Ultra Lightweight & Responsive)
 *
 * Menggunakan static theme lookup, single consolidated JSX return,
 * kalkulasi selisih waktu nyata absolut, dan React.memo untuk efisiensi render maksimum.
 */
const Timer = ({
  expiresAt,
  onExpire,
  isCompact = false,
  className = ''
}) => {
  // Hitung sisa detik berbasis selisih waktu nyata absolut
  const calcSeconds = () => {
    if (!expiresAt) return 600;
    const target = new Date(expiresAt).getTime();
    return isNaN(target) ? 600 : Math.max(0, Math.floor((target - Date.now()) / 1000));
  };

  const [secondsLeft, setSecondsLeft] = useState(calcSeconds);
  const expireTriggeredRef = useRef(false);

  useEffect(() => {
    expireTriggeredRef.current = false;
    setSecondsLeft(calcSeconds());

    const timerId = setInterval(() => {
      const remaining = calcSeconds();
      setSecondsLeft(remaining);

      if (remaining <= 0 && !expireTriggeredRef.current) {
        expireTriggeredRef.current = true;
        if (typeof onExpire === 'function') onExpire();
      }
    }, 1000);

    return () => clearInterval(timerId);
  }, [expiresAt]);

  const isExpired = secondsLeft <= 0;
  const theme = isExpired ? THEMES.expired :
    secondsLeft <= 60 ? THEMES.critical :
    secondsLeft <= 180 ? THEMES.warning : THEMES.safe;

  // Format MM:SS
  const m = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const s = String(secondsLeft % 60).padStart(2, '0');
  const formattedTime = `${m}:${s}`;
  const progressPercent = Math.min(100, Math.max(0, (secondsLeft / 600) * 100));

  return (
    <div
      className={`group relative flex items-center rounded-full border shadow-xs backdrop-blur-md transition-all duration-300 select-none ${
        isCompact ? 'gap-1.5 px-2.5 py-1' : 'gap-2 sm:gap-2.5 px-3 sm:px-3.5 py-1.5'
      } ${theme.container} ${className}`}
      title={`Sisa durasi pendaftaran tiket barcode: ${formattedTime}`}
      aria-live="polite"
    >
      {/* Pulsing Radar Dot */}
      <span className={`relative flex shrink-0 ${isCompact ? 'h-2 w-2' : 'h-2.5 w-2.5'}`}>
        {!isExpired && (
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${theme.dotPing}`} />
        )}
        <span className={`relative inline-flex rounded-full h-full w-full ${theme.dotBase}`} />
      </span>

      {/* Label & Digits */}
      <div className="flex items-center gap-1 sm:gap-1.5 leading-none">
        {!isCompact && (
          <span className={`text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider ${theme.badgeText}`}>
            {isExpired ? 'Sesi Habis' : 'Sisa Durasi'}
          </span>
        )}
        <span className={`font-mono font-black tracking-wider ${isCompact ? 'text-xs sm:text-[13px]' : 'text-xs sm:text-sm'} ${theme.timeText}`}>
          {isExpired ? '00:00' : formattedTime}
        </span>
      </div>

      {/* Micro Progress Track Bar */}
      <div className={`absolute bottom-0 h-[2px] bg-black/5 rounded-full overflow-hidden ${isCompact ? 'left-2 right-2' : 'left-3 right-3'}`}>
        <div
          className={`h-full transition-all duration-1000 ease-linear rounded-full ${theme.progressBar}`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
};

export default memo(Timer);
