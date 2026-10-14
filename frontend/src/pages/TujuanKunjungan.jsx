import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Building, Plus } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import DeleteModal from '../components/modal/delete';
import Table, { TableActions } from '../components/table';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const TujuanKunjungan = () => {
  const [masterTujuanObjects, setMasterTujuanObjects] = useState([]);
  const [newTujuan, setNewTujuan] = useState('');
  const [newNamaPejabat, setNewNamaPejabat] = useState('');
  const [newNoHp, setNewNoHp] = useState('');
  const [editingTujuanId, setEditingTujuanId] = useState(null);
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
        setMasterTujuanObjects(res.data.data.tujuanList || []);
      }
    } catch (err) {
      console.error('Error fetching master data:', err);
    }
  };

  const resetForm = () => {
    setEditingTujuanId(null);
    setNewTujuan('');
    setNewNamaPejabat('');
    setNewNoHp('');
  };

  const handleAddOrUpdateMasterTujuan = async (e) => {
    e.preventDefault();
    if (!newTujuan.trim()) return;
    try {
      setAddingMaster(true);
      const payload = {
        nama_tujuan: newTujuan.trim(),
        nama_pejabat: newNamaPejabat.trim() || null,
        no_hp: newNoHp.trim() || null
      };

      if (editingTujuanId) {
        await axios.put(`/api/master/tujuan/${editingTujuanId}`, payload);
        showToast('Perubahan tujuan kunjungan berhasil disimpan!', 'success');
      } else {
        await axios.post('/api/master/tujuan', payload);
        showToast('Tujuan kunjungan baru berhasil ditambahkan!', 'success');
      }
      resetForm();
      fetchMasterData();
    } catch (err) {
      showToast('Gagal menyimpan Master Tujuan', 'error');
    } finally {
      setAddingMaster(false);
    }
  };

  const handleEditMasterTujuan = (item) => {
    setEditingTujuanId(item.id);
    setNewTujuan(item.nama_tujuan || '');
    setNewNamaPejabat(item.nama_pejabat || '');
    setNewNoHp(item.no_hp || '');
  };

  const executeDelete = async () => {
    if (!itemToDelete) return;
    setDeleting(true);
    try {
      await axios.delete(`/api/master/tujuan/${itemToDelete.id}`);
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
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

        {/* Form Input Tambah / Edit Master Tujuan */}
        <div className="md:col-span-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 h-fit">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
              <Building className="w-4 h-4 text-sky-600" />
              {editingTujuanId ? 'Edit Tujuan Kunjungan' : 'Tambah Tujuan Kunjungan'}
            </h3>
            {editingTujuanId && (
              <button
                onClick={resetForm}
                className="text-xs font-bold text-rose-500 hover:underline cursor-pointer"
              >
                Batal Edit
              </button>
            )}
          </div>

          <p className="text-xs text-slate-500">
            Kelola nama unit/jabatan tujuan, nama pejabat/penanggung jawab, dan nomor WhatsApp untuk penerimaan notifikasi tamu otomatis.
          </p>

          <form onSubmit={handleAddOrUpdateMasterTujuan} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nama Tujuan / Jabatan <span className="text-rose-500">*</span>
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

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nama Pejabat / Penanggung Jawab <span className="text-slate-400 font-normal">(Opsional)</span>
              </label>
              <input
                type="text"
                placeholder="Contoh: Kapten Ahmad, M.Mar / Ibu Rahma, S.H."
                value={newNamaPejabat}
                onChange={(e) => setNewNamaPejabat(e.target.value)}
                className="w-full text-xs font-semibold px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-400 focus:border-sky-400 bg-slate-50 text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                No. HP / WhatsApp Tujuan <span className="text-slate-400 font-normal">(cth: 08123456789)</span>
              </label>
              <input
                type="tel"
                placeholder="Masukkan No. HP / WA untuk Notifikasi WA"
                value={newNoHp}
                onChange={(e) => setNewNoHp(e.target.value)}
                className="w-full text-xs font-semibold px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-400 focus:border-sky-400 bg-slate-50 text-slate-800"
              />
            </div>

            <div className="flex gap-2 pt-1">
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
        <div className="md:col-span-8 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-slate-800 text-sm">
              Tabel Master Tujuan ({masterTujuanObjects.length})
            </h3>
            <p className="text-xs text-slate-400">Kelola opsi tujuan kunjungan tamu dan nomor notifikasi WhatsApp pejabat</p>
          </div>

          <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
            <Table
              columns={[
                { label: 'NO', className: 'p-3 w-10 text-center' },
                { label: 'TUJUAN / JABATAN', className: 'p-3' },
                { label: 'PEJABAT / KONTAK', className: 'p-3' },
                { label: 'NO. HP / WA', className: 'p-3' },
                { label: 'AKSI', className: 'p-3 w-20 text-center' },
              ]}
              data={masterTujuanObjects}
              emptyMessage="Belum ada master tujuan terdaftar."
              maxHeight=""
              renderRow={(item, idx) => (
                <tr key={item.id || idx} className="hover:bg-sky-50/40 transition-colors">
                  <td className="p-3 text-center font-bold text-slate-500">{idx + 1}</td>
                  <td className="p-3 font-extrabold text-slate-800">{item.nama_tujuan}</td>
                  <td className="p-3 text-slate-700 font-semibold">{item.nama_pejabat || '-'}</td>
                  <td className="p-3 font-mono font-bold text-sky-700">
                    {item.no_hp ? (
                      <span className="inline-flex items-center bg-sky-50 px-2.5 py-0.5 rounded-lg border border-sky-200">
                        {item.no_hp}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic font-normal">Belum diisi</span>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    <TableActions
                      onEdit={() => handleEditMasterTujuan(item)}
                      onDelete={() => setItemToDelete(item)}
                    />
                  </td>
                </tr>
              )}
            />
          </div>
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
            Apakah Anda yakin ingin menghapus tujuan{' '}
            <strong className="text-slate-800">{itemToDelete?.nama_tujuan}</strong>?
          </p>
        }
      />
    </AdminLayout>
  );
};

export default TujuanKunjungan;
