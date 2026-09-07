import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Flash from './flash/flash';
import UserProfileModal from './UserProfileModal';
import {
  LayoutDashboard, ClipboardList, Building, Layers, Users, History, ExternalLink, LogOut,
  ChevronLeft, ChevronRight, Menu, X, User
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', key: 'dashboard', to: '/admin', icon: LayoutDashboard },
  { label: 'Daftar Kunjungan', key: 'tamu', to: '/admin/tamu', icon: ClipboardList },
  { label: 'Tujuan Kunjungan', key: 'tujuan', to: '/admin/tujuan', icon: Building },
  { label: 'Kategori Asal', key: 'kategori-asal', to: '/admin/kategori-asal', icon: Layers },
  { label: 'Kelola Akun User', key: 'users', to: '/admin/users', icon: Users },
  { label: 'Log Aktivitas', key: 'log-aktivitas', to: '/admin/log-aktivitas', icon: History },
];

const AdminLayout = ({ children, title, subtitle, activeTab }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sitamu_sidebar_collapsed') === 'true');
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    localStorage.setItem('sitamu_sidebar_collapsed', isCollapsed);
  }, [isCollapsed]);

  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  let user = {};
  try {
    const rawUser = localStorage.getItem('sitamu_user');
    if (rawUser && rawUser !== 'undefined') {
      user = JSON.parse(rawUser);
    }
  } catch (e) {
    user = {};
  }
  const userRole = (user.role || 'admin').toLowerCase();

  useEffect(() => {
    const loginFlash = sessionStorage.getItem('sitamu_login_flash');
    if (loginFlash) {
      setToast({ message: loginFlash, type: 'success' });
      sessionStorage.removeItem('sitamu_login_flash');
    }
  }, []);

  const currentTab = activeTab || (
    location.pathname === '/admin/tamu' ? 'tamu' :
    location.pathname === '/admin/tujuan' ? 'tujuan' :
    location.pathname === '/admin/profile' ? 'profile' : 'dashboard'
  );

  const handleLogout = () => {
    localStorage.removeItem('sitamu_user');
    navigate('/login');
  };

  // Filter navigation items based on Role (USER, KOORDINATOR, SUPER USER)
  const filteredNavItems = navItems.filter(item => {
    if (userRole === 'user') {
      return item.key === 'dashboard' || item.key === 'tamu';
    }
    if (userRole === 'koordinator') {
      return item.key === 'dashboard' || item.key === 'tamu' || item.key === 'tujuan' || item.key === 'kategori-asal' || item.key === 'log-aktivitas';
    }
    return true; // Super User / Admin gets access to all items
  });

  const renderNavLinks = (collapsed = false) => (
    <nav className="p-3 space-y-1.5 flex-1 overflow-y-auto overflow-x-hidden">
      {!collapsed ? (
        <div className="px-3 py-2 text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">
          Menu Utama
        </div>
      ) : (
        <div className="my-2 border-t border-slate-800/80" />
      )}

      {filteredNavItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentTab === item.key;
        return (
          <Link
            key={item.key}
            to={item.to}
            title={collapsed ? item.label : undefined}
            onClick={() => setIsMobileOpen(false)}
            className={`w-full flex items-center rounded-xl text-xs font-bold transition-all ${
              collapsed ? 'justify-center p-3' : 'px-4 py-3 gap-3'
            } ${
              isActive
                ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/30 font-extrabold'
                : 'hover:bg-slate-900 hover:text-white text-slate-400'
            }`}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {!collapsed && <span className="truncate">{item.label}</span>}
          </Link>
        );
      })}

      {!collapsed ? (
        <div className="pt-4 px-3 py-2 text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">
          Akses Publik
        </div>
      ) : (
        <div className="my-2 border-t border-slate-800/80" />
      )}

      <Link
        to="/buku-tamu"
        title={collapsed ? 'Buka Form Registrasi Buku Tamu KSOP' : undefined}
        onClick={() => setIsMobileOpen(false)}
        className={`w-full flex items-center rounded-xl text-xs font-bold text-slate-400 hover:bg-slate-900 hover:text-white transition-all ${
          collapsed ? 'justify-center p-3' : 'px-4 py-3 gap-3'
        }`}
      >
        <ExternalLink className="w-4 h-4 text-sky-400 shrink-0" />
        {!collapsed && <span className="truncate">Daftarkan Tamu</span>}
      </Link>
    </nav>
  );

  const renderUserFooter = (collapsed = false) => (
    <div 
      onClick={() => navigate('/admin/profile')}
      className={`border-t border-slate-900 bg-slate-900/50 flex items-center hover:bg-slate-900/80 transition-colors cursor-pointer ${
        collapsed ? 'p-3 justify-center' : 'p-4 gap-3'
      }`}
      title="Lihat Profil Saya"
    >
      <div className={`flex items-center gap-3 truncate ${collapsed ? 'justify-center' : ''}`}>
        <div className="w-9 h-9 rounded-full bg-sky-600/20 text-sky-400 border border-sky-500/30 flex items-center justify-center font-black text-xs shrink-0 shadow-xs uppercase overflow-hidden">
          {user?.foto ? (
            <img src={user.foto} alt={user.nama} className="w-full h-full object-cover" />
          ) : (
            user?.nama ? user.nama.substring(0, 2) : 'US'
          )}
        </div>
        {!collapsed && (
          <div className="flex-1 truncate">
            <div className="text-xs font-bold text-white truncate">{user.nama || 'Petugas KSOP'}</div>
            <div className="text-[10px] text-sky-400 font-extrabold tracking-wide uppercase flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>
              {userRole}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="h-screen w-screen bg-slate-100 flex flex-col md:flex-row font-sans text-slate-800 antialiased overflow-hidden">
      {/* Mobile Top Header */}
      <header className="md:hidden bg-slate-950 text-white px-4 py-3 border-b border-slate-800 flex items-center justify-between shrink-0 z-30 shadow-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileOpen(true)}
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            aria-label="Buka Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <img src="/images/kementrianperhubungan.png" alt="Logo" className="w-7 h-7 object-contain" />
            <span className="font-black text-white text-base tracking-tight">Si-Tamu</span>
          </div>
        </div>
        <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-rose-400 rounded-lg cursor-pointer">
          <LogOut className="w-4.5 h-4.5" />
        </button>
      </header>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs" onClick={() => setIsMobileOpen(false)} />
          <div className="relative w-72 bg-slate-950 text-slate-300 flex flex-col h-full z-10 shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src="/images/kementrianperhubungan.png" alt="Logo" className="w-8 h-8 object-contain" />
                <div>
                  <h1 className="font-black text-white text-base tracking-tight leading-none">Si-Tamu</h1>
                  <p className="text-[10px] text-sky-400 font-semibold tracking-wide mt-0.5">Panel Administrasi</p>
                </div>
              </div>
              <button onClick={() => setIsMobileOpen(false)} className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            {renderNavLinks(false)}
            {renderUserFooter(false)}
          </div>
        </div>
      )}

      {/* Desktop Fixed Sticky Sidebar */}
      <aside className={`hidden md:flex flex-col shrink-0 bg-slate-950 text-slate-300 border-r border-slate-800 shadow-xl transition-all duration-300 ease-in-out select-none relative h-full z-20 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3.5 top-1/2 -translate-y-1/2 bg-sky-600 hover:bg-sky-500 text-white p-1.5 rounded-full border-2 border-slate-950 shadow-md transition-transform hover:scale-110 cursor-pointer z-30"
          title={isCollapsed ? 'Perluas Sidebar' : 'Ciutkan Sidebar (Tampil Icon Saja)'}
        >
          {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>

        <div className={`border-b border-slate-800 flex items-center ${isCollapsed ? 'p-4 justify-center' : 'p-6 gap-3'}`}>
          <img src="/images/kementrianperhubungan.png" alt="Logo" className="w-9 h-9 object-contain shrink-0" />
          {!isCollapsed && (
            <div className="truncate">
              <h1 className="font-black text-white text-lg tracking-tight leading-none truncate">Si-Tamu</h1>
              <p className="text-[10px] text-sky-400 font-semibold tracking-wide mt-1 truncate">Panel Administrasi</p>
            </div>
          )}
        </div>

        {renderNavLinks(isCollapsed)}
        {renderUserFooter(isCollapsed)}
      </aside>

      {/* Main Content Workspace (Scrollable Independently) */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto overflow-x-auto bg-slate-100">
        <div className="px-6 sm:px-10 pt-6 sm:pt-8 pb-2">
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">{title}</h2>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">
            {subtitle || 'Sistem Informasi Buku Tamu Digital (Si-Tamu) - KSOP'}
          </p>
        </div>
        <div className="px-6 sm:px-10 py-4 space-y-6 pb-12">
          {children}
        </div>
      </main>

      {/* Flash Toast Notification */}
      <Flash toast={toast} onClose={() => setToast(null)} />

      {/* User Profile Edit Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        user={user}
        onProfileUpdated={() => {
          window.location.reload();
        }}
      />
    </div>
  );
};

export default AdminLayout;
