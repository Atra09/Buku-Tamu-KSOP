// Helper Manajemen Sesi 30 Menit (Auto-Logout saat Inactive & Isolation via sessionStorage)

const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 Menit (dalam milidetik)

/**
 * Mendapatkan data user dari sessionStorage
 */
export const getStoredUser = () => {
  try {
    const rawUser = sessionStorage.getItem('sitamu_user');
    if (rawUser && rawUser !== 'undefined') {
      return JSON.parse(rawUser);
    }
  } catch (e) {}
  return null;
};

/**
 * Mendapatkan token otentikasi dari sessionStorage
 */
export const getStoredToken = () => {
  try {
    return sessionStorage.getItem('sitamu_token') || null;
  } catch (e) {
    return null;
  }
};

/**
 * Menyimpan data login user & token ke sessionStorage
 */
export const setSessionData = (user, token) => {
  try {
    sessionStorage.setItem('sitamu_user', JSON.stringify(user));
    if (token) {
      sessionStorage.setItem('sitamu_token', token);
    }
    sessionStorage.setItem('sitamu_last_activity', Date.now().toString());

    // Bersihkan sisa-sisa localStorage lama untuk keamanan
    localStorage.removeItem('sitamu_user');
    localStorage.removeItem('sitamu_token');
    localStorage.removeItem('sitamu_last_activity');
  } catch (e) {}
};

/**
 * Memperbarui timestamp aktivitas terakhir user di sessionStorage
 */
export const updateLastActivity = () => {
  try {
    const user = sessionStorage.getItem('sitamu_user');
    if (user && user !== 'undefined') {
      sessionStorage.setItem('sitamu_last_activity', Date.now().toString());
    }
  } catch (e) {}
};

/**
 * Menghapus seluruh data sesi dari sessionStorage dan localStorage
 */
export const clearSession = () => {
  try {
    sessionStorage.removeItem('sitamu_user');
    sessionStorage.removeItem('sitamu_token');
    sessionStorage.removeItem('sitamu_last_activity');
    localStorage.removeItem('sitamu_user');
    localStorage.removeItem('sitamu_token');
    localStorage.removeItem('sitamu_last_activity');
  } catch (e) {}
};

/**
 * Memeriksa apakah sesi user masih valid (belum melebihi 30 menit sejak aktivitas terakhir di sessionStorage)
 * @returns {boolean}
 */
export const isSessionValid = () => {
  try {
    const rawUser = sessionStorage.getItem('sitamu_user');
    const lastActivity = sessionStorage.getItem('sitamu_last_activity');

    if (!rawUser || rawUser === 'undefined') {
      return false;
    }

    if (!lastActivity) {
      updateLastActivity();
      return true;
    }

    const now = Date.now();
    const elapsed = now - parseInt(lastActivity, 10);

    if (elapsed > SESSION_TIMEOUT_MS) {
      clearSession();
      return false;
    }

    return true;
  } catch (e) {
    clearSession();
    return false;
  }
};
