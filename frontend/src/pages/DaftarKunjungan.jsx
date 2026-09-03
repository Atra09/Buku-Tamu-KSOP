import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Search, Calendar, Printer, Trash2, Eye, X, User
} from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import VisitorBadgeModal from '../components/VisitorBadgeModal';

const DaftarKunjungan = () => {
  const [tamuList, setTamuList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [search, setSearch] = useState('');
  const [selectedTanggal, setSelectedTanggal] = useState('');
  const [selectedKategori, setSelectedKategori] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Modals state
  const [previewPhoto, setPreviewPhoto] = useState(null);
  const [selectedGuestForBadge, setSelectedGuestForBadge] = useState(null);
  const [detailGuest, setDetailGuest] = useState(null);

  useEffect(() => {
    fetchTamuData();
  }, [search, selectedTanggal, selectedKategori, selectedStatus]);

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
      fetchTamuData();
    } catch (err) {
      alert('Gagal memperbarui status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus data tamu ini?')) return;
    try {
      await axios.delete(`/api/tamu/${id}`);
      fetchTamuData();
    } catch (err) {
      alert('Gagal menghapus data tamu');
    }
  };

  const resetFilters = () => {
    setSearch('');
    setSelectedTanggal('');
    setSelectedKategori('');
    setSelectedStatus('');
  };

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
            <span className="text-xs font-bold text-sky-600 bg-sky-50 px-3 py-1 rounded-full border border-sky-200">
              Total: {tamuList.length} Tamu
            </span>
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
                <option value="Instansi">Instansi</option>
                <option value="Perusahaan">Perusahaan</option>
                <option value="Masyarakat">Masyarakat Umum</option>
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
          <div className="overflow-x-auto max-h-[280px] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-slate-50">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 z-10 bg-slate-100 shadow-xs">
                <tr className="bg-slate-100 text-slate-600 uppercase font-bold border-b border-slate-200">
                  <th className="p-3.5">No. Reg</th>
                  <th className="p-3.5">Nama Tamu</th>
                  <th className="p-3.5">No. Telpon</th>
                  <th className="p-3.5">Asal Instansi / PT</th>
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
                    <td colSpan="10" className="text-center py-8 text-slate-500 font-bold">
                      Memuat data tamu...
                    </td>
                  </tr>
                ) : tamuList.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="text-center py-8 text-slate-400 font-semibold">
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

                      {/* Asal Instansi */}
                      <td className="p-3">
                        <div className="font-bold text-slate-800">{g.asal_instansi}</div>
                        <span className="text-[10px] text-sky-600 font-bold">{g.kategori_asal}</span>
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
                            onClick={() => setDetailGuest(g)}
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
                            onClick={() => handleDelete(g.id)}
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

      {/* Visitor Badge / Struk Modal */}
      {selectedGuestForBadge && (
        <VisitorBadgeModal
          guest={selectedGuestForBadge}
          onClose={() => setSelectedGuestForBadge(null)}
        />
      )}
    </AdminLayout>
  );
};

export default DaftarKunjungan;
