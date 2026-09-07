import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Tag, Plus, Trash2, AlertTriangle, CheckCircle2, AlertCircle, X, Layers } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import Flash from '../components/flash/flash';

const KategoriAsal = () => {
  const [masterKategoriObjects, setMasterKategoriObjects] = useState([]);
  const [newKategori, setNewKategori] = useState('');
  const [butuhInstansi, setButuhInstansi] = useState(true);
  const [editingId, setEditingId] = useState(null);
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
        setMasterKategoriObjects(res.data.data.kategoriAsalList || []);
      }
    } catch (err) {
      console.error('Error fetching master data:', err);
    }
  };

  const handleAddOrUpdateMaster = async (e) => {
    e.preventDefault();
    if (!newKategori.trim()) return;
    try {
      setAddingMaster(true);
      const payload = {
        nama_kategori: newKategori.trim(),
        butuh_instansi: butuhInstansi
      };
      if (editingId) {
        await axios.put(`/api/master/kategori-asal/${editingId}`, payload);
        showToast('Perubahan kategori asal berhasil disimpan!', 'success');
      } else {
        await axios.post('/api/master/kategori-asal', payload);
        showToast('Kategori asal baru berhasil ditambahkan!', 'success');
      }
      setNewKategori('');
      setButuhInstansi(true);
      setEditingId(null);
      fetchMasterData();
    } catch (err) {
      showToast('Gagal menyimpan Master Kategori Asal', 'error');
    } finally {
      setAddingMaster(false);
    }
  };

  const checkButuhInstansi = (val, namaKategori = '') => {
    if (val === false || val === 0 || val === 'false' || val === '0') return false;
    if (val === true || val === 1 || val === 'true' || val === '1') return true;
    if (namaKategori && namaKategori.toLowerCase().includes('masyarakat')) return false;
    return true;
  };

  const handleEditMaster = (item) => {
    setEditingId(item.id);
    setNewKategori(item.nama_kategori);
    setButuhInstansi(checkButuhInstansi(item.butuh_instansi, item.nama_kategori));
  };

  const executeDelete = async () => {
    if (!itemToDelete) return;
    setDeleting(true);
    try {
      await axios.delete(`/api/master/kategori-asal/${itemToDelete.id}`);
      setItemToDelete(null);
      showToast(`Kategori "${itemToDelete.nama_kategori}" berhasil dihapus`, 'success');
      fetchMasterData();
    } catch (err) {
      showToast('Gagal menghapus Master Kategori Asal', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AdminLayout
      title="Kelola Kategori Asal"
      subtitle="Sistem Informasi Buku Tamu Digital (Si-Tamu) - Panel Administrator"
      activeTab="kategori-asal"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Form Input Tambah / Edit Master Kategori Asal */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
              <Layers className="w-4 h-4 text-sky-600" />
              {editingId ? 'Edit Kategori Asal' : 'Tambah Kategori Asal'}
            </h3>
            {editingId && (
              <button
                onClick={() => { setEditingId(null); setNewKategori(''); setButuhInstansi(true); }}
                className="text-xs font-bold text-rose-500 hover:underline cursor-pointer"
              >
                Batal Edit
              </button>
            )}
          </div>

          <p className="text-xs text-slate-500">
            Kategori ini akan tampil secara dinamis pada dropdown "Kategori Asal" di Form Registrasi Tamu KSOP.
          </p>

          <form onSubmit={handleAddOrUpdateMaster} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nama Kategori Asal <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Contoh: Instansi / Dinas / Perusahaan"
                value={newKategori}
                onChange={(e) => setNewKategori(e.target.value)}
                required
                className="w-full text-xs font-bold px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-400 focus:border-sky-400 bg-slate-50 text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tipe Input Form Registrasi <span className="text-rose-500">*</span>
              </label>
              <select
                value={butuhInstansi ? 'true' : 'false'}
                onChange={(e) => setButuhInstansi(e.target.value === 'true')}
                className="w-full text-xs font-bold px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-400 focus:border-sky-400 bg-slate-50 text-slate-800 cursor-pointer"
              >
                <option value="true">Asal Instansi / Perusahaan</option>
                <option value="false">Alamat Domisili</option>
              </select>
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
                  : editingId
                    ? 'Simpan Perubahan'
                    : 'Tambah Kategori'}
              </button>
            </div>
          </form>
        </div>

        {/* CRUD Table Master Kategori Asal */}
        <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-slate-800 text-sm">
              Tabel Master Kategori Asal ({masterKategoriObjects.length})
            </h3>
            <p className="text-xs text-slate-400">Kelola opsi jenis kategori asal pengunjung secara fleksibel</p>
          </div>

          <div className="overflow-x-auto max-h-[320px] overflow-y-auto rounded-xl border border-slate-200 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-slate-50">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 z-10 bg-slate-100 shadow-xs">
                <tr className="bg-slate-100 text-slate-700 uppercase font-bold border-b border-slate-200">
                  <th className="p-3 w-12 text-center">NO</th>
                  <th className="p-3">NAMA KATEGORI ASAL</th>
                  <th className="p-3">TIPE INPUT FORM</th>
                  <th className="p-3 w-24 text-center">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {masterKategoriObjects.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center py-6 text-slate-400">
                      Belum ada kategori asal terdaftar.
                    </td>
                  </tr>
                ) : (
                  masterKategoriObjects.map((item, idx) => {
                    const requiresInstansi = checkButuhInstansi(item.butuh_instansi, item.nama_kategori);
                    return (
                      <tr key={item.id || idx} className="hover:bg-sky-50/40 transition-colors">
                        <td className="p-3 text-center font-bold text-slate-500">{idx + 1}</td>
                        <td className="p-3 font-extrabold text-slate-800">{item.nama_kategori}</td>
                        <td className="p-3">
                          {requiresInstansi ? (
                            <span className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-sky-100 text-sky-800 border border-sky-300">
                              Asal Instansi / Perusahaan
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300">
                              Alamat Domisili
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleEditMaster(item)}
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
                    );
                  })
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
                Apakah Anda yakin ingin menghapus kategori <strong className="text-slate-800">{itemToDelete.nama_kategori}</strong>?
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

export default KategoriAsal;
