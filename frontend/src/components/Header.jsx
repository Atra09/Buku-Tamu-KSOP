import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Calendar, LayoutDashboard, UserCheck, LogOut, User } from 'lucide-react';
import IconProfil from './iconprofil';
import UserProfileModal from './UserProfileModal';

import { isQrGuestSession, getStoredQrExpiresAt } from '../utils/session';
import { useAuth } from '../context/AuthContext';
import Timer from './timer';

const Header = ({
  companyName = "KSOP Si-Tamu",
  guestMode = false,
  expiresAt = null,
  onTimerExpire = null
}) => {
  const [dateTime, setDateTime] = useState(new Date());
  const { user: authUser, isAuthenticated, logout, updateUser } = useAuth();

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Defensively detect if this page session is in guest mode
  const hasTokenInUrl = Boolean(new URLSearchParams(location.search).get('reg') || new URLSearchParams(location.search).get('token') || new URLSearchParams(location.search).get('qr_token'));
  const isGuest = Boolean(guestMode || isQrGuestSession() || hasTokenInUrl);

  // Ambil sisa durasi masa aktif tiket QR barcode
  const effectiveExpiresAt = expiresAt || (isGuest ? getStoredQrExpiresAt() : null);

  // User hanya aktif jika bukan guest mode
  const user = isGuest ? null : authUser;

  useEffect(() => {
    const timer = setInterval(() => setDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatIndonesianDate = (date) => {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];

    const dayName = days[date.getDay()];
    const dayNum = date.getDate();
    const monthName = months[date.getMonth()];
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${dayName}, ${dayNum} ${monthName} ${year} ${hours}:${minutes}:${seconds}`;
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isHome = location.pathname === '/buku-tamu' || location.pathname === '/registrasi';

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-sky-200/60 shadow-xs sticky top-0 z-50 py-2.5 sm:py-3 px-3.5 sm:px-6 md:px-8 xl:px-12 transition-all">
      <div className="w-full flex flex-col md:flex-row items-center justify-between gap-2.5 md:gap-4">
        {/* Left: Logo Kemenhub & Project Name + Mobile Floating Timer di kanan atas header */}
        <div className="w-full md:w-auto flex items-center justify-between md:justify-start gap-2 sm:gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 pr-1">
            <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center shrink-0">
              <img
                src="/images/kementrianperhubungan.png"
                alt="Logo Kementerian Perhubungan"
                className="w-9 h-9 sm:w-11 sm:h-11 object-contain filter drop-shadow-xs"
              />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl md:text-2xl font-black text-sky-950 tracking-tight flex items-center gap-2 truncate">
                {companyName}
              </h1>
              <p className="text-[9px] sm:text-[10px] md:text-[11px] font-extrabold text-sky-600 tracking-wider uppercase truncate">
                Sistem Informasi Registrasi & Manajemen Tamu
              </p>
            </div>
          </div>

          {/* Mobile QR Countdown Timer: Melayang di pojok kanan atas header, mengikuti saat discroll tanpa menutupi form */}
          {isGuest && effectiveExpiresAt && (
            <div className="md:hidden shrink-0">
              <Timer
                expiresAt={effectiveExpiresAt}
                onExpire={onTimerExpire}
                isCompact={true}
              />
            </div>
          )}
        </div>

        {/* Right: Desktop Timer, Date/Clock & Account Profile Dropdown */}
        <div className="w-full md:w-auto flex items-center justify-between md:justify-end gap-2 sm:gap-3">
          {/* Desktop QR Countdown Timer */}
          {isGuest && effectiveExpiresAt && (
            <div className="hidden md:flex shrink-0">
              <Timer
                expiresAt={effectiveExpiresAt}
                onExpire={onTimerExpire}
                isCompact={false}
              />
            </div>
          )}

          <div className="flex-1 md:flex-initial flex items-center gap-1.5 sm:gap-2 bg-sky-50 text-sky-900 text-[11px] sm:text-xs md:text-sm font-bold px-2.5 sm:px-3.5 py-1.5 rounded-full border border-sky-200/80 shadow-xs min-w-0">
            <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-500 shrink-0" />
            <span className="truncate">{formatIndonesianDate(dateTime)}</span>
          </div>

          {/* Account Profile or Guest Mode Badge */}
          {isGuest ? (
            <div className="flex items-center gap-1.5 sm:gap-2 bg-sky-50 text-sky-950 text-[11px] sm:text-xs font-extrabold px-2.5 sm:px-3.5 py-1.5 rounded-full border border-sky-200/80 shadow-xs shrink-0">
              <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-gradient-to-tr from-sky-600 to-blue-700 flex items-center justify-center text-white text-[9px] sm:text-[10px] font-black shrink-0 shadow-xs">
                <UserCheck className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-sky-100" />
              </div>
              <span className="text-sky-900 font-bold hidden sm:inline">Petugas Jaga</span>
              <span className="text-[9px] sm:text-[10px] bg-sky-200/60 text-sky-800 font-bold px-1.5 py-0.2 rounded-full">
                Pos KSOP
              </span>
            </div>
          ) : (isAuthenticated && user && user.nama) ? (
            <IconProfil
              user={user}
              menuContent={(closeMenu) => (
                <>
                  <div>
                    {!isHome ? (
                      <Link
                        to="/buku-tamu"
                        onClick={closeMenu}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-sky-50 hover:text-sky-700 transition-colors"
                      >
                        <UserCheck className="w-4 h-4 text-sky-600" />
                        <span>Halaman Utama Tamu</span>
                      </Link>
                    ) : (
                      <Link
                        to="/admin"
                        onClick={closeMenu}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-sky-50 hover:text-sky-700 transition-colors"
                      >
                        <LayoutDashboard className="w-4 h-4 text-sky-600" />
                        <span>Dashboard Admin</span>
                      </Link>
                    )}
                    <Link
                      to="/admin/profile"
                      onClick={closeMenu}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-sky-50 hover:text-sky-700 transition-colors"
                    >
                      <User className="w-4 h-4 text-sky-600" />
                      <span>Profil Saya</span>
                    </Link>
                  </div>
                  <div className="border-t border-slate-100 mt-1 pt-1">
                    <button
                      type="button"
                      onClick={() => { closeMenu(); handleLogout(); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer text-left"
                    >
                      <LogOut className="w-4 h-4 text-rose-500" />
                      <span>Keluar Akun</span>
                    </button>
                  </div>
                </>
              )}
            />
          ) : (
            /* Unauthenticated public visitor fallback */
            <div className="flex items-center gap-1.5 sm:gap-2 bg-sky-50 text-sky-900 text-[11px] sm:text-xs font-bold px-2.5 sm:px-3 py-1.5 rounded-full border border-sky-200/80 shadow-xs shrink-0">
              <UserCheck className="w-3.5 h-3.5 text-sky-600 shrink-0" />
              <span>Buku Tamu KSOP</span>
            </div>
          )}
        </div>
      </div>

      {/* Profile Edit Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        user={user}
        onProfileUpdated={(updatedUser) => {
          if (updateUser) updateUser(updatedUser);
        }}
      />
    </header>
  );
};

export default Header;
