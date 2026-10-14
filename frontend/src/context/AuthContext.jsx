import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  getStoredUser,
  getStoredToken,
  setSessionData as setStoredSessionData,
  clearSession as clearStoredSession,
  isSessionValid,
  updateLastActivity
} from '../utils/session';

const AuthContext = createContext(null);

/**
 * AuthProvider Terpusat untuk Seluruh Aplikasi
 * Mengeliminasi 18+ duplikasi pembacaan JSON.parse(sessionStorage.getItem('sitamu_user'))
 * dan menyediakan state reaktif untuk user, role, token, login, logout, dan updateUser.
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    return isSessionValid() ? getStoredUser() : null;
  });

  const [token, setToken] = useState(() => {
    return isSessionValid() ? getStoredToken() : null;
  });

  // Sync state dengan storage ketika tab kembali aktif atau event storage terpicu
  const refreshUser = useCallback(() => {
    if (isSessionValid()) {
      setUser(getStoredUser());
      setToken(getStoredToken());
    } else {
      setUser(null);
      setToken(null);
    }
  }, []);

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'sitamu_user' || e.key === 'sitamu_token' || e.key === null) {
        refreshUser();
      }
    };

    const handleFocus = () => {
      if (!isSessionValid() && user) {
        // Sesi telah kedaluwarsa saat tab di-background
        setUser(null);
        setToken(null);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [refreshUser, user]);

  const login = useCallback((userData, userToken) => {
    setStoredSessionData(userData, userToken);
    setUser(userData);
    setToken(userToken);
  }, []);

  const logout = useCallback(() => {
    clearStoredSession();
    setUser(null);
    setToken(null);
  }, []);

  const updateUser = useCallback((updatedFields) => {
    setUser((prev) => {
      const merged = { ...(prev || {}), ...updatedFields };
      try {
        sessionStorage.setItem('sitamu_user', JSON.stringify(merged));
        updateLastActivity();
      } catch (e) {
        console.error('Gagal memperbarui session user di storage:', e);
      }
      return merged;
    });
  }, []);

  // Perhitungan role secara konsisten
  const role = useMemo(() => {
    return (user?.role || 'user').toLowerCase();
  }, [user]);

  const isAdmin = useMemo(() => {
    return role === 'admin' || role === 'superuser' || role === 'administrator' || role === 'super user';
  }, [role]);

  const isKordinator = useMemo(() => {
    return isAdmin || role === 'kordinator' || role === 'koordinator';
  }, [isAdmin, role]);

  const authenticated = useMemo(() => {
    return Boolean(user && token && isSessionValid());
  }, [user, token]);

  const value = useMemo(
    () => ({
      user,
      token,
      role,
      isAdmin,
      isKordinator,
      isAuthenticated: authenticated,
      login,
      logout,
      updateUser,
      refreshUser
    }),
    [user, token, role, isAdmin, isKordinator, authenticated, login, logout, updateUser, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Custom Hook useAuth
 * Digunakan oleh seluruh komponen/halaman untuk mengakses data sesi pengguna terotentikasi.
 *
 * @example
 * const { user, role, isAdmin, isKordinator, logout } = useAuth();
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    // Fallback defensif jika hook dipanggil di luar AuthProvider
    const fallbackUser = isSessionValid() ? getStoredUser() : null;
    const fallbackRole = (fallbackUser?.role || 'user').toLowerCase();
    const fallbackIsAdmin =
      fallbackRole === 'admin' || fallbackRole === 'superuser' || fallbackRole === 'administrator';
    const fallbackIsKordinator = fallbackIsAdmin || fallbackRole === 'kordinator' || fallbackRole === 'koordinator';

    return {
      user: fallbackUser,
      token: getStoredToken(),
      role: fallbackRole,
      isAdmin: fallbackIsAdmin,
      isKordinator: fallbackIsKordinator,
      isAuthenticated: Boolean(fallbackUser && isSessionValid()),
      login: () => {},
      logout: () => clearStoredSession(),
      updateUser: () => {},
      refreshUser: () => {}
    };
  }
  return context;
};

export default AuthContext;
