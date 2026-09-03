import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  LayoutDashboard, Building, Users, Calendar, Clock, UserCheck,
  TrendingUp, Search, Filter, Printer, Trash2, Eye, RefreshCw, X,
  User, Phone, MapPin, Tag, Plus, Bell, ChevronDown, ExternalLink, CheckCircle2, LogOut
} from 'lucide-react';
import VisitorBadgeModal from '../components/VisitorBadgeModal';

const DashboardAdmin = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'master'

  // Dashboard & Stats
  const [stats, setStats] = useState({
    totalHariIni: 0,
    totalBulanIni: 0,
    sedangBerkunjung: 0,
    kategori: { instansi: 0, masyarakat: 0, perusahaan: 0 }
  });

  const [tamuList, setTamuList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [search, setSearch] = useState('');
  const [selectedTanggal, setSelectedTanggal] = useState('');
  const [selectedKategori, setSelectedKategori] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Master PT / Tujuan State
  const [masterTujuan, setMasterTujuan] = useState([]);
  const [masterTujuanObjects, setMasterTujuanObjects] = useState([]);
  const [newTujuan, setNewTujuan] = useState('');
  const [editingTujuanId, setEditingTujuanId] = useState(null);
  const [addingMaster, setAddingMaster] = useState(false);

  // Modals state
  const [previewPhoto, setPreviewPhoto] = useState(null);
  const [selectedGuestForBadge, setSelectedGuestForBadge] = useState(null);
  const [detailGuest, setDetailGuest] = useState(null);

  useEffect(() => {
    fetchStats();
    fetchMasterData();
  }, []);

  useEffect(() => {
    fetchTamuData();
  }, [search, selectedTanggal, selectedKategori, selectedStatus]);

  const fetchStats = async () => {
    try {
      const res = await axios.get('/api/tamu/stats');
      if (res.data && res.data.success) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const fetchMasterData = async () => {
    try {
      const res = await axios.get('/api/master/dropdowns');
      if (res.data && res.data.data) {
        setMasterTujuan(res.data.data.tujuan || []);
        setMasterTujuanObjects(res.data.data.tujuanList || []);
      }
    } catch (err) {
      console.error('Error fetching master data:', err);
    }
  };

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
      fetchStats();
    } catch (err) {
      alert('Gagal memperbarui status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus data tamu ini?')) return;
    try {
      await axios.delete(`/api/tamu/${id}`);
      fetchTamuData();
      fetchStats();
    } catch (err) {
      alert('Gagal menghapus data tamu');
    }
  };

  // Master PT / Tujuan CRUD Handlers
  const handleAddOrUpdateMasterTujuan = async (e) => {
    e.preventDefault();
    if (!newTujuan.trim()) return;
    try {
      setAddingMaster(true);
      if (editingTujuanId) {
        await axios.put(`/api/master/tujuan/${editingTujuanId}`, { nama_tujuan: newTujuan.trim() });
      } else {
        await axios.post('/api/master/tujuan', { nama_tujuan: newTujuan.trim() });
      }
      setNewTujuan('');
      setEditingTujuanId(null);
      fetchMasterData();
    } catch (err) {
      alert('Gagal menyimpan Master Tujuan / PT');
    } finally {
      setAddingMaster(false);
    }
  };

  const handleEditMasterTujuan = (item) => {
    setEditingTujuanId(item.id);
    setNewTujuan(item.nama_tujuan);
  };

  const handleDeleteMasterTujuan = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus Master Tujuan / PT ini?')) return;
    try {
      await axios.delete(`/api/master/tujuan/${id}`);
      fetchMasterData();
    } catch (err) {
      alert('Gagal menghapus Master Tujuan / PT');
    }
  };

  const resetFilters = () => {
    setSearch('');
    setSelectedTanggal('');
    setSelectedKategori('');
    setSelectedStatus('');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex font-sans text-slate-800">
      
      {/* 1. Dark Left Sidebar (Dash UI Style) */}
      <aside className="w-64 bg-slate-950 text-slate-300 flex flex-col shrink-0 border-r border-slate-800 shadow-xl hidden md:flex">
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <img
            src="/images/kementrianperhubungan.png"
            alt="Logo Kementerian Perhubungan"
            className="w-9 h-9 object-contain shrink-0 filter drop-shadow-xs"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Logo_Kementerian_Perhubungan.png/600px-Logo_Kementerian_Perhubungan.png";
            }}
          />
          <div>
            <h1 className="font-black text-white text-lg tracking-tight leading-none">Si-Tamu</h1>
          </div>
        </div>

        {/* Sidebar Nav Links */}
        <nav className="p-4 space-y-1.5 flex-1">
          <div className="px-3 py-2 text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">
            Menu Utama
          </div>

          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/30 font-extrabold'
                : 'hover:bg-slate-900 hover:text-white text-slate-400'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </button>

          <button
            onClick={() => setActiveTab('master')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'master'
                ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/30 font-extrabold'
                : 'hover:bg-slate-900 hover:text-white text-slate-400'
            }`}
          >
            <Building className="w-4 h-4" />
            Tujuan Kunjungan
          </button>

          <div className="pt-4 px-3 py-2 text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">
            Akses Publik
          </div>

          <Link
            to="/"
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold text-slate-400 hover:bg-slate-900 hover:text-white transition-all"
          >
            <ExternalLink className="w-4 h-4 text-sky-400" />
            Buka Halaman KSOP
          </Link>
        </nav>

        {/* User Footer */}
        <div className="p-4 border-t border-slate-900 flex items-center gap-3 bg-slate-900/50">
          <div className="w-9 h-9 rounded-full bg-sky-600/20 text-sky-400 border border-sky-500/30 flex items-center justify-center font-black text-xs shrink-0">
            AD
          </div>
          <div className="flex-1 truncate">
            <div className="text-xs font-bold text-white truncate">
              {JSON.parse(localStorage.getItem('sitamu_user') || '{}').nama || 'Administrator'}
            </div>
            <div className="text-[10px] text-slate-500 truncate">
              @{JSON.parse(localStorage.getItem('sitamu_user') || '{}').username || 'admin'}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* Clean Section Header */}
        <div className="px-6 sm:px-10 pt-8 pb-2 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">
              {activeTab === 'dashboard' ? 'Dashboard' : 'Kelola Tujuan Kunjungan'}
            </h2>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">
              Sistem Informasi Buku Tamu Digital (Si-Tamu) - Panel Administrator
            </p>
          </div>
        </div>

        <div className="px-6 sm:px-10 py-4 space-y-6 pb-12">
          {/* Statistics Cards - Only show on Dashboard tab */}
          {activeTab === 'dashboard' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Tamu Hari Ini */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-md flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Tamu Hari Ini</span>
                  <h3 className="text-3xl font-black text-slate-900 mt-1">{stats.totalHariIni}</h3>
                  <p className="text-[11px] text-sky-600 font-semibold mt-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-sky-500" /> Hari ini
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-200 text-sky-600 flex items-center justify-center font-bold shadow-xs">
                  <Users className="w-6 h-6" />
                </div>
              </div>

              {/* Card 2: Sedang Berkunjung */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-md flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Sedang Berkunjung</span>
                  <h3 className="text-3xl font-black text-amber-600 mt-1">{stats.sedangBerkunjung}</h3>
                  <p className="text-[11px] text-amber-600 font-semibold mt-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> Status Aktif
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center font-bold shadow-xs">
                  <UserCheck className="w-6 h-6" />
                </div>
              </div>

              {/* Card 3: Tamu Bulan Ini */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-md flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Tamu Bulan Ini</span>
                  <h3 className="text-3xl font-black text-blue-600 mt-1">{stats.totalBulanIni}</h3>
                  <p className="text-[11px] text-blue-600 font-semibold mt-1 flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5" /> Accumulation
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center font-bold shadow-xs">
                  <Building className="w-6 h-6" />
                </div>
              </div>

              {/* Card 4: Tujuan Kunjungan */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-md flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Tujuan Kunjungan</span>
                  <h3 className="text-3xl font-black text-slate-800 mt-1">{masterTujuan.length}</h3>
                  <p className="text-[11px] text-slate-500 font-semibold mt-1 flex items-center gap-1">
                    Pilihan Tujuan
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center font-bold shadow-xs">
                  <Building className="w-6 h-6" />
                </div>
              </div>
            </div>
          )}

          {/* 5. TAB 1: Data Kunjungan Tamu */}
          {activeTab === 'dashboard' && (
            <div className="space-y-4">
              
              {/* Search & Filter Toolbar */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="font-extrabold text-slate-800 text-sm">Tabel Data Tamu Terintegrasi</h3>
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
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-100/80 text-slate-600 uppercase font-bold border-b border-slate-200">
                        <th className="p-3.5">No. Reg</th>
                        <th className="p-3.5">Nama Tamu</th>
                        <th className="p-3.5">No. Telpon</th>
                        <th className="p-3.5">Asal Instansi / PT</th>
                        <th className="p-3.5">Bertemu (Tujuan)</th>
                        <th className="p-3.5">Keperluan</th>
                        <th className="p-3.5">Tanggal & Jam</th>
                        <th className="p-3.5">Status</th>
                        <th className="p-3.5 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {loading ? (
                        <tr>
                          <td colSpan="9" className="text-center py-8 text-slate-500 font-bold">
                            Memuat data tamu...
                          </td>
                        </tr>
                      ) : tamuList.length === 0 ? (
                        <tr>
                          <td colSpan="9" className="text-center py-8 text-slate-400 font-semibold">
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

                            {/* Tanggal & Jam */}
                            <td className="p-3 whitespace-nowrap text-slate-500">
                              <div className="font-semibold">{g.tanggal}</div>
                              <div className="text-[10px] text-slate-400">{g.jam}</div>
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
                                  className="p-1.5 rounded-lg bg-sky-50 text-sky-600 hover:bg-sky-100 border border-sky-200 transition-colors"
                                  title="Lihat Detail Tamu"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>

                                <button
                                  onClick={() => setSelectedGuestForBadge(g)}
                                  className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 transition-colors"
                                  title="Cetak Struk Registrasi"
                                >
                                  <Printer className="w-4 h-4" />
                                </button>

                                <button
                                  onClick={() => handleDelete(g.id)}
                                  className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 transition-colors"
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
          )}

          {/* 6. TAB 2: Master Tujuan Kunjungan Management (CRUD Table) */}
          {activeTab === 'master' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Form Input Tambah / Edit Master Tujuan */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                    <Building className="w-4 h-4 text-sky-600" />
                    {editingTujuanId ? 'Edit Tujuan Kunjungan' : 'Tambah Tujuan Kunjungan'}
                  </h3>
                  {editingTujuanId && (
                    <button
                      onClick={() => { setEditingTujuanId(null); setNewTujuan(''); }}
                      className="text-xs font-bold text-rose-500 hover:underline"
                    >
                      Batal Edit
                    </button>
                  )}
                </div>

                <p className="text-xs text-slate-500">
                  Daftar ini akan muncul sebagai opsi pilihan "Bertemu (Tujuan)" pada form pendaftaran KSOP.
                </p>

                <form onSubmit={handleAddOrUpdateMasterTujuan} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nama Tujuan Kunjungan <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Kepala Kantor / Seksi Keselamatan Berlayar"
                      value={newTujuan}
                      onChange={(e) => setNewTujuan(e.target.value)}
                      required
                      className="w-full text-xs font-bold px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-400 focus:border-sky-400 bg-slate-50 text-slate-800"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={addingMaster}
                      className="flex-1 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      {addingMaster
                        ? 'Menyimpan...'
                        : editingTujuanId
                        ? 'Simpan Perubahan'
                        : 'Tambah Tujuan'}
                    </button>
                  </div>
                </form>
              </div>

              {/* CRUD Table Master Tujuan */}
              <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="font-extrabold text-slate-800 text-sm">
                    Tabel Master Tujuan ({masterTujuanObjects.length})
                  </h3>
                  <p className="text-xs text-slate-400">Kelola opsi tujuan kunjungan tamu secara fleksibel</p>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-100/80 text-slate-600 uppercase font-bold border-b border-slate-200">
                        <th className="p-3 w-12 text-center">No</th>
                        <th className="p-3">NAMA TUJUAN</th>
                        <th className="p-3 w-28 text-center">Status</th>
                        <th className="p-3 w-24 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {masterTujuanObjects.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="text-center py-6 text-slate-400">
                            Belum ada master tujuan / PT terdaftar.
                          </td>
                        </tr>
                      ) : (
                        masterTujuanObjects.map((item, idx) => (
                          <tr key={item.id || idx} className="hover:bg-sky-50/40 transition-colors">
                            <td className="p-3 text-center font-bold text-slate-500">{idx + 1}</td>
                            <td className="p-3 font-extrabold text-slate-800">{item.nama_tujuan}</td>
                            <td className="p-3 text-center">
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                Aktif
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => handleEditMasterTujuan(item)}
                                  className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 transition-colors cursor-pointer"
                                  title="Edit Data"
                                >
                                  <Tag className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteMasterTujuan(item.id)}
                                  className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
                                  title="Hapus Data"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
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
          )}

        </div>
      </div>

      {/* Photo Preview Modal */}
      {previewPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fadeIn">
          <div className="relative bg-white p-3 rounded-2xl shadow-2xl max-w-lg w-full">
            <button
              onClick={() => setPreviewPhoto(null)}
              className="absolute -top-3 -right-3 bg-rose-500 text-white p-1.5 rounded-full hover:bg-rose-600 shadow-md"
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
              <button onClick={() => setDetailGuest(null)}>
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
                className="px-4 py-1.5 bg-slate-950 hover:bg-slate-900 text-white font-bold rounded-lg"
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

    </div>
  );
};

export default DashboardAdmin;
