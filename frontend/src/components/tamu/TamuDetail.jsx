import React, { useState } from 'react';
import { X, User, MapPin, ExternalLink } from 'lucide-react';
import TamuPeta from './TamuPeta';

/**
 * Reusable Guest Detail Modal Component
 * Displays complete guest identity, purpose, and interactive GPS map location
 *
 * @param {object} guest - Guest data object (null if closed)
 * @param {function} onClose - Callback to close detail modal
 * @param {function} onPreviewPhoto - Callback to open enlarged photo modal
 * @param {function} onOpenMap - Optional callback to delegate opening map modal to parent
 */
const TamuDetail = ({ guest, onClose, onPreviewPhoto, onOpenMap }) => {
  const [internalLocationMap, setInternalLocationMap] = useState(null);

  if (!guest) return null;

  const handleOpenMap = () => {
    if (onOpenMap) {
      onOpenMap(guest);
    } else {
      setInternalLocationMap(guest);
    }
  };

  return (
    <>
      <div className="fixed -top-10 -bottom-10 -left-10 -right-10 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
        <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200">
          <div className="bg-slate-950 text-white px-5 py-3 flex items-center justify-between shrink-0">
            <h3 className="font-bold text-sm">Detail Informasi Tamu</h3>
            <button type="button" onClick={onClose} className="cursor-pointer">
              <X className="w-5 h-5 text-slate-300 hover:text-white" />
            </button>
          </div>
          <div className="p-5 space-y-3 text-xs overflow-y-auto flex-1">
            {guest.foto ? (
              <div className="text-center mb-3">
                <img
                  src={guest.foto}
                  alt={guest.nama}
                  onClick={() => onPreviewPhoto && onPreviewPhoto(guest.foto)}
                  className="w-36 h-36 mx-auto rounded-2xl object-cover border-4 border-sky-400 shadow-lg cursor-pointer hover:scale-105 transition-all"
                />
                <span className="text-[10px] font-bold text-sky-600 mt-1 block">
                  Klik foto untuk memperbesar
                </span>
              </div>
            ) : (
              <div className="w-28 h-28 mx-auto rounded-2xl bg-slate-100 border-2 border-slate-200 flex flex-col items-center justify-center text-slate-400 mb-3">
                <User className="w-10 h-10 mb-1" />
                <span className="text-[10px] font-bold">Tanpa Foto</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400 font-bold block">No Registration:</span>
                <span className="font-black text-blue-600">{guest.no_reg}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block">Status:</span>
                <span className="font-bold text-slate-800">{guest.status}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block">Nama:</span>
                <span className="font-bold text-slate-800">{guest.nama}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block">Jenis Kelamin:</span>
                <span className="font-semibold text-slate-700">{guest.jenis_kelamin}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block">Asal / Instansi:</span>
                <span className="font-bold text-slate-800">{guest.asal_instansi}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block">No. Telepon:</span>
                <span className="font-semibold text-slate-700">{guest.no_telpon || '-'}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block">Waktu Datang:</span>
                <span className="font-bold text-sky-700">{guest.tanggal} ({guest.jam})</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block">Waktu Keluar:</span>
                <span className="font-bold text-emerald-700">
                  {guest.status === 'Selesai' && guest.tanggal_keluar
                    ? `${guest.tanggal_keluar} (${guest.jam_keluar})`
                    : '-'}
                </span>
              </div>
            </div>

            <div className="bg-sky-50/80 p-3 rounded-xl border border-sky-200">
              <span className="text-blue-900 font-bold block mb-1">Bertemu: {guest.bertemu}</span>
              <span className="text-slate-700 font-semibold block">Keperluan: {guest.keperluan}</span>
              {guest.alamat && (
                <span className="text-slate-500 text-[11px] block mt-1">Alamat: {guest.alamat}</span>
              )}
            </div>

            {/* Lokasi Deteksi Foto / Registrasi */}
            <button
              type="button"
              onClick={handleOpenMap}
              className="w-full bg-slate-900 hover:bg-slate-950 text-slate-100 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-left shadow-sm transition-all cursor-pointer group"
              title="Klik untuk memperbesar Peta Lokasi"
            >
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-sky-400 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                <div>
                  <span className="text-[10px] uppercase tracking-wider font-extrabold text-sky-400 block">
                    Lokasi Registrasi / Foto (Klik untuk Peta)
                  </span>
                  <span className="text-xs font-semibold text-slate-200 block mt-0.5">
                    {guest.lokasi || 'Lokasi Tidak Terdeteksi'}
                  </span>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-sky-400 opacity-70 group-hover:opacity-100 transition-opacity" />
            </button>
          </div>
          <div className="bg-slate-100 px-5 py-3 text-right shrink-0 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-950 hover:bg-slate-900 text-white font-bold rounded-lg cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>

      {/* Internal Map Modal fallback if onOpenMap not provided */}
      {!onOpenMap && internalLocationMap && (
        <TamuPeta
          location={internalLocationMap}
          onClose={() => setInternalLocationMap(null)}
        />
      )}
    </>
  );
};

export default TamuDetail;
export { TamuDetail };
