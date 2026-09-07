import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Building, Plus, Tag, Trash2, AlertTriangle, CheckCircle2, AlertCircle, X } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import Flash from '../components/flash/flash';

const TujuanKunjungan = () => {
  const [masterTujuanObjects, setMasterTujuanObjects] = useState([]);
  const [newTujuan, setNewTujuan] = useState('');
  const [editingTujuanId, setEditingTujuanId] = useState(null);
  const [addingMaster, setAddingMaster] = useState(false);

  // Modals & Toast State
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  useEffect(() => {
    fetchMasterData();
  }, []);

  const fetchMasterData = async () => {
    try {
      const res = await axios.get('/api/master/dropdowns');
      if (res.data && res.data.data) {
        setMasterTujuanObjects(res.data.data.tujuanList || []);
      }
    } catch (err) {
      console.error('Error fetching master data:', err);
    }
  };

  const getAuthHeaders = () => {
    const userStr = localStorage.getItem('sitamu_user');
    const userObj = userStr ? JSON.parse(userStr) : null;
    const headers = {};
    if (userObj && userObj.nama) {
      headers['x-user-nama'] = encodeURIComponent(userObj.nama);
    }
    return { headers };
  };

  const handleAddOrUpdateMasterTujuan = async (e) => {
    e.preventDefault();
    if (!newTujuan.trim()) return;
    try {
      setAddingMaster(true);
      const config = getAuthHeaders();
      if (editingTujuanId) {
        await axios.put(`/api/master/tujuan/${editingTujuanId}`, { nama_tujuan: newTujuan.trim() }, config);
        showToast('Perubahan tujuan kunjungan berhasil disimpan!', 'success');
      } else {
        await axios.post('/api/master/tujuan', { nama_tujuan: newTujuan.trim() }, config);
        showToast('Tujuan kunjungan baru berhasil ditambahkan!', 'success');
      }
      setNewTujuan('');
      setEditingTujuanId(null);
      fetchMasterData();
    } catch (err) {
      showToast('Gagal menyimpan Master Tujuan', 'error');
    } finally {
      setAddingMaster(false);
    }
  };

  const handleEditMasterTujuan = (item) => {
    setEditingTujuanId(item.id);
    setNewTujuan(item.nama_tujuan);
  };

  const executeDelete = async () => {
    if (!itemToDelete) return;
    setDeleting(true);
    try {
      const config = getAuthHeaders();
      await axios.delete(`/api/master/tujuan/${itemToDelete.id}`, config);
      setItemToDelete(null);
      showToast(`Tujuan "${itemToDelete.nama_tujuan}" berhasil dihapus`, 'success');
      fetchMasterData();
    } catch (err) {
      showToast('Gagal menghapus Master Tujuan', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AdminLayout
      title="Kelola Tujuan Kunjungan"
      subtitle="Sistem Informasi Buku Tamu Digital (Si-Tamu) - Panel Administrator"
      activeTab="tujuan"
    >
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
                className="text-xs font-bold text-rose-500 hover:underline cursor-pointer"
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

          <div className="overflow-x-auto max-h-[260px] overflow-y-auto rounded-xl border border-slate-200 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-slate-50">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 z-10 bg-slate-100 shadow-xs">
                <tr className="bg-slate-100 text-slate-700 uppercase font-bold border-b border-slate-200">
                  <th className="p-3 w-12 text-center">NO</th>
                  <th className="p-3">NAMA TUJUAN</th>
                  <th className="p-3 w-28 text-center">STATUS</th>
                  <th className="p-3 w-24 text-center">AKSI</th>
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
                            onClick={() => setItemToDelete(item)}
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

      {/* Custom Delete Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-rose-100 text-center space-y-4">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 text-base">Konfirmasi Hapus Data</h3>
              <p className="text-xs font-medium text-slate-500 mt-1">
                Apakah Anda yakin ingin menghapus tujuan <strong className="text-slate-800">{itemToDelete.nama_tujuan}</strong>?
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setItemToDelete(null)}
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

      {/* Flash Notification Toast */}
      <Flash toast={toast} onClose={() => setToast(null)} />
    </AdminLayout>
  );
};

export default TujuanKunjungan;
