import React from 'react';
import { Eye, Printer, Trash2 } from 'lucide-react';

/**
 * Deklarasi Struktur & Atribut Kolom Tabel Kunjungan
 * Digunakan untuk merender header dan pemetaan sel secara bersih & dinamis
 */
export const KUNJUNGAN_COLUMNS = [
  { id: 'no_reg', label: 'No. Reg', summary: true },
  { id: 'nama', label: 'Nama Tamu', summary: true },
  { id: 'no_telpon', label: 'No. Telpon', summary: false },
  { id: 'asal_instansi', label: 'Asal Instansi / PT', summaryLabel: 'Asal Instansi', summary: true },
  { id: 'bertemu', label: 'Bertemu (Tujuan)', summary: true },
  { id: 'keperluan', label: 'Keperluan', summary: false },
  { id: 'datang', label: 'Datang', headerClass: 'text-sky-400', summary: true },
  { id: 'keluar', label: 'Keluar', headerClass: 'text-emerald-400', summary: true },
  { id: 'status', label: 'Status', alignCenter: true, summary: true },
  { id: 'aksi', label: 'Aksi', alignCenter: true, summary: false }
];

/**
 * Komponen Tabel Kunjungan Modular & Reusable
 * 
 * Props:
 * - data: Array list tamu
 * - loading: Boolean status memuat data
 * - isSummary: Boolean (true = Tampilan 7 Kolom Ringkasan Dashboard, false = Tampilan 10 Kolom Lengkap)
 * - maxHeight: Optional string untuk max-height container scrollbar (default: '280px')
 * - onToggleStatus: Function (id, status) ubah status
 * - onViewDetail: Function (tamu) buka modal detail
 * - onPrintBadge: Function (tamu) cetak struk ID Card
 * - onDelete: Function (id) hapus data
 */
const KunjunganTable = ({
  data = [],
  loading = false,
  isSummary = false,
  maxHeight = '280px',
  onToggleStatus,
  onViewDetail,
  onPrintBadge,
  onDelete
}) => {
  // Filter kolom berdasarkan mode isSummary
  const activeColumns = KUNJUNGAN_COLUMNS.filter((col) => !isSummary || col.summary);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div
        className="overflow-x-auto overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-slate-50"
        style={{ maxHeight }}
      >
        <table className="w-full text-left text-xs">
          <thead className="sticky top-0 z-10 bg-slate-900 shadow-xs">
            <tr className="bg-slate-900 text-white uppercase font-bold border-b border-slate-800">
              {activeColumns.map((col) => (
                <th
                  key={col.id}
                  className={`p-3.5 ${col.headerClass || ''} ${col.alignCenter ? 'text-center' : ''}`}
                >
                  {isSummary && col.summaryLabel ? col.summaryLabel : col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {loading ? (
              <tr>
                <td
                  colSpan={activeColumns.length}
                  className="text-center py-8 text-slate-500 font-bold"
                >
                  {isSummary ? 'Memuat ringkasan data tamu...' : 'Memuat data tamu...'}
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={activeColumns.length}
                  className="text-center py-8 text-slate-400 font-semibold"
                >
                  {isSummary ? 'Belum ada data kunjungan tamu.' : 'Tidak ada data tamu ditemukan.'}
                </td>
              </tr>
            ) : (
              data.map((g) => (
                <tr key={g.id} className="hover:bg-sky-50/40 transition-colors">
                  {/* 1. No Reg */}
                  <td className="p-3 font-extrabold text-blue-600 whitespace-nowrap">
                    {g.no_reg}
                  </td>

                  {/* 2. Nama */}
                  <td className="p-3">
                    <div className="font-extrabold text-slate-800">{g.nama}</div>
                    {!isSummary && g.jenis_kelamin && (
                      <div className="text-[10px] text-slate-400">{g.jenis_kelamin}</div>
                    )}
                  </td>

                  {/* 3. No Telpon (Hanya di mode lengkap) */}
                  {!isSummary && (
                    <td className="p-3 text-slate-600 whitespace-nowrap">
                      {g.no_telpon || '-'}
                    </td>
                  )}

                  {/* 4. Asal Instansi */}
                  <td className="p-3">
                    <div className="font-bold text-slate-800">{g.asal_instansi}</div>
                    {!isSummary && g.kategori_asal && (
                      <span className="text-[10px] text-sky-600 font-bold">{g.kategori_asal}</span>
                    )}
                  </td>

                  {/* 5. Bertemu */}
                  <td className="p-3 font-bold text-slate-800">
                    {g.bertemu}
                  </td>

                  {/* 6. Keperluan (Hanya di mode lengkap) */}
                  {!isSummary && (
                    <td className="p-3 text-slate-600 max-w-xs truncate">
                      {g.keperluan}
                    </td>
                  )}

                  {/* 7. Datang */}
                  <td className="p-3 whitespace-nowrap text-slate-500">
                    <div className="font-semibold text-slate-700">{g.tanggal}</div>
                    <div className="text-[10px] text-slate-400 font-medium">{g.jam}</div>
                  </td>

                  {/* 8. Keluar */}
                  <td className="p-3 whitespace-nowrap text-slate-500">
                    {g.status === 'Selesai' && g.tanggal_keluar ? (
                      <div>
                        <div className="font-semibold text-emerald-700">{g.tanggal_keluar}</div>
                        <div className="text-[10px] text-emerald-600 font-bold">{g.jam_keluar}</div>
                      </div>
                    ) : (
                      <span className="text-slate-400 font-semibold">-</span>
                    )}
                  </td>

                  {/* 9. Status */}
                  <td className={`p-3 ${isSummary ? 'text-center' : ''}`}>
                    {onToggleStatus ? (
                      <button
                        onClick={() => onToggleStatus(g.id, g.status)}
                        className={`px-3 py-1 rounded-full text-[11px] font-extrabold cursor-pointer transition-all shadow-xs ${g.status === 'Berkunjung'
                            ? 'bg-amber-100 text-amber-800 hover:bg-amber-200 border border-amber-300'
                            : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300'
                          }`}
                        title="Klik untuk ubah status"
                      >
                        {g.status}
                      </button>
                    ) : (
                      <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold border ${g.status === 'Berkunjung'
                          ? 'bg-amber-100 text-amber-800 border-amber-200'
                          : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                        }`}>
                        {g.status}
                      </span>
                    )}
                  </td>

                  {/* 10. Aksi (Hanya di mode lengkap) */}
                  {!isSummary && (
                    <td className="p-3">
                      <div className="flex items-center justify-center gap-1.5">
                        {onViewDetail && (
                          <button
                            onClick={() => onViewDetail(g)}
                            className="p-1.5 rounded-lg bg-sky-50 text-sky-600 hover:bg-sky-100 border border-sky-200 transition-colors cursor-pointer"
                            title="Lihat Detail Tamu"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}

                        {onPrintBadge && (
                          <button
                            onClick={() => onPrintBadge(g)}
                            className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 transition-colors cursor-pointer"
                            title="Cetak Struk Registrasi"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        )}

                        {onDelete && (
                          <button
                            onClick={() => onDelete(g.id)}
                            className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
                            title="Hapus Data"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default KunjunganTable;
