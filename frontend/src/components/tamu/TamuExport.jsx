import React, { useState } from 'react';
import axios from 'axios';
import { FileSpreadsheet, Calendar, Download, X } from 'lucide-react';
import { exportTamuToExcel } from '../../utils/excelExport';
import { useAuth } from '../../context/AuthContext';

const BULAN_OPTIONS = [
  { value: '01', label: 'Januari' },
  { value: '02', label: 'Februari' },
  { value: '03', label: 'Maret' },
  { value: '04', label: 'April' },
  { value: '05', label: 'Mei' },
  { value: '06', label: 'Juni' },
  { value: '07', label: 'Juli' },
  { value: '08', label: 'Agustus' },
  { value: '09', label: 'September' },
  { value: '10', label: 'Oktober' },
  { value: '11', label: 'November' },
  { value: '12', label: 'Desember' }
];

const TAHUN_OPTIONS = ['2024', '2025', '2026', '2027', '2028'];

/**
 * Reusable Tamu Excel Export Modal Component
 *
 * @param {boolean} isOpen - Whether the export modal is open
 * @param {function} onClose - Callback to close modal
 * @param {Array} tamuList - Currently filtered tamu list
 * @param {function} showToast - Callback to trigger toast alert
 */
const TamuExport = ({ isOpen, onClose, tamuList = [], showToast }) => {
  const { user } = useAuth();
  const now = new Date();
  const currentMonthStr = String(now.getMonth() + 1).padStart(2, '0');
  const currentYearStr = String(now.getFullYear());

  const [exportMonth, setExportMonth] = useState(currentMonthStr);
  const [exportYear, setExportYear] = useState(currentYearStr);
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const logExcelExportActivity = (details) => {
    try {
      axios.post('/api/logs', {
        action: 'EKSPOR_EXCEL',
        details
      }).catch(err => console.error('Error logging export activity:', err));
    } catch (e) {
      console.error('Error in log excel export:', e);
    }
  };

  const fetchAllTamuDataForExport = async () => {
    try {
      const res = await axios.get('/api/tamu', { params: { limit: 1000 } });
      if (res.data && res.data.success) {
        return res.data.data;
      }
    } catch (e) {
      console.error('Error fetching all tamu data for export:', e);
    }
    return tamuList;
  };

  const handleExportSelectedMonthYear = async () => {
    setIsExporting(true);
    try {
      const allData = await fetchAllTamuDataForExport();
      const targetPrefix = `${exportYear}-${exportMonth}`;
      const monthObj = BULAN_OPTIONS.find(b => b.value === exportMonth);
      const monthLabel = monthObj ? monthObj.label : exportMonth;

      const filtered = allData.filter(g => g.tanggal && g.tanggal.startsWith(targetPrefix));

      if (filtered.length === 0) {
        if (showToast) showToast(`Tidak ada data kunjungan tamu untuk periode ${monthLabel} ${exportYear}`, 'error');
        return;
      }

      const reportTitle = `Laporan Kunjungan Tamu ${monthLabel} ${exportYear}`;
      const fileNamePrefix = `Laporan_Kunjungan_${monthLabel}_${exportYear}`;
      const success = exportTamuToExcel(filtered, reportTitle, fileNamePrefix);
      if (success) {
        logExcelExportActivity(`Mengunduh Laporan Rekapitulasi Data Tamu Periode ${monthLabel} ${exportYear} (${filtered.length} Tamu)`);
        if (showToast) showToast(`Berhasil mengeksport ${filtered.length} data kunjungan (${monthLabel} ${exportYear})!`, 'success');
        onClose();
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCurrent = () => {
    if (tamuList.length === 0) {
      if (showToast) showToast('Tidak ada data kunjungan untuk diekspor pada filter saat ini', 'error');
      return;
    }

    const success = exportTamuToExcel(tamuList, 'Laporan Kunjungan Tamu Filtered', 'Laporan_Kunjungan_Filtered');
    if (success) {
      logExcelExportActivity(`Mengunduh Laporan Rekapitulasi Data Tamu Sesuai Filter (${tamuList.length} Tamu)`);
      if (showToast) showToast(`Berhasil mengeksport ${tamuList.length} data kunjungan!`, 'success');
      onClose();
    }
  };

  return (
    <div className="fixed -top-10 -bottom-10 -left-10 -right-10 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-emerald-100 overflow-hidden space-y-0">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-200" />
            <h3 className="font-extrabold text-sm">Download Laporan Excel</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-emerald-100 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-3">
          <p className="text-xs font-semibold text-slate-600 mb-2">
            Pilih jenis periode laporan kunjungan tamu yang ingin di-download dalam format Microsoft Excel (.xlsx):
          </p>

          {/* Custom Month & Year Selector Card */}
          <div className="p-4 rounded-xl border border-sky-200 bg-sky-50/60 space-y-3">
            <div className="flex items-center gap-2 text-sky-900 font-extrabold text-xs">
              <Calendar className="w-4 h-4 text-sky-600" />
              <span>Pilih Bulan & Tahun Laporan:</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Bulan</label>
                <select
                  value={exportMonth}
                  onChange={(e) => setExportMonth(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 bg-white text-slate-800 focus:ring-2 focus:ring-sky-400 focus:outline-hidden"
                >
                  {BULAN_OPTIONS.map((b) => (
                    <option key={b.value} value={b.value}>
                      {b.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Tahun</label>
                <select
                  value={exportYear}
                  onChange={(e) => setExportYear(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 bg-white text-slate-800 focus:ring-2 focus:ring-sky-400 focus:outline-hidden"
                >
                  {TAHUN_OPTIONS.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="button"
              onClick={handleExportSelectedMonthYear}
              disabled={isExporting}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-extrabold text-xs rounded-xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer border border-emerald-500 disabled:opacity-60"
            >
              <Download className="w-4 h-4 text-emerald-100" />
              <span>
                {isExporting
                  ? 'Menyiapkan Laporan...'
                  : `Download Laporan (${BULAN_OPTIONS.find(b => b.value === exportMonth)?.label} ${exportYear})`}
              </span>
            </button>
          </div>

          {/* Filtered Data Option */}
          <button
            type="button"
            onClick={handleExportCurrent}
            className="w-full p-3.5 rounded-xl border border-slate-200 hover:border-emerald-500 bg-slate-50/50 hover:bg-emerald-50/50 flex items-center justify-between text-left group transition-all cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-black group-hover:scale-105 transition-transform">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-xs text-slate-800 block group-hover:text-emerald-900">
                  Laporan Sesuai Filter Saat Ini ({tamuList.length} Tamu)
                </span>
                <span className="text-[11px] font-medium text-slate-500 block">
                  Export data berdasarkan kata kunci / filter tanggal aktif
                </span>
              </div>
            </div>
            <Download className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
          </button>
        </div>

        <div className="bg-slate-50 px-5 py-3 text-right border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Batal
          </button>
        </div>
      </div>
    </div>
  );
};

export default TamuExport;
export { TamuExport };
