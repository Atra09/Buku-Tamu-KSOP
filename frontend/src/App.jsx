import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import PublicKsop from './pages/PublicKsop';
import DashboardAdmin from './pages/DashboardAdmin';
import DaftarKunjungan from './pages/DaftarKunjungan';
import TujuanKunjungan from './pages/TujuanKunjungan';
import UserManagement from './pages/UserManagement';
import ActivityLogPage from './pages/ActivityLogPage';
import LoginPage from './pages/LoginPage';
import { stopAllGlobalWebcamStreams } from './components/WebcamCapture';

// Automatic Hardware Camera Cleanup on Route Navigation
const CameraRouteCleaner = () => {
  const location = useLocation();

  useEffect(() => {
    stopAllGlobalWebcamStreams();
  }, [location.pathname]);

  return null;
};

// Protected Route Component for any logged in User/Admin
const ProtectedRoute = ({ children }) => {
  const user = localStorage.getItem('sitamu_user');
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Route wrapper restricted strictly to Admin role
const AdminOnlyRoute = ({ children }) => {
  const userStr = localStorage.getItem('sitamu_user');
  if (!userStr) {
    return <Navigate to="/login" replace />;
  }
  try {
    const user = JSON.parse(userStr);
    const role = (user.role || 'admin').toLowerCase();
    if (role !== 'admin') {
      return <Navigate to="/admin" replace />;
    }
  } catch (err) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    <Router>
      <CameraRouteCleaner />
      <Routes>
        {/* Public Guest Registration KSOP View (Public Access) */}
        <Route path="/" element={<PublicKsop />} />

        {/* Login Page */}
        <Route path="/login" element={<LoginPage />} />

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

        {/* Master Data Pages (Restricted Strictly to Admin Role) */}
        <Route
          path="/admin/tujuan"
          element={
            <AdminOnlyRoute>
              <TujuanKunjungan />
            </AdminOnlyRoute>
          }
        />
        <Route
          path="/admin/kategori-asal"
          element={
            <AdminOnlyRoute>
              <KategoriAsal />
            </AdminOnlyRoute>
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
            <AdminOnlyRoute>
              <ActivityLogPage />
            </AdminOnlyRoute>
          }
        />
        {/* Fallback Wildcard Route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
