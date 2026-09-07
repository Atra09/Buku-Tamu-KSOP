import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminLayout from '../components/AdminLayout';
import { History, Search, RefreshCw, UserCheck, Shield, Clock, FileText } from 'lucide-react';

const ActivityLogPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/logs', {
        params: { search: searchQuery }
      });
      if (res.data.success) {
        setLogs(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [searchQuery]);

  const getActionBadge = (action) => {
    switch (action) {
      case 'LOGIN':
        return 'bg-emerald-50 text-emerald-600 border-emerald-200/60';
      case 'REGISTRASI_TAMU':
        return 'bg-sky-50 text-sky-600 border-sky-200/60';
      case 'UPDATE_STATUS_TAMU':
        return 'bg-amber-50 text-amber-600 border-amber-200/60';
      case 'TAMBAH_USER':
        return 'bg-purple-50 text-purple-600 border-purple-200/60';
      case 'HAPUS_USER':
        return 'bg-rose-50 text-rose-600 border-rose-200/60';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200/60';
    }
  };

  return (
    <AdminLayout 
      title="Log Aktivitas Sistem" 
      subtitle="Audit Trail & Catatan Riwayat Aktivitas Pengelola Si-Tamu"
      activeTab="log-aktivitas"
    >
      {/* Search Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari aktor, aksi, atau detail aktivitas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all"
          />
        </div>
        <button
          onClick={fetchLogs}
          className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer shrink-0"
        >
          <RefreshCw className="w-4 h-4 text-slate-500" />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 font-semibold text-xs animate-pulse">
            Memuat catatan log aktivitas...
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 font-semibold text-xs">
            Belum ada catatan log aktivitas yang terekam.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100">
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase">
                  <th className="py-4 px-6 text-center w-16">NO</th>
                  <th className="py-4 px-6 w-48">WAKTU & TANGGAL</th>
                  <th className="py-4 px-6 w-48">AKTOR / PENGGUNA</th>
                  <th className="py-4 px-6 text-center w-44">AKSI</th>
                  <th className="py-4 px-6">DETAIL AKTIVITAS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {logs.map((log, index) => {
                  const logDate = new Date(log.createdAt);
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-6 text-center font-bold text-slate-400">{index + 1}</td>
                      <td className="py-4 px-6 font-mono text-slate-600">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {logDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {logDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                      </td>
                      <td className="py-4 px-6 font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[10px] font-black uppercase">
                            {log.user_nama.substring(0, 2)}
                          </div>
                          <span>{log.user_nama}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border ${getActionBadge(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-slate-600 font-normal leading-relaxed">
                        {log.details || '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default ActivityLogPage;
