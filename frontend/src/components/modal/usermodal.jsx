import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, User, Key, X } from 'lucide-react';

/**
 * UserModal Component (Modular, Ultra Lightweight & Isolated)
 *
 * Mengelola pembuatan (create) dan pembaruan (edit) data user secara terisolasi,
 * sehingga tabel utama di UserManagement tidak memikul beban re-render saat user mengetik formulir.
 *
 * @param {boolean} isOpen - Status keterbukaan modal
 * @param {function} onClose - Handler penutupan modal
 * @param {object|null} editingUser - Data user yang sedang diedit (null jika tambah baru)
 * @param {function} onSuccess - Callback saat submit berhasil (menerima pesan sukses)
 */
const UserModal = ({
  isOpen = false,
  onClose,
  editingUser = null,
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    nama: '',
    role: 'user'
  });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Inisialisasi formulir setiap kali modal dibuka atau target editingUser berganti
  useEffect(() => {
    if (!isOpen) return;

    if (editingUser) {
      const r = (editingUser.role || '').toLowerCase();
      setFormData({
        username: editingUser.username || '',
        password: '', // Kosong jika tidak ingin ubah password
        nama: editingUser.nama || '',
        role: (r === 'koordinator' || r === 'kordinator') ? 'kordinator' : (r || 'user')
      });
    } else {
      setFormData({
        username: '',
        password: '',
        nama: '',
        role: 'user'
      });
    }
    setFormError('');
    setSubmitting(false);
  }, [isOpen, editingUser]);

  // Handle tombol Escape & kunci scroll body
  useEffect(() => {
    if (!isOpen) return;

    const handleEsc = (e) => {
      if (e.key === 'Escape' && !submitting) {
        onClose?.();
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleEsc);

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, submitting, onClose]);

  // Jangan render apa pun jika modal tidak terbuka agar performa tetap ringan
  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.username.trim() || !formData.nama.trim()) {
      setFormError('Username dan Nama wajib diisi!');
      return;
    }

    if (!editingUser) {
      if (!formData.password || formData.password.trim().length < 6) {
        setFormError('Password wajib diisi minimal 6 karakter!');
        return;
      }
    } else {
      if (formData.password.trim() && formData.password.trim().length < 6) {
        setFormError('Password minimal 6 karakter!');
        return;
      }
    }

    try {
      setSubmitting(true);
      setFormError('');

      if (editingUser) {
        // Edit User
        const res = await axios.put(`/api/users/${editingUser.id}`, formData);
        if (res.data.success) {
          onClose?.();
          if (onSuccess) {
            onSuccess(`Akun user "${formData.nama}" (@${formData.username}) berhasil diperbarui`);
          }
        }
      } else {
        // Add User Baru
        const res = await axios.post('/api/users', formData);
        if (res.data.success) {
          onClose?.();
          if (onSuccess) {
            onSuccess(`Berhasil menambahkan akun user baru "${formData.nama}" (@${formData.username})`);
          }
        }
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Terjadi kesalahan server');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed -top-10 -bottom-10 -left-10 -right-10 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs">
      {/* Backdrop overlay click */}
      <div
        className="fixed inset-0 -top-10 -bottom-10 -left-10 -right-10"
        onClick={() => !submitting && onClose?.()}
      />

      {/* Modal Card */}
      <div className="relative bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 z-10">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
          <h3 className="font-extrabold text-base text-slate-900">
            {editingUser ? 'Edit Akun User' : 'Tambah User Baru'}
          </h3>
          <button
            type="button"
            onClick={() => !submitting && onClose?.()}
            className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {formError && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-xs font-bold">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap Petugas</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                required
                placeholder="Contoh: Budi Santoso"
                value={formData.nama}
                onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Username</label>
            <div className="relative">
              <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                required
                placeholder="Contoh: budi_ksop"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Password {editingUser && <span className="text-slate-400 font-normal">(Kosongkan jika tidak diubah)</span>}
            </label>
            <div className="relative">
              <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="password"
                placeholder={editingUser ? 'Masukkan password baru (min. 6 karakter)...' : 'Masukkan password (min. 6 karakter)...'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
              />
            </div>
            <p className="text-[10px] text-slate-400 font-medium mt-1">Minimal 6 karakter</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Role / Hak Akses</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 font-bold"
            >
              <option value="user">USER (Akses Dashboard & Daftar Kunjungan)</option>
              <option value="kordinator">KOORDINATOR (Akses Dashboard, Daftar Kunjungan, Master Data & Log Aktivitas)</option>
              <option value="admin">SUPER USER (Akses Penuh Semua Modul & Kelola User)</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              disabled={submitting}
              onClick={() => onClose?.()}
              className="px-4 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="bg-sky-600 hover:bg-sky-500 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md shadow-sky-600/20 transition-all cursor-pointer disabled:opacity-60"
            >
              {submitting ? 'Menyimpan...' : 'Simpan User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserModal;
