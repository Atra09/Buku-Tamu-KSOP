import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const LoginPage = () => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    const expiredMsg = sessionStorage.getItem('sitamu_session_expired');
    if (expiredMsg) {
      showToast(expiredMsg, 'error');
      sessionStorage.removeItem('sitamu_session_expired');
    }
  }, [showToast]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    const cleanUsername = formData.username.trim();
    const cleanPassword = formData.password.trim();

    if (!cleanUsername || !cleanPassword) {
      showToast('Username dan password wajib diisi!', 'error');
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post('/api/auth/login', {
        username: cleanUsername,
        password: cleanPassword
      });

      if (res.data && res.data.success) {
        login(res.data.user, res.data.token);
        sessionStorage.setItem(
          'sitamu_login_flash',
          `Selamat datang, ${res.data.user?.nama || res.data.user?.username || 'User'}!`
        );
        navigate('/buku-tamu');
      } else {
        showToast(res.data.message || 'Login gagal, periksa kembali data Anda', 'error');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Gagal terhubung ke server login. Silakan coba lagi.';
      showToast(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative font-sans overflow-hidden bg-slate-900">

      {/* Blurred Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center filter blur-md scale-105 opacity-80"
        style={{ backgroundImage: `url('/images/ksop_service_bg.png')` }}
      />

      {/* Dark/Soft Blue Overlay for Contrast */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900/50 via-slate-900/40 to-slate-900/60 backdrop-blur-xs" />

      <div className="max-w-md w-full relative z-10">
        
        {/* Login Card (Light Theme) */}
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 sm:p-10 shadow-2xl border border-white/40">
          
          {/* Brand Header */}
          <div className="text-center mb-8">
            <img
              src="/images/kementrianperhubungan.png"
              alt="Logo Kementerian Perhubungan"
              className="w-16 h-16 object-contain mx-auto mb-3 filter drop-shadow-xs"
            />
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              KSOP Si-Tamu
            </h1>
            <p className="text-xs text-slate-500 font-bold mt-1">
              Sistem Informasi Registrasi &amp; Manajemen Tamu
            </p>
          </div>

          {/* Section Header */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900">Sign In</h2>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Masukkan username dan password Anda untuk masuk!
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            
            {/* Username Input */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-2">
                Username
              </label>
              <input
                type="text"
                placeholder="Masukkan username Anda"
                value={formData.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                required
                className="w-full px-4 py-3 text-xs font-bold rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:ring-2 focus:ring-sky-400 focus:border-sky-400 transition-all outline-hidden placeholder:text-slate-400 placeholder:font-medium"
              />
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Masukkan password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  required
                  className="w-full pl-4 pr-11 py-3 text-xs font-bold rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:ring-2 focus:ring-sky-400 focus:border-sky-400 transition-all outline-hidden placeholder:text-slate-400 placeholder:font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-sm rounded-2xl shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 mt-2"
            >
              {loading ? 'Proses Authentikasi...' : 'Sign In'}
            </button>
          </form>

        </div>
      </div>

    </div>
  );
};

export default LoginPage;
