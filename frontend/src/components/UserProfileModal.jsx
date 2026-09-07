import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { X, Camera, User, Key, Shield, Eye, EyeOff, Check, AlertCircle } from 'lucide-react';

const UserProfileModal = ({ isOpen, onClose, user, onProfileUpdated }) => {
  const [nama, setNama] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [foto, setFoto] = useState('');
  const [previewFoto, setPreviewFoto] = useState('');
  const [rawFile, setRawFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (user) {
      setNama(user.nama || '');
      setUsername(user.username || '');
      setFoto(user.foto || '');
      setPreviewFoto(user.foto || '');
      setRawFile(null);
      setPassword('');
      setError('');
      setSuccessMsg('');
    }
  }, [user, isOpen]);

  if (!isOpen || !user) return null;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('Ukuran file foto terlalu besar (Maksimal 5MB)');
      return;
    }

    setRawFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewFoto(reader.result);
      setFoto(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!nama.trim() || !username.trim()) {
      setError('Nama Lengkap dan Username wajib diisi');
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append('userId', user?.id || '');
      formData.append('id', user?.id || '');
      formData.append('currentUsername', user?.username || '');
      formData.append('nama', nama.trim());
      formData.append('username', username.trim());
      if (password.trim()) {
        formData.append('password', password.trim());
      }

      if (rawFile) {
        formData.append('foto', rawFile);
      } else if (foto) {
        formData.append('foto', foto);
      }

      const res = await axios.put('/api/auth/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        const updatedUser = res.data.user;
        
        // Update local session
        const currentSessionStr = localStorage.getItem('sitamu_user');
        if (currentSessionStr) {
          try {
            const currentSession = JSON.parse(currentSessionStr);
            const mergedSession = { ...currentSession, ...updatedUser };
            localStorage.setItem('sitamu_user', JSON.stringify(mergedSession));
          } catch (e) {
            localStorage.setItem('sitamu_user', JSON.stringify(updatedUser));
          }
        }

        setSuccessMsg('Profil berhasil diperbarui!');
        if (onProfileUpdated) {
          onProfileUpdated(updatedUser);
        }
        
        setTimeout(() => {
          onClose();
        }, 1200);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memperbarui profil');
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeLabel = (roleStr) => {
    const r = (roleStr || 'user').toLowerCase();
    if (r === 'admin' || r === 'superuser' || r === 'super user') return 'SUPER USER';
    if (r === 'koordinator') return 'KOORDINATOR';
    return 'USER';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
          <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
            <User className="w-5 h-5 text-sky-600" />
            <span>Edit Profil</span>
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-xl text-xs font-bold flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Avatar Section */}
          <div className="flex flex-col items-center justify-center space-y-2 py-2">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full border-4 border-sky-100 overflow-hidden bg-slate-100 flex items-center justify-center shadow-md">
                {previewFoto ? (
                  <img src={previewFoto} alt="Foto Profil" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-sky-500 to-indigo-600 text-white font-black text-3xl flex items-center justify-center uppercase">
                    {nama.charAt(0) || 'U'}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 p-2 bg-sky-600 hover:bg-sky-500 text-white rounded-full shadow-lg border-2 border-white transition-transform active:scale-95 cursor-pointer"
                title="Ganti Foto Profil"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/png, image/jpeg, image/jpg"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs font-extrabold text-sky-600 hover:text-sky-700 hover:underline cursor-pointer"
            >
              Ganti Foto Profil
            </button>
            <p className="text-[10px] text-slate-400 font-semibold">Format: JPG, JPEG, PNG (Maks 5MB)</p>
          </div>

          {/* Nama Lengkap Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                required
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                placeholder="Masukkan nama lengkap Anda..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 font-bold"
              />
            </div>
          </div>

          {/* Username Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Username</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Masukkan username Anda..."
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 font-mono font-bold"
            />
          </div>

          {/* Password Baru Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Password Baru <span className="text-slate-400 font-normal">(Kosongkan jika tidak diubah)</span>
            </label>
            <div className="relative">
              <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ketik password baru..."
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 font-bold"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Role Read-only */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Role / Hak Akses</label>
            <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-sky-600" />
                <span className="text-xs font-extrabold text-slate-800">
                  {getRoleBadgeLabel(user.role)}
                </span>
              </div>
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">READ ONLY</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400 italic font-medium">
              Role hanya dapat diubah melalui Manajemen User
            </p>
          </div>

          {/* Buttons Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-sky-600 hover:bg-sky-500 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md shadow-sky-600/20 transition-all cursor-pointer flex items-center gap-2"
            >
              {loading ? 'Simpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserProfileModal;
