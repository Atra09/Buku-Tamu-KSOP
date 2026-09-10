import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, ChevronDown } from 'lucide-react';

const IconProfil = ({ user, userRole, handleLogout }) => {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const displayRole = (userRole || user?.role || 'ADMIN').toUpperCase();
  const userName = user?.nama || 'Petugas KSOP';
  const userInitials = user?.nama ? user.nama.trim().substring(0, 1).toUpperCase() : 'B';

  return (
    <div className="relative z-30">
      <div
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center gap-3 bg-sky-50/90 text-slate-800 px-3.5 py-2 rounded-2xl shadow-xs border border-sky-200/90 hover:bg-sky-100/70 hover:border-sky-300 transition-all cursor-pointer select-none"
        title="Klik untuk menu profil"
      >
        {/* Avatar Circle */}
        <div className="w-[32px] h-[32px] aspect-square rounded-full bg-sky-600 text-white flex items-center justify-center font-black text-xs shrink-0 uppercase overflow-hidden shadow-xs">
          {user?.foto ? (
            <img src={user.foto} alt={userName} className="w-full h-full object-cover" />
          ) : (
            userInitials
          )}
        </div>

        {/* Name & Role Badge */}
        <div className="flex flex-col text-left">
          <span className="text-xs font-extrabold text-slate-800 leading-tight truncate max-w-[140px] sm:max-w-[180px]">
            {userName}
          </span>
          <div className="text-[10px] text-sky-600 font-extrabold tracking-wider uppercase flex items-center gap-1.5 mt-0.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block shadow-xs"></span>
            <span>{displayRole}</span>
          </div>
        </div>

        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
      </div>

      {/* Dropdown Menu */}
      {dropdownOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setDropdownOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 py-1.5 transition-all">
            <button
              onClick={() => {
                setDropdownOpen(false);
                navigate('/admin/profile');
              }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-sky-50 hover:text-sky-700 transition-colors cursor-pointer text-left"
            >
              <User className="w-4 h-4 text-sky-600" />
              <span>Profil Saya</span>
            </button>
            <button
              onClick={() => {
                setDropdownOpen(false);
                if (handleLogout) handleLogout();
              }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer text-left border-t border-slate-100 mt-1 pt-2.5"
            >
              <LogOut className="w-4 h-4 text-rose-500" />
              <span>Logout</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default IconProfil;
