const rateLimit = require('express-rate-limit');

/**
 * Rate Limiter untuk Endpoint Login (/api/auth/login)
 * Mencegah serangan brute-force dan credential stuffing.
 * Batas: 10 percobaan per 15 menit per alamat IP.
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 10, // Maksimal 10 percobaan login
  standardHeaders: true, // Kembalikan info rate limit di header `RateLimit-*`
  legacyHeaders: false, // Nonaktifkan header `X-RateLimit-*`
  message: {
    success: false,
    message: 'Terlalu banyak percobaan login yang gagal. Silakan coba kembali dalam 15 menit demi keamanan akun Anda.'
  }
});

/**
 * Rate Limiter untuk Registrasi Tamu Publik (/api/tamu)
 * Mencegah flood/spam form pendaftaran dari bot atau script otomatis.
 * Batas: 20 permohonan per menit per alamat IP.
 */
const guestRegisterLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 menit
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Terlalu banyak request pendaftaran dari perangkat/jaringan ini. Harap tunggu 1 menit.'
  }
});

/**
 * Rate Limiter untuk Endpoint Log Publik (/api/logs)
 * Mencegah flooding penyimpanan tabel activity_logs.
 * Batas: 30 log per menit per IP.
 */
const publicLogsLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Terlalu banyak request pencatatan aktivitas. Harap tunggu sejenak.'
  }
});

module.exports = {
  loginLimiter,
  guestRegisterLimiter,
  publicLogsLimiter
};
