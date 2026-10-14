const { User } = require('../models');
const { Op } = require('sequelize');

/**
 * Middleware untuk memastikan pengguna memiliki role 'admin'
 * Mengikuti pola adminAuth dari Manajemen-Clearance-Kapal-Tradisional
 */
const adminAuth = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id || req.user.token_type === 'QR_GUEST') {
      return res.status(403).json({
        success: false,
        code: 'ACCESS_DENIED_QR_GUEST',
        message: 'Akses ditolak mentah-mentah. Tiket scan barcode tamu tidak diizinkan mengakses panel ini.',
        msg: 'Anda tidak memiliki akses'
      });
    }

    const user = await User.findOne({
      where: {
        id: req.user.id,
        role: 'admin'
      }
    });

    if (!user) {
      return res.status(403).json({
        success: false,
        message: 'Hak akses tidak memadai. Diperlukan role Administrator.',
        msg: 'Anda tidak memiliki akses'
      });
    }

    next();
  } catch (error) {
    console.error('[adminAuth Middleware Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada middleware otorisasi.',
      msg: 'terjadi kesalahan pada middleware'
    });
  }
};

/**
 * Middleware untuk mengizinkan role 'admin' atau 'kordinator' / 'koordinator'
 * Mengikuti pola semiAdminAuth dari Manajemen-Clearance-Kapal-Tradisional
 */
const kordinatorAuth = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id || req.user.token_type === 'QR_GUEST') {
      return res.status(403).json({
        success: false,
        code: 'ACCESS_DENIED_QR_GUEST',
        message: 'Akses ditolak mentah-mentah. Tiket scan barcode tamu tidak diizinkan mengakses panel ini.',
        msg: 'Anda tidak memiliki akses'
      });
    }

    const user = await User.findOne({
      where: {
        id: req.user.id,
        role: {
          [Op.in]: ['admin', 'kordinator', 'koordinator']
        }
      }
    });

    if (!user) {
      return res.status(403).json({
        success: false,
        message: 'Hak akses tidak memadai. Diperlukan role Koordinator atau Administrator.',
        msg: 'Anda tidak memiliki akses'
      });
    }

    next();
  } catch (error) {
    console.error('[kordinatorAuth Middleware Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada middleware otorisasi.',
      msg: 'terjadi kesalahan pada middleware'
    });
  }
};

/**
 * Middleware untuk seluruh pengguna terdaftar yang terautentikasi (admin, kordinator, user)
 * Mengikuti pola userAuth dari Manajemen-Clearance-Kapal-Tradisional
 */
const userAuth = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id || req.user.token_type === 'QR_GUEST') {
      return res.status(403).json({
        success: false,
        code: 'ACCESS_DENIED_QR_GUEST',
        message: 'Akses ditolak mentah-mentah. Tiket scan barcode tamu tidak diizinkan mengakses panel ini.',
        msg: 'Anda tidak memiliki akses'
      });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Akun user tidak ditemukan atau telah dinonaktifkan.',
        msg: 'Anda tidak memiliki akses'
      });
    }

    next();
  } catch (error) {
    console.error('[userAuth Middleware Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada middleware otorisasi.',
      msg: 'terjadi kesalahan pada middleware'
    });
  }
};

module.exports = {
  adminAuth,
  kordinatorAuth,
  semiAdminAuth: kordinatorAuth, // Alias persis seperti di referensi
  userAuth
};
