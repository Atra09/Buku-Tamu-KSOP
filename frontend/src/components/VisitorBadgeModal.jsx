import React, { useRef } from 'react';
import { X, Printer, CheckCircle, Building2, User, Phone, MapPin, Calendar, Clock, Tag } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';

const VisitorBadgeModal = ({ guest, onClose }) => {
  const printRef = useRef(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Struk-Si-Tamu-${guest?.no_reg || 'ID'}`
  });

  if (!guest) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-sky-100 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-emerald-950 text-white px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-base">Kartu / Struk Registrasi Si-Tamu</h3>
          </div>
          <button
            onClick={onClose}
            className="text-emerald-200 hover:text-white hover:bg-emerald-900 p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Badge Area */}
        <div className="p-6 overflow-y-auto" ref={printRef}>
          <div className="border-2 border-dashed border-emerald-300 rounded-xl p-5 bg-gradient-to-b from-emerald-50/60 to-white text-center shadow-inner">
            <div className="flex items-center justify-center gap-2 mb-1">
              <img
                src="/images/kementrianperhubungan.png"
                alt="Logo Kemenhub"
                className="w-8 h-8 object-contain"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Logo_Kementerian_Perhubungan.png/600px-Logo_Kementerian_Perhubungan.png";
                }}
              />
              <h4 className="font-black text-slate-800 text-base">Si-Tamu • KEMENTERIAN PERHUBUNGAN</h4>
            </div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-4">
              STRUK BUKU TAMU DIGITAL
            </p>

            {/* Guest Photo if available */}
            {guest.foto ? (
              <img
                src={guest.foto.startsWith('data:') ? guest.foto : guest.foto}
                alt={guest.nama}
                className="w-28 h-28 mx-auto rounded-xl object-cover border-2 border-emerald-600 shadow-md mb-3"
              />
            ) : (
              <div className="w-28 h-28 mx-auto rounded-xl bg-slate-200 border-2 border-slate-300 flex items-center justify-center text-slate-400 mb-3">
                <User className="w-12 h-12" />
              </div>
            )}

            {/* No Reg Highlight */}
            <div className="bg-emerald-600 text-white py-1.5 px-3 rounded-lg font-black text-sm tracking-widest mb-4 shadow-xs">
              {guest.no_reg}
            </div>

            {/* Details Table */}
            <div className="text-left space-y-2 text-xs">
              <div className="flex items-start gap-2 border-b border-emerald-100 pb-1.5">
                <User className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Nama Tamu</span>
                  <span className="font-bold text-slate-800">{guest.nama} ({guest.jenis_kelamin})</span>
                </div>
              </div>

              <div className="flex items-start gap-2 border-b border-emerald-100 pb-1.5">
                <Building2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Asal / Instansi</span>
                  <span className="font-bold text-slate-800">{guest.asal_instansi} ({guest.kategori_asal})</span>
                </div>
              </div>

              {guest.no_telpon && (
                <div className="flex items-start gap-2 border-b border-emerald-100 pb-1.5">
                  <Phone className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">No. Telepon</span>
                    <span className="font-semibold text-slate-700">{guest.no_telpon}</span>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-2 border-b border-emerald-100 pb-1.5">
                <Tag className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Bertemu & Keperluan</span>
                  <span className="font-bold text-emerald-950 block">{guest.bertemu}</span>
                  <span className="text-slate-600">{guest.keperluan}</span>
                </div>
              </div>

              <div className="space-y-1 text-[11px] text-slate-600 pt-2 border-t border-emerald-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 font-bold text-sky-700">
                    <Calendar className="w-3.5 h-3.5 text-sky-600" />
                    <span>Datang: {guest.tanggal} ({guest.jam})</span>
                  </div>
                </div>
                {guest.status === 'Selesai' && guest.tanggal_keluar && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 font-bold text-emerald-700">
                      <Clock className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Keluar: {guest.tanggal_keluar} ({guest.jam_keluar})</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Tutup
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm flex items-center gap-1.5 transition-all"
          >
            <Printer className="w-4 h-4" />
            Cetak Struk
          </button>
        </div>
      </div>
    </div>
  );
};

export default VisitorBadgeModal;
