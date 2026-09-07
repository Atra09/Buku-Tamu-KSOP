import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Building2, Clock, Calendar, LayoutDashboard, UserCheck, ChevronDown, LogOut, User } from 'lucide-react';
import UserProfileModal from './UserProfileModal';

const Header = ({ companyName = "KSOP Si-Tamu" }) => {
  const [dateTime, setDateTime] = useState(new Date());
  const [user, setUser] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => setDateTime(new Date()), 1000);
    
    // Load logged in user info
    const storedUser = localStorage.getItem('sitamu_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (err) {
        setUser(null);
      }
    }

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
    localStorage.removeItem('sitamu_token');
    localStorage.removeItem('sitamu_user');
    setDropdownOpen(false);
    navigate('/login');
  };

  const isHome = location.pathname === '/buku-tamu' || location.pathname === '/registrasi';

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-sky-200/60 shadow-xs sticky top-0 z-50 py-3 px-4 md:px-8 xl:px-12 transition-all">
      <div className="w-full flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Left: Logo Kemenhub & Project Name */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 flex items-center justify-center shrink-0">
            <img
              src="/images/kementrianperhubungan.png"
              alt="Logo Kementerian Perhubungan"
              className="w-11 h-11 object-contain filter drop-shadow-xs"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Logo_Kementerian_Perhubungan.png/600px-Logo_Kementerian_Perhubungan.png";
              }}
            />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-sky-950 tracking-tight flex items-center gap-2">
              {companyName}
            </h1>
            <p className="text-[10px] md:text-[11px] font-extrabold text-sky-600 tracking-wider uppercase">
              Sistem Informasi Registrasi & Manajemen Tamu
            </p>
          </div>
        </div>

        {/* Right: Date/Clock & Account Profile Dropdown */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 bg-sky-50 text-sky-900 text-xs md:text-sm font-bold px-3.5 py-1.5 rounded-full border border-sky-200/80 shadow-xs">
            <Calendar className="w-4 h-4 text-sky-500" />
            <span>{formatIndonesianDate(dateTime)}</span>
          </div>

          {/* Account Profile Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2.5 bg-sky-50 hover:bg-sky-100 text-sky-950 text-xs font-extrabold px-3.5 py-1.5 rounded-full border border-sky-200/80 shadow-xs transition-all cursor-pointer"
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center text-white text-[11px] font-black shrink-0 shadow-xs overflow-hidden">
                {user?.foto ? (
                  <img src={user.foto} alt={user.nama} className="w-full h-full object-cover" />
                ) : user?.nama ? (
                  user.nama.charAt(0).toUpperCase()
                ) : (
                  'A'
                )}
              </div>
              <span className="hidden sm:inline">{user?.nama || 'Administrator'}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-sky-600 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {dropdownOpen && (
              <>
                {/* Backdrop overlay */}
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setDropdownOpen(false)} 
                />
                
                {/* Dropdown Card */}
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-sky-100 z-50 py-1.5 transition-all">
                  <div>
                    {!isHome ? (
                      <Link
                        to="/buku-tamu"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-sky-50 hover:text-sky-700 transition-colors"
                      >
                        <UserCheck className="w-4 h-4 text-sky-600" />
                        <span>Halaman Utama Tamu</span>
                      </Link>
                    ) : (
                      <Link
                        to="/admin"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-sky-50 hover:text-sky-700 transition-colors"
                      >
                        <LayoutDashboard className="w-4 h-4 text-sky-600" />
                        <span>Dashboard Admin</span>
                      </Link>
                    )}

                    <Link
                      to="/admin/profile"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-sky-50 hover:text-sky-700 transition-colors"
                    >
                      <User className="w-4 h-4 text-sky-600" />
                      <span>Profil Saya</span>
                    </Link>
                  </div>

                  <div className="border-t border-slate-100 mt-1 pt-1">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer text-left"
                    >
                      <LogOut className="w-4 h-4 text-rose-500" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Profile Edit Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        user={user}
        onProfileUpdated={(updatedUser) => {
          setUser(updatedUser);
        }}
      />
    </header>
  );
};

export default Header;
