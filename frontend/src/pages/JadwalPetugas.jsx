import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CalendarDays, Plus, User, ShieldCheck } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import DeleteModal from '../components/modal/delete';
import Table, { TableActions } from '../components/table';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const HARI_LIST = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
const HARI_COLORS = {
  Senin: 'bg-sky-50 text-sky-700 border-sky-200',
  Selasa: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  Rabu: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Kamis: 'bg-amber-50 text-amber-700 border-amber-200',
  Jumat: 'bg-teal-50 text-teal-700 border-teal-200',
  Sabtu: 'bg-orange-50 text-orange-700 border-orange-200',
  Minggu: 'bg-rose-50 text-rose-700 border-rose-200'
};

const inputClass = "w-full text-xs font-semibold px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-400 focus:border-sky-400 bg-slate-50 text-slate-800";

const JadwalPetugas = () => {
  const [jadwalList, setJadwalList] = useState([]);
  const [petugasOptions, setPetugasOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const { user } = useAuth();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    user_id: '',
    hari: 'Senin',
    shift: 'Piket Harian',
    keterangan: '',
    status: 'Aktif'
  });

  const updateField = (key, val) => setFormData(prev => ({ ...prev, [key]: val }));

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resJadwal, resPetugas] = await Promise.all([
        axios.get('/api/jadwal'),
        axios.get('/api/jadwal/petugas')
      ]);
      if (resJadwal.data?.success) setJadwalList(resJadwal.data.data || []);
      if (resPetugas.data?.success) {
        const users = resPetugas.data.data || [];
        setPetugasOptions(users);
        if (!formData.user_id && users.length > 0) updateField('user_id', users[0].id);
      }
    } catch {
      showToast('Gagal memuat data jadwal petugas', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      user_id: petugasOptions[0]?.id || '',
      hari: 'Senin',
      shift: 'Piket Harian',
      keterangan: '',
      status: 'Aktif'
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.user_id || !formData.hari) return showToast('Pilih Petugas dan Hari piket!', 'error');

    setSaving(true);
    try {
      if (editingId) {
        await axios.put(`/api/jadwal/${editingId}`, formData);
        showToast('Jadwal petugas berhasil diperbarui!');
      } else {
        await axios.post('/api/jadwal', formData);
        showToast('Jadwal petugas baru berhasil ditambahkan!');
      }
      resetForm();
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Gagal menyimpan jadwal', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setFormData({
      user_id: item.user_id,
      hari: item.hari || 'Senin',
      shift: item.shift || 'Piket Harian',
      keterangan: item.keterangan || '',
      status: item.status || 'Aktif'
    });
  };

  const executeDelete = async () => {
    if (!itemToDelete) return;
    setDeleting(true);
    try {
      await axios.delete(`/api/jadwal/${itemToDelete.id}`);
      showToast(`Jadwal hari ${itemToDelete.hari} berhasil dihapus`);
      setItemToDelete(null);
      fetchData();
    } catch {
      showToast('Gagal menghapus jadwal', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AdminLayout
      title="Kelola Jadwal Petugas"
      subtitle="Sistem Informasi Buku Tamu Digital (Si-Tamu) - Panel Administrator"
      activeTab="jadwal"
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Form Tambah / Edit */}
        <div className="md:col-span-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 h-fit">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-sky-600" />
              {editingId ? 'Edit Jadwal Petugas' : 'Tambah Jadwal Petugas'}
            </h3>
            {editingId && (
              <button type="button" onClick={resetForm} className="text-xs font-bold text-rose-500 hover:underline cursor-pointer">
                Batal Edit
              </button>
            )}
          </div>

          <p className="text-xs text-slate-500">
            Kelola penugasan piket harian petugas pos jaga untuk sinkronisasi pendaftaran tamu dan sistem QR code dinamis.
          </p>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Hari Piket <span className="text-rose-500">*</span></label>
              <select value={formData.hari} onChange={(e) => updateField('hari', e.target.value)} required className={`${inputClass} font-bold cursor-pointer`}>
                {HARI_LIST.map((h) => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Petugas / Satpam Jaga <span className="text-rose-500">*</span></label>
              <select value={formData.user_id} onChange={(e) => updateField('user_id', e.target.value)} required className={`${inputClass} font-bold cursor-pointer`}>
                <option value="" disabled>-- Pilih Petugas Jaga --</option>
                {petugasOptions.map((p) => (
                  <option key={p.id} value={p.id}>{p.nama} ({p.role ? p.role.toUpperCase() : 'USER'} - @{p.username})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Shift / Waktu Jaga <span className="text-slate-400 font-normal">(cth: Piket Harian)</span></label>
              <input type="text" placeholder="Contoh: Piket Harian / 08:00 - 16:00" value={formData.shift} onChange={(e) => updateField('shift', e.target.value)} className={inputClass} />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Keterangan / Pos Jaga <span className="text-slate-400 font-normal">(Opsional)</span></label>
              <input type="text" placeholder="Contoh: Pos Jaga Utama KSOP" value={formData.keterangan} onChange={(e) => updateField('keterangan', e.target.value)} className={inputClass} />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Status Penugasan <span className="text-rose-500">*</span></label>
              <select value={formData.status} onChange={(e) => updateField('status', e.target.value)} className={`${inputClass} font-bold cursor-pointer`}>
                <option value="Aktif">Aktif</option>
                <option value="Nonaktif">Nonaktif</option>
              </select>
            </div>

            <button type="submit" disabled={saving} className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer">
              <Plus className="w-4 h-4" />
              {saving ? 'Menyimpan...' : editingId ? 'Simpan Perubahan' : 'Tambah Jadwal'}
            </button>
          </form>
        </div>

        {/* Tabel Master Jadwal */}
        <div className="md:col-span-8 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-slate-800 text-sm">Tabel Jadwal Petugas ({jadwalList.length})</h3>
            <p className="text-xs text-slate-400">Daftar penugasan piket petugas pos jaga berdasarkan hari dinas</p>
          </div>

          <Table
            columns={[
              { label: 'NO', className: 'p-3 w-10 text-center' },
              { label: 'HARI', className: 'p-3 w-28' },
              { label: 'PETUGAS JAGA', className: 'p-3' },
              { label: 'SHIFT / KET', className: 'p-3' },
              { label: 'STATUS', className: 'p-3 w-24 text-center' },
              { label: 'AKSI', className: 'p-3 w-20 text-center' },
            ]}
            data={jadwalList}
            loading={loading}
            emptyMessage="Belum ada jadwal petugas terdaftar."
            maxHeight="max-h-[420px]"
            renderRow={(item, idx) => (
              <tr key={item.id || idx} className="hover:bg-sky-50/40 transition-colors">
                <td className="p-3 text-center font-bold text-slate-500">{idx + 1}</td>
                <td className="p-3">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-extrabold border ${HARI_COLORS[item.hari] || 'bg-slate-50 text-slate-700 border-slate-200'}`}>
                    {item.hari}
                  </span>
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center text-white text-xs font-black shrink-0 overflow-hidden">
                      {item.User?.foto ? (
                        <img src={item.User.foto} alt="" className="w-full h-full object-cover" />
                      ) : (
                        item.User?.nama?.charAt(0).toUpperCase() || <User className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <div className="font-extrabold text-slate-800 text-xs">{item.User?.nama || 'Petugas'}</div>
                      <div className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-sky-500" />
                        @{item.User?.username || '-'} ({item.User?.role || 'user'})
                      </div>
                    </div>
                  </div>
                </td>
                <td className="p-3">
                  <div className="text-xs font-bold text-slate-700">{item.shift || 'Piket Harian'}</div>
                  {item.keterangan && <div className="text-[11px] text-slate-400 font-medium">{item.keterangan}</div>}
                </td>
                <td className="p-3 text-center">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-extrabold ${item.status === 'Aktif' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                    {item.status || 'Aktif'}
                  </span>
                </td>
                <td className="p-3 text-center">
                  <TableActions onEdit={() => handleEdit(item)} onDelete={() => setItemToDelete(item)} />
                </td>
              </tr>
            )}
          />
        </div>
      </div>

      {/* Modal & Toast */}
      <DeleteModal
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={executeDelete}
        loading={deleting}
        title="Konfirmasi Hapus Jadwal"
        message={
          <p>
            Hapus jadwal hari <strong className="text-slate-800">{itemToDelete?.hari}</strong> untuk petugas <strong className="text-slate-800">{itemToDelete?.User?.nama}</strong>?
          </p>
        }
      />
    </AdminLayout>
  );
};

export default JadwalPetugas;
