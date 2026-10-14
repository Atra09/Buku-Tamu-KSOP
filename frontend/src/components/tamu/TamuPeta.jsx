import React, { useState } from 'react';
import { X, MapPin, ExternalLink } from 'lucide-react';

/**
 * Reusable Tamu Google Maps Modal Component
 * Displays real-time GPS location presensi tamu with Satellite and Street Map view modes.
 *
 * @param {object} location - Guest object containing location info (null if closed)
 * @param {function} onClose - Callback to close map modal
 */
const TamuPeta = ({ location, onClose }) => {
  const [mapViewMode, setMapViewMode] = useState('m'); // 'm' = Vector/Jalan, 'k' = Satelit
  const [isMapLoading, setIsMapLoading] = useState(true);

  if (!location) return null;

  const rawLoc = location.lokasi || '';
  const isNotDetected = !rawLoc || rawLoc === 'Lokasi Tidak Terdeteksi';

  // Extract exact coordinates if available (e.g. -7.043512, 113.882145), otherwise fallback
  let mapQuery = 'Kalianget, Sumenep';
  if (!isNotDetected) {
    const coordMatch = rawLoc.match(/(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/);
    if (coordMatch) {
      mapQuery = `${coordMatch[1]},${coordMatch[2]}`;
    } else {
      mapQuery = rawLoc;
    }
  }

  return (
    <div className="fixed -top-10 -bottom-10 -left-10 -right-10 z-[70] flex items-center justify-center p-3 sm:p-4 bg-slate-900/75 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200 space-y-0 transform transition-all">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 p-4 px-6 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/20 text-sky-400 border border-sky-400/30 flex items-center justify-center font-bold shadow-inner shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base tracking-wide text-white">Peta Lokasi Submit Tamu (Real-Time GPS)</h3>
                {location.no_reg && (
                  <span className="bg-sky-500/20 text-sky-300 font-extrabold text-[10px] px-2 py-0.5 rounded-md border border-sky-500/30">
                    {location.no_reg}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 font-medium mt-0.5">
                Pengunjung: <strong className="text-white">{location.nama || '-'}</strong> ({location.asal_instansi || '-'})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {/* Toggle Map View Mode (Satelit vs Peta Jalan) */}
            <div className="bg-slate-800/90 p-1 rounded-xl border border-slate-700 flex items-center gap-1 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setMapViewMode('k')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  mapViewMode === 'k'
                    ? 'bg-sky-500 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Tampilan Foto Satelit / Udara"
              >
                📡 Satelit
              </button>
              <button
                type="button"
                onClick={() => setMapViewMode('m')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  mapViewMode === 'm'
                    ? 'bg-sky-500 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Tampilan Peta Vektor Jalan"
              >
                🗺️ Jalan
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-rose-600/80 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-slate-700"
              title="Tutup Peta"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Map Body: Iframe Container */}
        <div className="relative flex-1 min-h-[350px] bg-slate-100 flex items-center justify-center overflow-hidden">
          {!isNotDetected ? (
            <>
              {isMapLoading && (
                <div className="absolute inset-0 bg-slate-100/90 flex flex-col items-center justify-center gap-2 z-10">
                  <div className="w-8 h-8 border-3 border-sky-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-xs font-bold text-slate-600">Menghubungkan ke Satelit GPS...</span>
                </div>
              )}
              <iframe
                title="Peta Lokasi Tamu"
                width="100%"
                height="100%"
                style={{ border: 0, minHeight: '380px' }}
                loading="lazy"
                src={`https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&t=${mapViewMode}&z=17&ie=UTF8&iwloc=&output=embed`}
                onLoad={() => setIsMapLoading(false)}
                className="w-full h-full object-cover"
              ></iframe>
            </>
          ) : (
            <div className="text-center p-8 max-w-sm">
              <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-500 border border-amber-200 flex items-center justify-center mx-auto mb-3 shadow-inner">
                <MapPin className="w-8 h-8" />
              </div>
              <h4 className="font-extrabold text-slate-800 text-sm">Koordinat GPS Tidak Tersedia</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Tamu ini melakukan registrasi tanpa memberikan izin akses lokasi GPS pada perangkatnya.
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer: Address details & Google Maps Link */}
        <div className="bg-slate-50 p-4 px-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
          <div className="flex items-start gap-3 text-xs flex-1">
            <MapPin className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
            <div>
              <span className="text-[10px] font-extrabold uppercase text-slate-400 block tracking-wider">
                Titik Presensi Terdeteksi Perangkat:
              </span>
              <p className="font-bold text-slate-800 text-xs mt-0.5 leading-relaxed">
                {rawLoc || 'Lokasi Tidak Terdeteksi'}
              </p>
              {location.tanggal && (
                <span className="text-[11px] font-medium text-slate-500 block mt-1">
                  Waktu Registrasi: <strong className="text-slate-700">{location.tanggal} jam {location.jam || ''} WIB</strong>
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            {!isNotDetected && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 sm:flex-none px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-sky-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer border border-sky-500"
              >
                <ExternalLink className="w-4 h-4 text-sky-100" />
                <span>Buka Navigasi Google Maps</span>
              </a>
            )}

            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-extrabold text-xs rounded-xl transition-all cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TamuPeta;
export { TamuPeta };
