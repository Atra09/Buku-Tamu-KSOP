import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import PublicKsop from './pages/PublicKsop';
import DashboardAdmin from './pages/DashboardAdmin';
import DaftarKunjungan from './pages/DaftarKunjungan';
import TujuanKunjungan from './pages/TujuanKunjungan';
import KategoriAsal from './pages/KategoriAsal';
import UserManagement from './pages/UserManagement';
import ActivityLogPage from './pages/ActivityLogPage';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
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

// Public Only Route Component (Redirects to /admin if already logged in)
const PublicOnlyRoute = ({ children }) => {
  let user = null;
  try {
    const rawUser = localStorage.getItem('sitamu_user');
    if (rawUser && rawUser !== 'undefined') {
      user = JSON.parse(rawUser);
    }
  } catch (e) {
    user = null;
  }
  if (user) {
    return <Navigate to="/buku-tamu" replace />;
  }
  return children;
};

// Protected Route Component for any logged in User/Admin
const ProtectedRoute = ({ children }) => {
  let user = null;
  try {
    const rawUser = localStorage.getItem('sitamu_user');
    if (rawUser && rawUser !== 'undefined') {
      user = JSON.parse(rawUser);
    }
  } catch (e) {
    user = null;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Route wrapper restricted strictly to Admin role
const AdminOnlyRoute = ({ children }) => {
  let user = null;
  try {
    const rawUser = localStorage.getItem('sitamu_user');
    if (rawUser && rawUser !== 'undefined') {
      user = JSON.parse(rawUser);
    }
  } catch (e) {
    user = null;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  const role = (user.role || 'admin').toLowerCase();
  if (role && role !== 'admin' && role !== 'superadmin' && role !== 'administrator') {
    return <Navigate to="/buku-tamu" replace />;
  }
  return children;
};

function App() {
  return (
    <ErrorBoundary>
      <Router>
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
            <ProtectedRoute>
              <PublicKsop />
            </ProtectedRoute>
          }
        />
        <Route
          path="/registrasi"
          element={
            <ProtectedRoute>
              <PublicKsop />
            </ProtectedRoute>
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
            <ProtectedRoute>
              <TujuanKunjungan />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/kategori-asal"
          element={
            <ProtectedRoute>
              <KategoriAsal />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute>
              <UserManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/log-aktivitas"
          element={
            <ProtectedRoute>
              <ActivityLogPage />
            </ProtectedRoute>
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
        {/* Fallback Wildcard Route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  </ErrorBoundary>
  );
}

export default App;
