import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Layers } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import DeleteModal from '../components/modal/delete';
import Table, { TableActions } from '../components/table';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const KategoriAsal = () => {
  const [masterKategoriObjects, setMasterKategoriObjects] = useState([]);
  const [newKategori, setNewKategori] = useState('');
  const [butuhInstansi, setButuhInstansi] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [addingMaster, setAddingMaster] = useState(false);

  // Modals & Toast State
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const { user } = useAuth();
  const { showToast } = useToast();

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

          <Table
            columns={[
              { label: 'NO', className: 'p-3 w-12 text-center' },
              { label: 'NAMA KATEGORI ASAL', className: 'p-3' },
              { label: 'TIPE INPUT FORM', className: 'p-3' },
              { label: 'AKSI', className: 'p-3 w-24 text-center' },
            ]}
            data={masterKategoriObjects}
            emptyMessage="Belum ada kategori asal terdaftar."
            maxHeight="max-h-[320px]"
            renderRow={(item, idx) => {
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
                    <TableActions
                      onEdit={() => handleEditMaster(item)}
                      onDelete={() => setItemToDelete(item)}
                    />
                  </td>
                </tr>
              );
            }}
          />
        </div>

      </div>

      {/* Custom Delete Confirmation Modal */}
      <DeleteModal
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={executeDelete}
        loading={deleting}
        title="Konfirmasi Hapus Data"
        message={
          <p>
            Apakah Anda yakin ingin menghapus kategori{' '}
            <strong className="text-slate-800">{itemToDelete?.nama_kategori}</strong>?
          </p>
        }
      />
    </AdminLayout>
  );
};

export default KategoriAsal;
