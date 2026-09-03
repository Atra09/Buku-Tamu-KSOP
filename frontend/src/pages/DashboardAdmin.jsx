import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  Users, Calendar, Clock, UserCheck, TrendingUp, Building, ArrowRight
} from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import MonthlyBarChart from '../components/dashboard/MonthlyBarChart';
import CategoryDoughnutChart from '../components/dashboard/CategoryDoughnutChart';

const DashboardAdmin = () => {
  const [stats, setStats] = useState({
    totalHariIni: 0,
    totalBulanIni: 0,
    sedangBerkunjung: 0,
    kategori: { instansi: 0, masyarakat: 0, perusahaan: 0 },
    categoryStats: [],
    weeklyStats: [],
    monthlyStats: []
  });

  const [recentGuests, setRecentGuests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchRecentGuests();
  }, []);

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

  const fetchRecentGuests = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/tamu', { params: { limit: 5 } });
      if (res.data && res.data.success) {
        setRecentGuests(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching recent guests:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout
      title="Dashboard Utama"
      subtitle="Ringkasan Statistik & Visualisasi Grafik Buku Tamu Digital Si-Tamu KSOP"
      activeTab="dashboard"
    >
      {/* 1. Statistics Cards */}
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
              <TrendingUp className="w-3.5 h-3.5" /> Akumulasi Bulanan
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center font-bold shadow-xs">
            <Building className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Category Distribution */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-md flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Kategori Instansi</span>
            <h3 className="text-3xl font-black text-emerald-600 mt-1">{stats.kategori?.instansi || 0}</h3>
            <p className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
              Mitra Kerja / Dinas
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center font-bold shadow-xs">
            <Building className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 2. Interactive Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <MonthlyBarChart
            weeklyStats={stats.weeklyStats || []}
            monthlyStats={stats.monthlyStats || []}
          />
        </div>
        <div className="lg:col-span-1">
          <CategoryDoughnutChart
            categoryStats={stats.categoryStats || []}
          />
        </div>
      </div>

      {/* 3. Quick Recent Guests Widget */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-black text-slate-800 text-base">Ringkasan Kunjungan Terkini</h3>
            <p className="text-xs text-slate-500 font-medium">Monitoring 5 aktivitas pendaftaran tamu paling baru</p>
          </div>
          <Link
            to="/admin/tamu"
            className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
          >
            Lihat Semua di Daftar Kunjungan
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200">
                <th className="p-3">No. Reg</th>
                <th className="p-3">Nama Tamu</th>
                <th className="p-3">Asal Instansi</th>
                <th className="p-3">Bertemu (Tujuan)</th>
                <th className="p-3 text-sky-700">Datang</th>
                <th className="p-3 text-emerald-700">Keluar</th>
                <th className="p-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-6 text-slate-400 font-semibold">
                    Memuat ringkasan data tamu...
                  </td>
                </tr>
              ) : recentGuests.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-6 text-slate-400 font-semibold">
                    Belum ada data kunjungan tamu.
                  </td>
                </tr>
              ) : (
                recentGuests.slice(0, 5).map((g) => (
                  <tr key={g.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-extrabold text-blue-600">{g.no_reg}</td>
                    <td className="p-3 font-bold text-slate-800">{g.nama}</td>
                    <td className="p-3 text-slate-700">{g.asal_instansi}</td>
                    <td className="p-3 text-slate-700 font-medium">{g.bertemu}</td>
                    <td className="p-3 text-slate-600">
                      <div className="font-semibold text-slate-700">{g.tanggal}</div>
                      <div className="text-[10px] text-slate-400 font-medium">{g.jam}</div>
                    </td>
                    <td className="p-3 text-slate-600">
                      {g.status === 'Selesai' && g.tanggal_keluar ? (
                        <div>
                          <div className="font-semibold text-emerald-700">{g.tanggal_keluar}</div>
                          <div className="text-[10px] text-emerald-600 font-bold">{g.jam_keluar}</div>
                        </div>
                      ) : (
                        <span className="text-slate-400 font-semibold">-</span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold border ${
                        g.status === 'Berkunjung'
                          ? 'bg-amber-100 text-amber-800 border-amber-200'
                          : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                      }`}>
                        {g.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};

export default DashboardAdmin;
