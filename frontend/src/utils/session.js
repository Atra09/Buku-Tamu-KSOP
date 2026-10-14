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

/**
 * Memeriksa apakah user login terotentikasi aktif (bukan guest)
 * @returns {boolean}
 */
export const isAuthenticated = () => {
  return isSessionValid() && !!getStoredToken();
};

/**
 * QR Guest Session Helpers
 */
export const isQrGuestSession = () => {
  try {
    return (
      sessionStorage.getItem('sitamu_session_type') === 'QR_GUEST' ||
      !!sessionStorage.getItem('sitamu_qr_token')
    );
  } catch (e) {
    return false;
  }
};

export const getStoredQrToken = () => {
  try {
    return sessionStorage.getItem('sitamu_qr_token') || null;
  } catch (e) {
    return null;
  }
};

export const getStoredQrExpiresAt = () => {
  try {
    return sessionStorage.getItem('sitamu_qr_expires_at') || null;
  } catch (e) {
    return null;
  }
};

export const setQrGuestSession = (qrToken, guestInfo = {}, expiresAt = null) => {
  try {
    sessionStorage.setItem('sitamu_session_type', 'QR_GUEST');
    sessionStorage.setItem('sitamu_qr_token', qrToken);
    sessionStorage.setItem('sitamu_guest_info', JSON.stringify(guestInfo));
    if (expiresAt) {
      sessionStorage.setItem('sitamu_qr_expires_at', expiresAt);
    }
    sessionStorage.setItem('sitamu_last_activity', Date.now().toString());
  } catch (e) {}
};

export const clearQrGuestSession = () => {
  try {
    sessionStorage.removeItem('sitamu_session_type');
    sessionStorage.removeItem('sitamu_qr_token');
    sessionStorage.removeItem('sitamu_guest_info');
    sessionStorage.removeItem('sitamu_qr_expires_at');
  } catch (e) {}
};

/**
 * Purge immediate unauthorized access attempt by QR guest
 * CATATAN PENTING (Multi-Guest Pos Jaga):
 * Hanya menghapus sesi dan mencatat pembatalan pada perangkat tamu pelanggar (local eviction & blacklist).
 * JANGAN memanggil backend untuk membakar token (/api/qr/revoke) secara global,
 * agar tamu-tamu lain yang jujur sedang mengisi formulir di meja pos jaga tidak ikut terblokir.
 */
export const purgeUnauthorizedGuestAccess = (explicitToken = null) => {
  const token = explicitToken || getStoredQrToken();
  if (token) {
    try {
      // Tandai permanen di perangkat ini bahwa token ini telah dibatalkan karena pelanggaran akses rute admin
      localStorage.setItem('ksop_revoked_' + token, JSON.stringify({
        revoked: true,
        reason: 'UNAUTHORIZED_ADMIN_ACCESS',
        time: Date.now()
      }));
    } catch (e) {}
  }

  clearSession();
  clearQrGuestSession();
  try {
    sessionStorage.setItem(
      'sitamu_session_expired',
      'Akses Ditolak: Anda menggunakan tiket scan barcode tamu. Tiket tidak memiliki izin untuk membuka halaman administrasi/dashboard dan sesi Anda telah diakhiri.'
    );
  } catch (e) {}
};

