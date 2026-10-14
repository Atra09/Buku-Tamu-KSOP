import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminLayout from '../components/AdminLayout';
import DeleteModal from '../components/modal/delete';
import { useToast } from '../context/ToastContext';
import UserModal from '../components/modal/usermodal';
import Table, { TableActions } from '../components/table';
import { UserPlus, Shield, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const UserManagement = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { showToast } = useToast();

  // Modal create/edit user state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  // Delete modal state
  const [deletingUser, setDeletingUser] = useState(null);
  const [deleting, setDeleting] = useState(false);

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
    setIsModalOpen(true);
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingUser) return;
    const deletedUsername = deletingUser.username;
    try {
      setDeleting(true);
      const res = await axios.delete(`/api/users/${deletingUser.id}`);
      if (res.data.success) {
        setDeletingUser(null);
        showToast(`Akun user @${deletedUsername} berhasil dihapus`, 'success');
        fetchUsers();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Gagal menghapus user', 'error');
    } finally {
      setDeleting(false);
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
      <Table
        columns={[
          { label: 'NO', className: 'py-3.5 px-6 text-center w-16' },
          { label: 'NAMA PETUGAS', className: 'py-3.5 px-6' },
          { label: 'USERNAME', className: 'py-3.5 px-6' },
          { label: 'ROLE / HAK AKSES', className: 'py-3.5 px-6 text-center' },
          { label: 'TANGGAL DIBUAT', className: 'py-3.5 px-6' },
          { label: 'AKSI', className: 'py-3.5 px-6 text-center w-28' },
        ]}
        data={filteredUsers}
        loading={loading}
        loadingMessage="Memuat data akun user..."
        emptyMessage="Belum ada akun user terdaftar."
        maxHeight=""
        className="rounded-2xl border border-slate-200/80 shadow-xs"
        renderRow={(u, index) => {
          const isSelf = currentUser && Number(currentUser.id) === Number(u.id);
          return (
            <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
              <td className="py-4 px-6 text-center font-bold text-slate-400">{index + 1}</td>
              <td className="py-4 px-6 font-bold text-slate-900">
                <div className="flex items-center gap-2">
                  <span>{u.nama}</span>
                  {isSelf && (
                    <span className="text-[10px] font-extrabold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200">
                      Anda
                    </span>
                  )}
                </div>
              </td>
              <td className="py-4 px-6 font-mono text-slate-600">@{u.username}</td>
              <td className="py-4 px-6 text-center">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase ${u.role === 'admin' || u.role === 'superuser' || u.role === 'super user'
                    ? 'bg-rose-50 text-rose-600 border border-rose-200/60'
                    : u.role === 'koordinator'
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/60'
                      : 'bg-sky-50 text-sky-600 border border-sky-200/60'
                  }`}>
                  <Shield className="w-3 h-3" />
                  {u.role === 'admin' ? 'SUPER USER' : u.role.toUpperCase()}
                </span>
              </td>
              <td className="py-4 px-6 text-slate-500">
                {new Date(u.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
              </td>
              <td className="py-4 px-6 text-center">
                <TableActions
                  onEdit={() => openEditModal(u)}
                  onDelete={isSelf ? undefined : () => setDeletingUser(u)}
                  deleteTitle={isSelf ? 'Akun Anda sedang aktif' : 'Hapus User'}
                />
              </td>
            </tr>
          );
        }}
      />

      {/* Modal Add/Edit User (Modular, Isolated & Lightweight) */}
      <UserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingUser={editingUser}
        onSuccess={(msg) => {
          showToast(msg, 'success');
          fetchUsers();
        }}
      />

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={!!deletingUser}
        onClose={() => setDeletingUser(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Hapus Akun User?"
        confirmText="Hapus User"
        message={
          <p>
            Apakah Anda yakin ingin menghapus akun <span className="font-bold text-slate-800">@{deletingUser?.username}</span>? Tindakan ini tidak dapat dibatalkan.
          </p>
        }
      />
    </AdminLayout>
  );
};

export default UserManagement;
