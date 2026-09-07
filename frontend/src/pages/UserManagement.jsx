import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminLayout from '../components/AdminLayout';
import Flash from '../components/flash/flash';
import { Users, UserPlus, Edit3, Trash2, Shield, User, Key, Check, X, Search } from 'lucide-react';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Toast state
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    nama: '',
    role: 'user'
  });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Delete modal state
  const [deletingUser, setDeletingUser] = useState(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/users');
      if (res.data.success) {
        setUsers(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openAddModal = () => {
    setEditingUser(null);
    setFormData({ username: '', password: '', nama: '', role: 'user' });
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: '', // Kosong jika tidak ingin ubah password
      nama: user.nama,
      role: user.role
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.username.trim() || !formData.nama.trim()) {
      setFormError('Username dan Nama wajib diisi!');
      return;
    }
    if (!editingUser && !formData.password.trim()) {
      setFormError('Password wajib diisi untuk user baru!');
      return;
    }

    try {
      setSubmitting(true);
      setFormError('');

      if (editingUser) {
        // Edit User
        const res = await axios.put(`/api/users/${editingUser.id}`, formData);
        if (res.data.success) {
          setIsModalOpen(false);
          showToast(`Akun user "${formData.nama}" (@${formData.username}) berhasil diperbarui`, 'success');
          fetchUsers();
        }
      } else {
        // Add User
        const res = await axios.post('/api/users', formData);
        if (res.data.success) {
          setIsModalOpen(false);
          showToast(`Berhasil menambahkan akun user baru "${formData.nama}" (@${formData.username})`, 'success');
          fetchUsers();
        }
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Terjadi kesalahan server');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingUser) return;
    const deletedUsername = deletingUser.username;
    try {
      const res = await axios.delete(`/api/users/${deletingUser.id}`);
      if (res.data.success) {
        setDeletingUser(null);
        showToast(`Akun user @${deletedUsername} berhasil dihapus`, 'success');
        fetchUsers();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Gagal menghapus user', 'error');
    }
  };

  const filteredUsers = users.filter(u => 
    u.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout 
      title="Kelola Akun User" 
      subtitle="Manajemen Pengguna & Hak Akses Pengelola Si-Tamu"
      activeTab="users"
    >
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama, username, atau role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all"
          />
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-500 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md shadow-sky-600/20 transition-all cursor-pointer shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Tambah User Baru</span>
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 font-semibold text-xs animate-pulse">
            Memuat data akun user...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-slate-400 font-semibold text-xs">
            Belum ada akun user terdaftar.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100">
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase">
                  <th className="py-4 px-6 text-center w-16">NO</th>
                  <th className="py-4 px-6">NAMA PETUGAS</th>
                  <th className="py-4 px-6">USERNAME</th>
                  <th className="py-4 px-6 text-center">ROLE / HAK AKSES</th>
                  <th className="py-4 px-6">TANGGAL DIBUAT</th>
                  <th className="py-4 px-6 text-center w-32">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredUsers.map((u, index) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-6 text-center font-bold text-slate-400">{index + 1}</td>
                    <td className="py-4 px-6 font-bold text-slate-900">{u.nama}</td>
                    <td className="py-4 px-6 font-mono text-slate-600">@{u.username}</td>
                    <td className="py-4 px-6 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase ${
                        u.role === 'admin'
                          ? 'bg-rose-50 text-rose-600 border border-rose-200/60'
                          : 'bg-sky-50 text-sky-600 border border-sky-200/60'
                      }`}>
                        <Shield className="w-3 h-3" />
                        {u.role}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-500">
                      {new Date(u.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEditModal(u)}
                          className="p-2 text-sky-600 hover:bg-sky-50 rounded-lg transition-colors cursor-pointer"
                          title="Edit User"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingUser(u)}
                          className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Hapus User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Add/Edit User */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <h3 className="font-extrabold text-base text-slate-900">
                {editingUser ? 'Edit Akun User' : 'Tambah User Baru'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
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
                    placeholder={editingUser ? 'Masukkan password baru...' : 'Masukkan password...'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Role / Hak Akses</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 font-bold"
                >
                  <option value="user">USER (Akses Dashboard & Daftar Kunjungan)</option>
                  <option value="admin">ADMIN (Akses Penuh Semua Modul & Master Data)</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-sky-600 hover:bg-sky-500 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md shadow-sky-600/20 transition-all cursor-pointer"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-base text-slate-900 mb-1">Hapus Akun User?</h3>
            <p className="text-xs text-slate-500 mb-6">
              Apakah Anda yakin ingin menghapus akun <span className="font-bold text-slate-800">@{deletingUser.username}</span>? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeletingUser(null)}
                className="flex-1 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-md shadow-rose-600/20 cursor-pointer"
              >
                Hapus User
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

export default UserManagement;
