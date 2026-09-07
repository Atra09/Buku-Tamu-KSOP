import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Username dan password wajib diisi');
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post('/api/auth/login', { username, password });

      if (res.data && res.data.success) {
        // Save user & token to localStorage
        localStorage.setItem('sitamu_token', res.data.token);
        localStorage.setItem('sitamu_user', JSON.stringify(res.data.user));
        sessionStorage.setItem('sitamu_login_flash', `Selamat datang, ${res.data.user?.nama || res.data.user?.username || 'User'}!`);
        
        // Navigate to Halaman Utama Buku Tamu Digital KSOP
        navigate('/buku-tamu');
      } else {
        setError(res.data.message || 'Login gagal, periksa kembali data Anda');
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Gagal terhubung ke server login. Silakan coba lagi.'
      );
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
      ></div>

      {/* Dark/Soft Blue Overlay for Contrast */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900/50 via-slate-900/40 to-slate-900/60 backdrop-blur-xs"></div>

      <div className="max-w-md w-full relative z-10">
        
        {/* Login Card (Light Theme) */}
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 sm:p-10 shadow-2xl border border-white/40">
          
          {/* Brand Header */}
          <div className="text-center mb-8">
            <img
              src="/images/kementrianperhubungan.png"
              alt="Logo Kementerian Perhubungan"
              className="w-16 h-16 object-contain mx-auto mb-3 filter drop-shadow-xs"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Logo_Kementerian_Perhubungan.png/600px-Logo_Kementerian_Perhubungan.png";
              }}
            />
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              KSOP Si-Tamu
            </h1>
            <p className="text-xs text-slate-500 font-semibold mt-1">
              Sistem Informasi Buku Tamu Digital
            </p>
          </div>

          {/* Section Header */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900">Sign In</h2>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Masukkan username dan password Anda untuk masuk!
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-3 animate-shake">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

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
                value={username}
                onChange={(e) => setUsername(e.target.value)}
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-4 pr-11 py-3 text-xs font-bold rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:ring-2 focus:ring-sky-400 focus:border-sky-400 transition-all outline-hidden placeholder:text-slate-400 placeholder:font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
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
