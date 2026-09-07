import React, { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import UserProfileModal from '../components/UserProfileModal';
import Flash from '../components/flash/flash';
import { User, Shield, Key, Edit3, Calendar, CheckCircle2 } from 'lucide-react';

const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const loadUserData = () => {
    const storedUser = localStorage.getItem('sitamu_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        setUser(null);
      }
    }
  };

  useEffect(() => {
    loadUserData();
  }, []);

  const getRoleLabel = (roleStr) => {
    const r = (roleStr || 'user').toLowerCase();
    if (r === 'admin' || r === 'superuser' || r === 'super user') {
      return { title: 'SUPER USER', badge: 'bg-rose-50 text-rose-600 border-rose-200', desc: 'Akses Penuh Semua Modul & Kelola Akun User' };
    }
    if (r === 'koordinator') {
      return { title: 'KOORDINATOR', badge: 'bg-emerald-50 text-emerald-600 border-emerald-200', desc: 'Akses Dashboard, Daftar Kunjungan, Master Data & Log Aktivitas' };
    }
    return { title: 'USER', badge: 'bg-sky-50 text-sky-600 border-sky-200', desc: 'Akses Dashboard & Daftar Kunjungan' };
  };

  const roleData = getRoleLabel(user?.role);

  return (
    <AdminLayout
      title="Profil Saya"
      subtitle="Informasi Akun & Pengaturan Profil Pengelola Si-Tamu"
      activeTab="profile"
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Main Profile Header Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          {/* Banner Header */}
          <div className="h-36 bg-gradient-to-r from-sky-600 via-indigo-600 to-blue-700 relative">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent"></div>
          </div>

          {/* Profile Content Container */}
          <div className="px-6 md:px-8 pb-8 relative -mt-16 flex flex-col sm:flex-row items-center sm:items-end justify-between gap-6">
            {/* Avatar & Basic Info */}
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 text-center sm:text-left">
              <div className="w-28 h-28 rounded-full border-4 border-white shadow-xl bg-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                {user?.foto ? (
                  <img src={user.foto} alt={user.nama} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-sky-500 to-indigo-600 text-white font-black text-4xl flex items-center justify-center uppercase">
                    {user?.nama ? user.nama.charAt(0) : 'U'}
                  </div>
                )}
              </div>
              <div className="mb-1 space-y-1">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">{user?.nama || 'Petugas KSOP'}</h2>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-extrabold uppercase border ${roleData.badge}`}>
                    <Shield className="w-3 h-3" />
                    {roleData.title}
                  </span>
                </div>
                <p className="text-xs font-mono text-slate-500 font-medium">@{user?.username || 'username'}</p>
              </div>
            </div>

            {/* Edit Profile Action Button */}
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white px-6 py-3 rounded-2xl font-bold text-xs shadow-lg shadow-sky-600/25 transition-all cursor-pointer hover:scale-102 active:scale-98 shrink-0"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit Profil</span>
            </button>
          </div>
        </div>

        {/* User Detail Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Personal Info Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <User className="w-4 h-4 text-sky-600" />
              <span>Informasi Personal</span>
            </h3>
            
            <div className="space-y-3.5 text-xs">
              <div>
                <span className="text-slate-400 font-medium block mb-1">Nama Lengkap Petugas</span>
                <span className="font-bold text-slate-900 text-sm">{user?.nama || '-'}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block mb-1">Username Login</span>
                <span className="font-mono font-bold text-slate-700 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/80 inline-block">
                  @{user?.username || '-'}
                </span>
              </div>
            </div>
          </div>

          {/* Access & Security Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Shield className="w-4 h-4 text-sky-600" />
              <span>Hak Akses & Keamanan</span>
            </h3>
            
            <div className="space-y-3.5 text-xs">
              <div>
                <span className="text-slate-400 font-medium block mb-1">Role Akun</span>
                <span className="font-bold text-slate-900 uppercase flex items-center gap-1.5 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  {roleData.title}
                </span>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{roleData.desc}</p>
              </div>
              <div>
                <span className="text-slate-400 font-medium block mb-1">Password</span>
                <span className="font-mono text-slate-500 italic">•••••••• (Tersimpan Aman)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      <Flash toast={toast} onClose={() => setToast(null)} />

      {/* Edit Profile Modal */}
      <UserProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        user={user}
        onProfileUpdated={(updatedUser) => {
          setUser(updatedUser);
          setToast({ message: 'Profil berhasil diperbarui!', type: 'success' });
        }}
      />
    </AdminLayout>
  );
};

export default ProfilePage;
