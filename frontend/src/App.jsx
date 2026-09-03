import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import PublicKsop from './pages/PublicKsop';
import DashboardAdmin from './pages/DashboardAdmin';
import DataTamu from './pages/DataTamu';
import LoginPage from './pages/LoginPage';

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
              <DataTamu />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
