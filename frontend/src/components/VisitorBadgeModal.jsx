import React, { useRef } from 'react';
import { X, Printer, CheckCircle, Building2, User, Phone, MapPin, Calendar, Clock, Tag } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';

const VisitorBadgeModal = ({ guest, onClose }) => {
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
      const userStr = localStorage.getItem('sitamu_user');
      const userObj = userStr ? JSON.parse(userStr) : null;
      const headers = {};
      if (userObj && userObj.nama) {
        headers['x-user-nama'] = encodeURIComponent(userObj.nama);
      }
      axios.post('/api/logs', {
        action: 'CETAK_KARTU_TAMU',
        details: `Mencetak Kartu Kunjungan Tamu: ${guest?.nama || '-'} (${guest?.no_reg || '-'})`
      }, { headers }).catch(err => console.error('Error logging print activity:', err));
    } catch (e) {
      console.error('Error in log print:', e);
    }
    triggerReactToPrint();
  };

  if (!guest) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-sky-100 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-emerald-950 text-white px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-base">Kartu Kunjungan Tamu</h3>
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
            <p className="text-[11px] text-emerald-800 font-extrabold uppercase tracking-widest mb-4">
              KARTU KUNJUNGAN TAMU
            </p>

            {/* Guest Photo if available (Extra Large 1:1 Square Aspect Ratio for clear printing) */}
            {guest.foto ? (
              <img
                src={guest.foto.startsWith('data:') ? guest.foto : guest.foto}
                alt={guest.nama}
                className="w-64 h-64 aspect-square mx-auto rounded-2xl object-cover border-4 border-emerald-600 shadow-lg mb-4"
              />
            ) : (
              <div className="w-64 h-64 aspect-square mx-auto rounded-2xl bg-slate-200 border-4 border-slate-300 flex items-center justify-center text-slate-400 mb-4">
                <User className="w-28 h-28" />
              </div>
            )}

            {/* No Reg Highlight (Formatted as REG-YYMMDD for Struk display) */}
            <div className="bg-emerald-600 text-white py-2 px-4 rounded-xl font-black text-base tracking-widest mb-4 shadow-xs">
              {formatDisplayNoReg(guest.no_reg)}
            </div>

            {/* Details Table */}
            <div className="text-left space-y-2.5 text-xs">
              <div className="flex items-start gap-2 border-b border-emerald-100 pb-1.5">
                <User className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Nama Tamu</span>
                  <span className="font-bold text-slate-800 text-sm">{guest.nama} ({guest.jenis_kelamin})</span>
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
            onClick={handlePrintClick}
            className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Cetak Kartu Kunjungan
          </button>
        </div>
      </div>
    </div>
  );
};

export default VisitorBadgeModal;
