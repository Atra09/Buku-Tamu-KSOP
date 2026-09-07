import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Search, Calendar, Printer, Trash2, Eye, X, User, MapPin, AlertTriangle, CheckCircle2, AlertCircle, FileSpreadsheet, Download
} from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import VisitorBadgeModal from '../components/VisitorBadgeModal';
import Flash from '../components/flash/flash';
import { exportTamuToExcel } from '../utils/excelExport';

const DaftarKunjungan = () => {
  const [tamuList, setTamuList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [search, setSearch] = useState('');
  const [selectedTanggal, setSelectedTanggal] = useState('');
  const [selectedKategori, setSelectedKategori] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [kategoriFilterOptions, setKategoriFilterOptions] = useState([]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // Modals state
  const [previewPhoto, setPreviewPhoto] = useState(null);
  const [selectedGuestForBadge, setSelectedGuestForBadge] = useState(null);
  const [detailGuest, setDetailGuest] = useState(null);
  const [guestToDelete, setGuestToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  // Toast Notification state
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  useEffect(() => {
    fetchMasterCategories();
  }, []);

  const fetchMasterCategories = async () => {
    try {
      const res = await axios.get('/api/master/dropdowns');
      if (res.data && res.data.data && res.data.data.kategoriAsal) {
        setKategoriFilterOptions(res.data.data.kategoriAsal);
      }
    } catch (err) {
      console.error('Error fetching master categories for filter:', err);
    }
  };

  useEffect(() => {
    fetchTamuData();
  }, [search, selectedTanggal, selectedKategori, selectedStatus]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedTanggal, selectedKategori, selectedStatus, tamuList.length]);

  const fetchTamuData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (selectedTanggal) params.tanggal = selectedTanggal;
      if (selectedKategori) params.kategori_asal = selectedKategori;
      if (selectedStatus) params.status = selectedStatus;

      const res = await axios.get('/api/tamu', { params });
      if (res.data && res.data.success) {
        setTamuList(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching data tamu:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'Berkunjung' ? 'Selesai' : 'Berkunjung';
    try {
      await axios.patch(`/api/tamu/${id}/status`, { status: nextStatus });
      showToast(`Status tamu diperbarui menjadi "${nextStatus}"`, 'success');
      fetchTamuData();
    } catch (err) {
      showToast('Gagal memperbarui status tamu', 'error');
    }
  };

  const executeDelete = async () => {
    if (!guestToDelete) return;
    const deletedName = guestToDelete.nama;
    setDeleting(true);
    try {
      await axios.delete(`/api/tamu/${guestToDelete.id}`);
      setGuestToDelete(null);
      showToast(`Data tamu "${deletedName}" berhasil dihapus`, 'success');
      fetchTamuData();
    } catch (err) {
      showToast('Gagal menghapus data tamu', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const resetFilters = () => {
    setSearch('');
    setSelectedTanggal('');
    setSelectedKategori('');
    setSelectedStatus('');
  };

  // Month & Year state for custom export
  const now = new Date();
  const currentMonthStr = String(now.getMonth() + 1).padStart(2, '0');
  const currentYearStr = String(now.getFullYear());

  const [exportMonth, setExportMonth] = useState(currentMonthStr);
  const [exportYear, setExportYear] = useState(currentYearStr);

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

  // Helper functions for Excel Export
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

  const handleExportWeekly = async () => {
    const allData = await fetchAllTamuDataForExport();
    const nowDate = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(nowDate.getDate() - 7);
    const dateLimitStr = sevenDaysAgo.toISOString().split('T')[0];

    const filtered = allData.filter(g => g.tanggal && g.tanggal >= dateLimitStr);
    const success = exportTamuToExcel(filtered, 'Laporan Kunjungan Tamu Mingguan', 'Laporan_Kunjungan_Mingguan');
    if (success) {
      showToast(`Berhasil mengeksport ${filtered.length} data kunjungan mingguan!`, 'success');
      setShowExportModal(false);
    }
  };

  const handleExportSelectedMonthYear = async () => {
    const allData = await fetchAllTamuDataForExport();
    const targetPrefix = `${exportYear}-${exportMonth}`; // e.g. "2026-09"
    const monthObj = BULAN_OPTIONS.find(b => b.value === exportMonth);
    const monthLabel = monthObj ? monthObj.label : exportMonth;

    const filtered = allData.filter(g => g.tanggal && g.tanggal.startsWith(targetPrefix));
    
    if (filtered.length === 0) {
      showToast(`Tidak ada data kunjungan tamu untuk periode ${monthLabel} ${exportYear}`, 'error');
      return;
    }

    const reportTitle = `Laporan Kunjungan Tamu ${monthLabel} ${exportYear}`;
    const fileNamePrefix = `Laporan_Kunjungan_${monthLabel}_${exportYear}`;
    const success = exportTamuToExcel(filtered, reportTitle, fileNamePrefix);
    if (success) {
      showToast(`Berhasil mengeksport ${filtered.length} data kunjungan (${monthLabel} ${exportYear})!`, 'success');
      setShowExportModal(false);
    }
  };

  const handleExportCurrent = () => {
    const success = exportTamuToExcel(tamuList, 'Laporan Kunjungan Tamu Filtered', 'Laporan_Kunjungan_Filtered');
    if (success) {
      showToast(`Berhasil mengeksport ${tamuList.length} data kunjungan!`, 'success');
      setShowExportModal(false);
    }
  };

  // Pagination computations
  const totalPages = Math.ceil(tamuList.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTamuList = tamuList.slice(startIndex, startIndex + itemsPerPage);

  return (
    <AdminLayout
      title="Daftar Kunjungan Tamu"
      subtitle="Kelola & Pantau Riwayat Kunjungan Tamu Terintegrasi secara Real-Time"
      activeTab="tamu"
    >
      <div className="space-y-4">
        
        {/* Search & Filter Toolbar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <h3 className="font-extrabold text-slate-800 text-sm">Tabel Data Tamu Terintegrasi</h3>
            
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-sky-600 bg-sky-50 px-3 py-1 rounded-full border border-sky-200">
                Total: {tamuList.length} Tamu
              </span>

              {/* Export Excel Button */}
              <button
                onClick={() => setShowExportModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-extrabold rounded-xl transition-all shadow-md shadow-emerald-600/20 cursor-pointer border border-emerald-500"
                title="Download Laporan Excel"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Export Laporan Excel</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Cari Nama, No Reg, Instansi..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-sky-400 font-medium"
              />
            </div>

            {/* Date Filter */}
            <div className="relative">
              <input
                type="date"
                value={selectedTanggal}
                onChange={(e) => setSelectedTanggal(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-sky-400 font-medium text-slate-700"
              />
            </div>

            {/* Category Filter */}
            <div>
              <select
                value={selectedKategori}
                onChange={(e) => setSelectedKategori(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-sky-400 font-medium text-slate-700"
              >
                <option value="">Semua Kategori Asal</option>
                {kategoriFilterOptions.map((kat, idx) => (
                  <option key={idx} value={kat}>{kat}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-sky-400 font-medium text-slate-700"
              >
                <option value="">Semua Status</option>
                <option value="Berkunjung">Berkunjung</option>
                <option value="Selesai">Selesai</option>
              </select>
            </div>
          </div>

          {(search || selectedTanggal || selectedKategori || selectedStatus) && (
            <div className="flex justify-end pt-1">
              <button
                onClick={resetFilters}
                className="text-xs font-bold text-rose-500 hover:text-rose-700 transition-colors"
              >
                Reset Filter
              </button>
            </div>
          )}
        </div>

        {/* Table Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 z-10 bg-slate-100 shadow-xs">
                <tr className="bg-slate-100 text-slate-600 uppercase font-bold border-b border-slate-200">
                  <th className="p-3.5">No. Reg</th>
                  <th className="p-3.5">Nama Tamu</th>
                  <th className="p-3.5">No. Telpon</th>
                  <th className="p-3.5">Asal Instansi / Perusahaan</th>
                  <th className="p-3.5">Lokasi Registrasi</th>
                  <th className="p-3.5">Bertemu (Tujuan)</th>
                  <th className="p-3.5">Keperluan</th>
                  <th className="p-3.5 text-sky-700">Datang</th>
                  <th className="p-3.5 text-emerald-700">Keluar</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {loading ? (
                  <tr>
                    <td colSpan="11" className="text-center py-8 text-slate-500 font-bold">
                      Memuat data tamu...
                    </td>
                  </tr>
                ) : tamuList.length === 0 ? (
                  <tr>
                    <td colSpan="11" className="text-center py-8 text-slate-400 font-semibold">
                      Tidak ada data tamu ditemukan.
                    </td>
                  </tr>
                ) : (
                  paginatedTamuList.map((g) => (
                    <tr key={g.id} className="hover:bg-sky-50/40 transition-colors">
                      {/* No Reg */}
                      <td className="p-3 font-extrabold text-blue-600 whitespace-nowrap">
                        {g.no_reg}
                      </td>

                      {/* Nama */}
                      <td className="p-3">
                        <div className="font-extrabold text-slate-800">{g.nama}</div>
                        <div className="text-[10px] text-slate-400">{g.jenis_kelamin}</div>
                      </td>

                      {/* No Telpon */}
                      <td className="p-3 text-slate-600 whitespace-nowrap">
                        {g.no_telpon || '-'}
                      </td>

                      {/* Asal Instansi */}
                      <td className="p-3">
                        <div className="font-bold text-slate-800">{g.asal_instansi}</div>
                        <span className="text-[10px] text-sky-600 font-bold">{g.kategori_asal}</span>
                      </td>

                      {/* Lokasi Registrasi */}
                      <td className="p-3 max-w-[160px]">
                        <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-700 truncate" title={g.lokasi || 'Lokasi Tidak Terdeteksi'}>
                          <MapPin className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                          <span className="truncate">{g.lokasi || 'Lokasi Tidak Terdeteksi'}</span>
                        </div>
                      </td>

                      {/* Bertemu */}
                      <td className="p-3 font-bold text-slate-800">
                        {g.bertemu}
                      </td>

                      {/* Keperluan */}
                      <td className="p-3 text-slate-600 max-w-xs truncate">
                        {g.keperluan}
                      </td>

                      {/* Datang */}
                      <td className="p-3 whitespace-nowrap text-slate-500">
                        <div className="font-semibold text-slate-700">{g.tanggal}</div>
                        <div className="text-[10px] text-slate-400 font-medium">{g.jam}</div>
                      </td>

                      {/* Keluar */}
                      <td className="p-3 whitespace-nowrap text-slate-500">
                        {g.status === 'Selesai' && g.tanggal_keluar ? (
                          <>
                            <div className="font-semibold text-emerald-700">{g.tanggal_keluar}</div>
                            <div className="text-[10px] text-emerald-600 font-bold">{g.jam_keluar}</div>
                          </>
                        ) : (
                          <span className="text-slate-400 font-semibold">-</span>
                        )}
                      </td>

                      {/* Status Toggle Button */}
                      <td className="p-3">
                        <button
                          onClick={() => handleToggleStatus(g.id, g.status)}
                          className={`px-3 py-1 rounded-full text-[11px] font-extrabold cursor-pointer transition-all shadow-xs ${
                            g.status === 'Berkunjung'
                              ? 'bg-amber-100 text-amber-800 hover:bg-amber-200 border border-amber-300'
                              : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300'
                          }`}
                          title="Klik untuk ubah status"
                        >
                          {g.status}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={async () => {
                              try {
                                const res = await axios.get(`/api/tamu/${g.id}`);
                                if (res.data && res.data.data) {
                                  setDetailGuest(res.data.data);
                                } else {
                                  setDetailGuest(g);
                                }
                              } catch (e) {
                                setDetailGuest(g);
                              }
                            }}
                            className="p-1.5 rounded-lg bg-sky-50 text-sky-600 hover:bg-sky-100 border border-sky-200 transition-colors cursor-pointer"
                            title="Lihat Detail Tamu"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => setSelectedGuestForBadge(g)}
                            className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 transition-colors cursor-pointer"
                            title="Cetak Struk Registrasi"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => setGuestToDelete(g)}
                            className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
                            title="Hapus Data"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer Toolbar */}
          <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-600 font-bold">
              <span>Menampilkan</span>
              <span className="text-slate-900 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                {tamuList.length === 0 ? 0 : startIndex + 1} - {Math.min(startIndex + itemsPerPage, tamuList.length)}
              </span>
              <span>dari <strong className="text-sky-700">{tamuList.length}</strong> Total Tamu</span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-extrabold text-slate-700 transition-colors shadow-2xs cursor-pointer"
              >
                Sebelumnya
              </button>

              {/* Page Number Buttons */}
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-7 h-7 rounded-lg text-xs font-black transition-all cursor-pointer ${
                      currentPage === page
                        ? 'bg-sky-600 text-white shadow-xs shadow-sky-600/30'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-extrabold text-slate-700 transition-colors shadow-2xs cursor-pointer"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Photo Preview Modal */}
      {previewPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-fadeIn">
          <div className="relative max-w-2xl w-full bg-white rounded-2xl p-2 shadow-2xl">
            <button
              onClick={() => setPreviewPhoto(null)}
              className="absolute top-4 right-4 z-10 bg-slate-900/80 text-white p-2 rounded-full hover:bg-slate-900 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={previewPhoto}
              alt="Preview Snap"
              className="w-full h-auto max-h-[80vh] rounded-xl object-contain"
            />
          </div>
        </div>
      )}

      {/* Detail Guest Modal */}
      {detailGuest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200">
            <div className="bg-slate-950 text-white px-5 py-3 flex items-center justify-between">
              <h3 className="font-bold text-sm">Detail Informasi Tamu</h3>
              <button onClick={() => setDetailGuest(null)} className="cursor-pointer">
                <X className="w-5 h-5 text-slate-300 hover:text-white" />
              </button>
            </div>
            <div className="p-5 space-y-3 text-xs">
              {detailGuest.foto ? (
                <div className="text-center mb-3">
                  <img
                    src={detailGuest.foto}
                    alt={detailGuest.nama}
                    onClick={() => setPreviewPhoto(detailGuest.foto)}
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
                  <span className="font-black text-blue-600">{detailGuest.no_reg}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block">Status:</span>
                  <span className="font-bold text-slate-800">{detailGuest.status}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block">Nama:</span>
                  <span className="font-bold text-slate-800">{detailGuest.nama}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block">Jenis Kelamin:</span>
                  <span className="font-semibold text-slate-700">{detailGuest.jenis_kelamin}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block">Asal / Instansi:</span>
                  <span className="font-bold text-slate-800">{detailGuest.asal_instansi}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block">No. Telepon:</span>
                  <span className="font-semibold text-slate-700">{detailGuest.no_telpon || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block">Waktu Datang:</span>
                  <span className="font-bold text-sky-700">{detailGuest.tanggal} ({detailGuest.jam})</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block">Waktu Keluar:</span>
                  <span className="font-bold text-emerald-700">
                    {detailGuest.status === 'Selesai' && detailGuest.tanggal_keluar
                      ? `${detailGuest.tanggal_keluar} (${detailGuest.jam_keluar})`
                      : '-'}
                  </span>
                </div>
              </div>

              <div className="bg-sky-50/80 p-3 rounded-xl border border-sky-200">
                <span className="text-blue-900 font-bold block mb-1">Bertemu: {detailGuest.bertemu}</span>
                <span className="text-slate-700 font-semibold block">Keperluan: {detailGuest.keperluan}</span>
                {detailGuest.alamat && (
                  <span className="text-slate-500 text-[11px] block mt-1">Alamat: {detailGuest.alamat}</span>
                )}
              </div>

              {/* Lokasi Deteksi Foto / Registrasi */}
              <div className="bg-slate-900 text-slate-100 p-3 rounded-xl border border-slate-800 flex items-start gap-2.5 shadow-sm">
                <MapPin className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] uppercase tracking-wider font-extrabold text-sky-400 block">
                    Lokasi Registrasi / Foto
                  </span>
                  <span className="text-xs font-semibold text-slate-200 block mt-0.5">
                    {detailGuest.lokasi || 'Lokasi Tidak Terdeteksi'}
                  </span>
                </div>
              </div>
            </div>
            <div className="bg-slate-100 px-5 py-3 text-right">
              <button
                onClick={() => setDetailGuest(null)}
                className="px-4 py-1.5 bg-slate-950 hover:bg-slate-900 text-white font-bold rounded-lg cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {guestToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-rose-100 text-center space-y-4">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 text-base">Konfirmasi Hapus Data</h3>
              <p className="text-xs font-medium text-slate-500 mt-1">
                Apakah Anda yakin ingin menghapus data tamu <strong className="text-slate-800">{guestToDelete.nama}</strong> ({guestToDelete.no_reg})?
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setGuestToDelete(null)}
                disabled={deleting}
                className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={executeDelete}
                disabled={deleting}
                className="flex-1 py-2.5 px-4 bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white font-extrabold text-xs rounded-xl transition-all shadow-md shadow-rose-500/20 cursor-pointer"
              >
                {deleting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Visitor Badge / Struk Modal */}
      {selectedGuestForBadge && (
        <VisitorBadgeModal
          guest={selectedGuestForBadge}
          onClose={() => setSelectedGuestForBadge(null)}
        />
      )}

      {/* Excel Export Options Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-emerald-100 overflow-hidden space-y-0">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-200" />
                <h3 className="font-extrabold text-sm">Download Laporan Excel</h3>
              </div>
              <button
                onClick={() => setShowExportModal(false)}
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
                  onClick={handleExportSelectedMonthYear}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-extrabold text-xs rounded-xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer border border-emerald-500"
                >
                  <Download className="w-4 h-4 text-emerald-100" />
                  <span>Download Laporan ({BULAN_OPTIONS.find(b => b.value === exportMonth)?.label} {exportYear})</span>
                </button>
              </div>



              {/* Filtered Data Option */}
              <button
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
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Flash Notification Toast */}
      <Flash toast={toast} onClose={() => setToast(null)} />
    </AdminLayout>
  );
};

export default DaftarKunjungan;
