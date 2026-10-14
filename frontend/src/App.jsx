import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import PublicKsop from './pages/PublicKsop';
import DashboardAdmin from './pages/DashboardAdmin';
import DaftarKunjungan from './pages/DaftarKunjungan';
import TujuanKunjungan from './pages/TujuanKunjungan';
import KategoriAsal from './pages/KategoriAsal';
import UserManagement from './pages/UserManagement';
import ActivityLogPage from './pages/ActivityLogPage';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import NotifBot from './pages/NotifBot';
import JadwalPetugas from './pages/JadwalPetugas';
import { stopAllGlobalWebcamStreams } from './components/WebcamCapture';

// Automatic Hardware Camera Cleanup on Route Navigation
const CameraRouteCleaner = () => {
  const location = useLocation();

  useEffect(() => {
    stopAllGlobalWebcamStreams();
  }, [location.pathname]);

  return null;
};

// Error Boundary Component to prevent White Screen of Death
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Uncaught error in React Component Tree:', error, errorInfo);
  }

  handleReset = () => {
    localStorage.removeItem('sitamu_user');
    localStorage.removeItem('sitamu_token');
    window.location.href = '/login';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center font-sans">
          <div className="max-w-md bg-slate-800 border border-slate-700 p-8 rounded-3xl shadow-2xl space-y-4">
            <div className="w-16 h-16 bg-rose-500/20 text-rose-400 rounded-full flex items-center justify-center mx-auto text-2xl font-black">
              !
            </div>
            <h1 className="text-xl font-black text-white">Terjadi Kesalahan Sesi</h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              Terdapat kendala data sesi browser. Klik tombol di bawah ini untuk mereset dan memuat ulang halaman.
            </p>
            <button
              onClick={this.handleReset}
              className="w-full py-3 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg cursor-pointer"
            >
              Reset Sesi & Muat Ulang Halaman
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

import { isSessionValid, updateLastActivity, clearSession, getStoredUser, isQrGuestSession, purgeUnauthorizedGuestAccess } from './utils/session';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';

// Session Auto-Logout & Activity Tracker Component
const SessionActivityTracker = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleUserActivity = () => {
      const user = getStoredUser();
      if (user) {
        if (isSessionValid()) {
          updateLastActivity();
        } else {
          clearSession();
          sessionStorage.setItem('sitamu_session_expired', 'Sesi Anda telah berakhir karena tidak ada aktivitas selama 30 menit. Silakan login kembali.');
          navigate('/login', { replace: true });
        }
      }
    };

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(evt => window.addEventListener(evt, handleUserActivity, { passive: true }));

    const interval = setInterval(() => {
      const user = getStoredUser();
      if (user && !isSessionValid()) {
        clearSession();
        sessionStorage.setItem('sitamu_session_expired', 'Sesi Anda telah berakhir karena tidak ada aktivitas selama 30 menit. Silakan login kembali.');
        navigate('/login', { replace: true });
      }
    }, 15000);

    return () => {
      events.forEach(evt => window.removeEventListener(evt, handleUserActivity));
      clearInterval(interval);
    };
  }, [navigate]);

  return null;
};

// Public Only Route Component (Redirects to /buku-tamu if already logged in with valid session)
const PublicOnlyRoute = ({ children }) => {
  let user = null;
  if (isSessionValid()) {
    user = getStoredUser();
  }
  if (user) {
    return <Navigate to="/buku-tamu" replace />;
  }
  return children;
};

/**
 * AuthorizedRoute
 * Route guard terpusat untuk seluruh rute internal/admin.
 * Mengeliminasi duplikasi verifikasi QR URL param, blacklist check, validitas sesi 30 menit, dan otorisasi role.
 */
const AuthorizedRoute = ({ allowedRoles = [], children }) => {
  const [searchParams] = useSearchParams();
  const urlQrToken = searchParams.get('reg') || searchParams.get('token') || searchParams.get('qr_token');

  // Tolak keras jika tamu QR mencoba mengakses rute admin internal
  if (urlQrToken || isQrGuestSession()) {
    purgeUnauthorizedGuestAccess(urlQrToken);
    return <Navigate to="/login" replace />;
  }

  if (!isSessionValid()) {
    const rawUser = sessionStorage.getItem('sitamu_user') || localStorage.getItem('sitamu_user');
    if (rawUser) {
      sessionStorage.setItem('sitamu_session_expired', 'Sesi Anda telah berakhir karena tidak ada aktivitas selama 30 menit. Silakan login kembali.');
    }
    return <Navigate to="/login" replace />;
  }

  const user = getStoredUser();
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const role = (user.role || 'user').toLowerCase();
    const isAllowed = allowedRoles.some((r) => r.toLowerCase() === role);
    if (!isAllowed) {
      return <Navigate to="/admin" replace />;
    }
  }

  return children;
};

// Route wrapper aliases (mempertahankan semantik deklarasi rute yang jelas & aman)
const ProtectedRoute = ({ children }) => <AuthorizedRoute>{children}</AuthorizedRoute>;

const AdminOnlyRoute = ({ children }) => (
  <AuthorizedRoute allowedRoles={['admin', 'superuser', 'administrator', 'super user']}>
    {children}
  </AuthorizedRoute>
);

const KordinatorAndAdminRoute = ({ children }) => (
  <AuthorizedRoute allowedRoles={['admin', 'superuser', 'administrator', 'super user', 'kordinator', 'koordinator']}>
    {children}
  </AuthorizedRoute>
);

// Route wrapper for Guest Registration: Accessible by valid QR Token OR Logged-in Staff
const GuestOrStaffRoute = ({ children }) => {
  const [searchParams] = useSearchParams();
  const urlQrToken = searchParams.get('reg') || searchParams.get('token') || searchParams.get('qr_token');

  // Allow if scanning QR code or already having valid QR Guest session
  if (urlQrToken || isQrGuestSession()) {
    return children;
  }

  // Allow if logged in staff
  if (isSessionValid() && getStoredUser()) {
    return children;
  }

  return <Navigate to="/login" replace />;
};

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <Router>
        <SessionActivityTracker />
        <CameraRouteCleaner />
        <Routes>
          {/* Entry Root Path: Directs to /buku-tamu if logged in, or /login if unauthenticated */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Navigate to="/buku-tamu" replace />
              </ProtectedRoute>
            }
          />

          {/* Login Page (Redirects to /buku-tamu if already logged in) */}
          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <LoginPage />
              </PublicOnlyRoute>
            }
          />

          {/* Public Guest Registration Route (Form Buku Tamu Digital KSOP) */}
          <Route
            path="/buku-tamu"
            element={
              <GuestOrStaffRoute>
                <PublicKsop />
              </GuestOrStaffRoute>
            }
          />
          <Route
            path="/registrasi"
            element={
              <GuestOrStaffRoute>
                <PublicKsop />
              </GuestOrStaffRoute>
            }
          />

          {/* Admin Dashboard & Management Pages (Protected for User & Admin) */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <DashboardAdmin />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/tamu"
            element={
              <ProtectedRoute>
                <DaftarKunjungan />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/tujuan"
            element={
              <KordinatorAndAdminRoute>
                <TujuanKunjungan />
              </KordinatorAndAdminRoute>
            }
          />
          <Route
            path="/admin/kategori-asal"
            element={
              <KordinatorAndAdminRoute>
                <KategoriAsal />
              </KordinatorAndAdminRoute>
            }
          />
          <Route
            path="/admin/jadwal"
            element={
              <KordinatorAndAdminRoute>
                <JadwalPetugas />
              </KordinatorAndAdminRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <AdminOnlyRoute>
                <UserManagement />
              </AdminOnlyRoute>
            }
          />
          <Route
            path="/admin/log-aktivitas"
            element={
              <KordinatorAndAdminRoute>
                <ActivityLogPage />
              </KordinatorAndAdminRoute>
            }
          />
          <Route
            path="/admin/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/notif-bot"
            element={
              <AdminOnlyRoute>
                <NotifBot />
              </AdminOnlyRoute>
            }
          />
          {/* Fallback Wildcard Route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
          </Router>
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
