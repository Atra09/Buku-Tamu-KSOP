import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import PublicKsop from './pages/PublicKsop';
import DashboardAdmin from './pages/DashboardAdmin';
import DaftarKunjungan from './pages/DaftarKunjungan';
import TujuanKunjungan from './pages/TujuanKunjungan';
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

// Protected Route Component for Admin pages
const ProtectedRoute = ({ children }) => {
  const user = localStorage.getItem('sitamu_user');
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    <Router>
      <CameraRouteCleaner />
      <Routes>
        {/* Public Guest Registration KSOP View (Protected) */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <PublicKsop />
            </ProtectedRoute>
          }
        />

        {/* Login Page */}
        <Route path="/login" element={<LoginPage />} />

        {/* Admin Dashboard & Management Pages (Protected) */}
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
      </Routes>
    </Router>
  );
}

export default App;
