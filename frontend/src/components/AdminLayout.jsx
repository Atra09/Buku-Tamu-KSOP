import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Flash from './flash/flash';
import UserProfileModal from './UserProfileModal';
import Sidebar from './dashboard/sidebar';
import IconProfil from './iconprofil';

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
    location.pathname === '/admin/kategori-asal' ? 'kategori-asal' :
    location.pathname === '/admin/users' ? 'users' :
    location.pathname === '/admin/notif-bot' ? 'notif-bot' :
    location.pathname === '/admin/log-aktivitas' ? 'log-aktivitas' :
    location.pathname === '/admin/profile' ? 'profile' : 'dashboard'
  );

  const handleLogout = () => {
    localStorage.removeItem('sitamu_user');
    navigate('/login');
  };

  return (
    <div className="h-screen w-screen bg-slate-100 flex flex-col md:flex-row font-sans text-slate-800 antialiased overflow-hidden">
      {/* Sidebar Component */}
      <Sidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
        currentTab={currentTab}
        user={user}
        userRole={userRole}
        handleLogout={handleLogout}
      />

      {/* Main Content Workspace (Scrollable Independently) */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto overflow-x-auto bg-slate-100">
        <div className="px-6 sm:px-10 pt-6 sm:pt-8 pb-2 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">{title || 'Dashboard'}</h2>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">
              {subtitle || 'Sistem Informasi Buku Tamu Digital (Si-Tamu) - KSOP'}
            </p>
          </div>

          {/* Top Right Icon Profil */}
          <IconProfil
            user={user}
            userRole={userRole}
            handleLogout={handleLogout}
          />
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
