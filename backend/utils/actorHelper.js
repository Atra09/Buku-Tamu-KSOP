/**
 * Helper terpusat untuk mengekstrak identitas aktor (user_nama dan user_id)
 * guna pencatatan audit log di tabel activity_logs secara konsisten dan aman.
 * 
 * Aturan Keamanan Anti-Spoofing:
 * 1. Prioritas utama: Objek `req.user` yang telah diverifikasi secara kriptografis oleh middleware JWT.
 * 2. Jika unauthenticated (misal dari form tamu / pos jaga publik), JANGAN izinkan client
 *    mengaitkan diri ke user_id akun admin/user lain di database.
 */
const resolveActor = async (req, defaultFallback = 'Admin') => {
  // 1. Identitas resmi dari token JWT yang valid
  if (req.user && req.user.id) {
    return {
      actorNama: req.user.nama || req.user.username || defaultFallback,
      userId: req.user.id
    };
  }

  // 2. Request tanpa autentikasi JWT:
  // Cegah pemalsuan identitas akun terdaftar. Jangan pernah memberikan userId dari database.
  const safeFallback = (defaultFallback === 'Admin' || defaultFallback === 'Administrator')
    ? 'Sistem (Pos Jaga)'
    : defaultFallback;

  return {
    actorNama: safeFallback,
    userId: null
  };
};

module.exports = {
  resolveActor
};
