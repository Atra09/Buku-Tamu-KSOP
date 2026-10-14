const jwt = require('jsonwebtoken');

/**
 * Middleware untuk memverifikasi JSON Web Token (JWT) dari request header
 * Mengikuti pola standar dari Manajemen-Clearance-Kapal-Tradisional
 */
const verifyToken = (req, res, next) => {
  try {
    const rawAuth = req.header('Authorization') || req.header('x-access-token');
    const token = rawAuth ? rawAuth.replace(/^Bearer\s+/i, '').trim() : null;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Akses ditolak. Token tidak ditemukan.',
        msg: 'tidak ada akses'
      });
    }

    // Deteksi jika token yang dikirim adalah token scan QR tamu (string 64 hex)
    if (/^[a-f0-9]{64}$/i.test(token)) {
      return res.status(403).json({
        success: false,
        code: 'ACCESS_DENIED_QR_GUEST',
        message: 'Akses ditolak mentah-mentah. Tiket scan barcode tamu tidak diizinkan mengakses panel ini.',
        msg: 'tidak ada akses'
      });
    }

    const secret = process.env.JWT_SECRET || 'sitamu_ksop_secret_key_2026_rwerwerwer33';

    jwt.verify(token, secret, (err, decoded) => {
      if (err) {
        return res.status(401).json({
          success: false,
          message: 'Token tidak valid atau telah kedaluwarsa.',
          msg: 'invalid / expired token'
        });
      }

      if (decoded && decoded.token_type === 'QR_GUEST') {
        return res.status(403).json({
          success: false,
          code: 'ACCESS_DENIED_QR_GUEST',
          message: 'Akses ditolak mentah-mentah. Tiket scan barcode tamu tidak diizinkan mengakses panel ini.',
          msg: 'tidak ada akses'
        });
      }

      req.user = decoded;
      next();
    });
  } catch (error) {
    console.error('[JWT Middleware Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada fungsi autentikasi token.',
      msg: 'Terjadi kesalahan pada fungsi jwt'
    });
  }
};

/**
 * Middleware untuk memverifikasi token jika ada di header,
 * namun tetap melanjutkan request jika tidak ada token (opsional).
 */
const optionalVerifyToken = (req, res, next) => {
  try {
    const rawAuth = req.header('Authorization') || req.header('x-access-token');
    const token = rawAuth ? rawAuth.replace(/^Bearer\s+/i, '').trim() : null;

    if (!token || /^[a-f0-9]{64}$/i.test(token)) {
      return next();
    }

    const secret = process.env.JWT_SECRET || 'sitamu_ksop_secret_key_2026_rwerwerwer33';
    jwt.verify(token, secret, (err, decoded) => {
      if (!err && decoded && decoded.token_type !== 'QR_GUEST') {
        req.user = decoded;
      }
      next();
    });
  } catch (e) {
    next();
  }
};

module.exports = verifyToken;
module.exports.optionalVerifyToken = optionalVerifyToken;
