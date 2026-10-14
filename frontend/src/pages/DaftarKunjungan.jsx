import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Calendar, Printer, Trash2, Eye, X, User, MapPin, CheckCircle2, AlertCircle, FileSpreadsheet
} from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import VisitorBadgeModal from '../components/VisitorBadgeModal';
import SearchBar from '../components/common/SearchBar';
import Dropdown from '../components/common/Dropdown';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import TamuDetail from '../components/tamu/TamuDetail';
import TamuFoto from '../components/tamu/TamuFoto';
import TamuExport from '../components/tamu/TamuExport';
import TamuPeta from '../components/tamu/TamuPeta';
import DeleteModal from '../components/modal/delete';
import StatusConfirmModal from '../components/tamu/confirm';
import useGuestStatus from '../hooks/useGuestStatus';
import Pagination from '../components/common/pagination';

const DaftarKunjungan = () => {
  const [tamuList, setTamuList] = useState([]);
  const [totalTamu, setTotalTamu] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [search, setSearch] = useState('');
  const [selectedTanggal, setSelectedTanggal] = useState('');
  const [selectedKategori, setSelectedKategori] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // Modals state
  const [previewPhoto, setPreviewPhoto] = useState(null);
  const [selectedGuestForBadge, setSelectedGuestForBadge] = useState(null);
  const [detailGuest, setDetailGuest] = useState(null);
  const [selectedLocationMap, setSelectedLocationMap] = useState(null);
  const [guestToDelete, setGuestToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  const {
    statusConfirmTarget,
    statusUpdating,
    openStatusConfirm,
    closeStatusConfirm,
    executeStatusToggle
  } = useGuestStatus(() => {
    fetchTamuData();
  });

  const { user } = useAuth();
  const { showToast } = useToast();

  const fetchTamuData = async (targetPage = currentPage, targetLimit = itemsPerPage) => {
    try {
      setLoading(true);
      const params = {
        limit: targetLimit,
        offset: (targetPage - 1) * targetLimit
      };
      if (search) params.search = search;
      if (selectedTanggal) params.tanggal = selectedTanggal;
      if (selectedKategori) params.kategori_asal = selectedKategori;
      if (selectedStatus) params.status = selectedStatus;

      const res = await axios.get('/api/tamu', { params });
      if (res.data && res.data.success) {
        setTamuList(res.data.data || []);
        setTotalTamu(typeof res.data.total === 'number' ? res.data.total : (res.data.data || []).length);
      }
    } catch (err) {
      console.error('Error fetching data tamu:', err);
      const errMsg = err.response?.data?.message || 'Gagal memuat data tamu.';
      showToast(errMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
    fetchTamuData(1, itemsPerPage);
  }, [search, selectedTanggal, selectedKategori, selectedStatus]);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    fetchTamuData(newPage, itemsPerPage);
  };

  const handleItemsPerPageChange = (newLimit) => {
    setItemsPerPage(newLimit);
    setCurrentPage(1);
    fetchTamuData(1, newLimit);
  };

  const executeDelete = async () => {
    if (!guestToDelete) return;
    const deletedName = guestToDelete.nama;

    setDeleting(true);
    try {
      await axios.delete(`/api/tamu/${guestToDelete.id}`);
      setGuestToDelete(null);
      showToast(`Data tamu "${deletedName}" berhasil dihapus`, 'success');
      fetchTamuData(currentPage, itemsPerPage);
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

  const totalPages = Math.ceil(totalTamu / itemsPerPage) || 1;

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
                Total: {totalTamu} Tamu
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
            <SearchBar
              placeholder="Cari Nama, No Reg, Instansi..."
              value={search}
              onChange={setSearch}
            />

            {/* Date Filter */}
            <div className="relative">
              <input
                type="date"
                value={selectedTanggal}
                onChange={(e) => setSelectedTanggal(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-sky-400 font-medium text-slate-700 bg-white shadow-2xs"
              />
            </div>

            {/* Category Filter (On-Demand / Lazy Fetched) */}
            <Dropdown
              value={selectedKategori}
              onChange={setSelectedKategori}
              defaultLabel="Semua Kategori Asal"
              fetchUrl="/api/master/dropdowns"
              transformData={(res) => res.data?.data?.kategoriAsal || []}
            />

            {/* Status Filter (Static Options) */}
            <Dropdown
              value={selectedStatus}
              onChange={setSelectedStatus}
              defaultLabel="Semua Status"
              options={['Berkunjung', 'Selesai']}
            />
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
                  tamuList.map((g) => (
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

                      {/* Asal Instansi / Domisili */}
                      <td className="p-3">
                        <div className="font-bold text-slate-800">
                          {g.kategori_asal && g.kategori_asal.toLowerCase().includes('masyarakat')
                            ? (g.alamat || g.asal_instansi || 'Masyarakat Umum')
                            : (g.asal_instansi || '-')}
                        </div>
                        <span className="text-[10px] text-sky-600 font-bold">{g.kategori_asal}</span>
                      </td>

                      {/* Lokasi Registrasi */}
                      <td className="p-3 max-w-[170px]">
                        <button
                          type="button"
                          onClick={() => setSelectedLocationMap(g)}
                          className="flex items-center gap-1.5 text-[11px] font-bold text-sky-700 hover:text-sky-900 bg-sky-50/80 hover:bg-sky-100 p-1.5 rounded-xl border border-sky-200/80 transition-all cursor-pointer group w-full text-left truncate shadow-2xs"
                          title="Klik untuk melihat Peta Lokasi Registrasi"
                        >
                          <MapPin className="w-3.5 h-3.5 text-sky-600 shrink-0 group-hover:scale-110 transition-transform" />
                          <span className="truncate">{g.lokasi || 'Lokasi Tidak Terdeteksi'}</span>
                        </button>
                      </td>

                      {/* Bertemu */}
                      <td className="p-3 font-bold text-slate-800">
                        {g.bertemu}
                      </td>

                      {/* Keperluan */}
                      <td className="p-3 text-slate-600 max-w-[200px]" title={g.keperluan}>
                        <p className="line-clamp-2 whitespace-normal leading-snug break-words">
                          {g.keperluan}
                        </p>
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
                          onClick={() => openStatusConfirm(g.id, g.status)}
                          className={`px-3 py-1 rounded-full text-[11px] font-extrabold cursor-pointer transition-all shadow-xs ${g.status === 'Berkunjung'
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

          {/* Reusable Server-Side Pagination Component */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalTamu}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleItemsPerPageChange}
            pageSizeOptions={[5, 10, 25, 50, 100]}
            itemLabel="Total Tamu"
          />
        </div>

      </div>

      {/* Photo Preview Modal */}
      <TamuFoto photo={previewPhoto} onClose={() => setPreviewPhoto(null)} />

      {/* Detail Guest Modal with Interactive Real-Time GPS Map */}
      <TamuDetail
        guest={detailGuest}
        onClose={() => setDetailGuest(null)}
        onPreviewPhoto={setPreviewPhoto}
        onOpenMap={setSelectedLocationMap}
      />

      {/* Google Maps Real-Time GPS Location Modal */}
      <TamuPeta
        location={selectedLocationMap}
        onClose={() => setSelectedLocationMap(null)}
      />



      {/* Custom Delete Confirmation Modal */}
      <DeleteModal
        isOpen={!!guestToDelete}
        onClose={() => setGuestToDelete(null)}
        onConfirm={executeDelete}
        loading={deleting}
        itemName={guestToDelete?.nama}
        itemCode={guestToDelete?.no_reg}
      />

      {/* Custom Status Change Confirmation Modal */}
      <StatusConfirmModal
        isOpen={!!statusConfirmTarget}
        currentStatus={statusConfirmTarget?.currentStatus}
        onClose={closeStatusConfirm}
        onConfirm={executeStatusToggle}
        loading={statusUpdating}
      />


      {/* Visitor Badge / Struk Modal */}
      {selectedGuestForBadge && (
        <VisitorBadgeModal
          guest={selectedGuestForBadge}
          onClose={() => setSelectedGuestForBadge(null)}
        />
      )}

      {/* Excel Export Options Modal */}
      <TamuExport
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        tamuList={tamuList}
        showToast={showToast}
      />
    </AdminLayout>
  );
};

export default DaftarKunjungan;
