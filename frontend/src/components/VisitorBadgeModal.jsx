import React, { useRef } from 'react';
import axios from 'axios';
import { X, Printer, CheckCircle, Building2, User, Phone, MapPin, Calendar, Clock, Tag } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { useAuth } from '../context/AuthContext';

const VisitorBadgeModal = ({ guest, onClose }) => {
  const { user } = useAuth();
  const printRef = useRef(null);

  const formatDisplayNoReg = (noReg) => {
    if (!noReg) return '';
    const parts = noReg.split('-');
    if (parts.length >= 2) {
      const prefix = parts[0];
      let datePart = parts[1];
      if (datePart.length === 8) {
        datePart = datePart.substring(2);
      }
      return `${prefix}-${datePart}`;
    }
    return noReg;
  };

  const triggerReactToPrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Struk-Si-Tamu-${guest?.no_reg || 'ID'}`
  });

  const handlePrintClick = async () => {
    try {
      axios.post('/api/logs', {
        action: 'CETAK_KARTU_TAMU',
        details: `Mencetak Kartu Kunjungan Tamu: ${guest?.nama || '-'} (${guest?.no_reg || '-'})`
      }).catch(err => console.error('Error logging print activity:', err));
    } catch (e) {
      console.error('Error in log print:', e);
    }
    triggerReactToPrint();
  };

  if (!guest) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-sky-100 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-sky-600 text-white px-4 sm:px-5 py-3.5 flex items-center justify-between shadow-sm shrink-0">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-sky-100 shrink-0" />
            <h3 className="font-bold text-sm sm:text-base tracking-tight">Kartu Kunjungan Tamu</h3>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-xl transition-colors cursor-pointer"
            aria-label="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Badge Area (Scrollable on small mobile screens) */}
        <div className="p-3.5 sm:p-6 overflow-y-auto" ref={printRef}>
          <div className="border-2 border-dashed border-sky-300 rounded-xl p-3.5 sm:p-5 bg-gradient-to-b from-sky-50/60 to-white text-center shadow-inner">
            
            {/* Header Instansi (Flexbox Responsif Tanpa Absolute) */}
            <div className="flex items-center justify-center gap-2.5 sm:gap-3 mb-3">
              <img
                src="/images/kementrianperhubungan.png"
                alt="Logo Kemenhub"
                className="w-8 h-8 sm:w-10 sm:h-10 object-contain shrink-0"
              />
              <div className="text-left">
                <h4 className="font-black text-slate-800 text-xs sm:text-sm tracking-tight leading-snug">
                  Si-Tamu • KEMENTERIAN
                </h4>
                <h4 className="font-black text-slate-800 text-xs sm:text-sm tracking-tight leading-snug">
                  PERHUBUNGAN
                </h4>
              </div>
            </div>

            <p className="text-[10px] sm:text-[11px] text-sky-800 font-extrabold uppercase tracking-widest mb-3 text-center">
              KARTU KUNJUNGAN TAMU
            </p>

            {/* Guest Photo (Fluid Responsif: Pas di Layar HP 360px & Tablet) */}
            {guest.foto ? (
              <img
                src={guest.foto.startsWith('data:') ? guest.foto : guest.foto}
                alt={guest.nama}
                className="w-48 h-48 sm:w-60 sm:h-60 max-w-full aspect-square mx-auto rounded-2xl object-cover border-4 border-sky-600 shadow-md mb-3.5"
              />
            ) : (
              <div className="w-48 h-48 sm:w-60 sm:h-60 max-w-full aspect-square mx-auto rounded-2xl bg-slate-200 border-4 border-slate-300 flex items-center justify-center text-slate-400 mb-3.5">
                <User className="w-20 h-20 sm:w-24 sm:h-24" />
              </div>
            )}

            {/* No Reg Highlight */}
            <div className="bg-sky-600 text-white py-1.5 sm:py-2 px-3 rounded-xl font-black text-xs sm:text-sm tracking-widest mb-3.5 shadow-xs text-center truncate">
              {formatDisplayNoReg(guest.no_reg)}
            </div>

            {/* Details Table */}
            <div className="text-left space-y-2 text-xs">
              <div className="flex items-start gap-2 border-b border-sky-100 pb-1.5">
                <User className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Nama Tamu</span>
                  <span className="font-bold text-slate-800 text-xs sm:text-sm break-words">{guest.nama} ({guest.jenis_kelamin})</span>
                </div>
              </div>

              <div className="flex items-start gap-2 border-b border-sky-100 pb-1.5">
                <Building2 className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Asal / Instansi</span>
                  <span className="font-bold text-slate-800 break-words">{guest.asal_instansi} ({guest.kategori_asal})</span>
                </div>
              </div>

              {guest.no_telpon && (
                <div className="flex items-start gap-2 border-b border-sky-100 pb-1.5">
                  <Phone className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">No. Telepon</span>
                    <span className="font-semibold text-slate-700 font-mono text-xs">{guest.no_telpon}</span>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-2 border-b border-sky-100 pb-1.5">
                <Tag className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Bertemu & Keperluan</span>
                  <span className="font-bold text-sky-950 block break-words">{guest.bertemu}</span>
                  <span className="text-slate-600 text-[11px] leading-relaxed break-words block mt-0.5">{guest.keperluan}</span>
                </div>
              </div>

              <div className="space-y-1 text-[11px] text-slate-600 pt-2 border-t border-sky-100">
                <div className="flex items-center gap-1 font-bold text-sky-700">
                  <Calendar className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                  <span className="truncate">Datang: {guest.tanggal} ({guest.jam})</span>
                </div>
                {guest.status === 'Selesai' && guest.tanggal_keluar && (
                  <div className="flex items-center gap-1 font-bold text-emerald-700">
                    <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate">Keluar: {guest.tanggal_keluar} ({guest.jam_keluar})</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Actions (Mobile: Stacked & Full Width Touch Target) */}
        <div className="bg-slate-50 px-4 sm:px-5 py-3 border-t border-slate-200 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 shrink-0">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer text-center"
          >
            Tutup
          </button>
          <button
            onClick={handlePrintClick}
            className="w-full sm:w-auto px-4 py-2.5 text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Kartu Kunjungan</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default VisitorBadgeModal;
