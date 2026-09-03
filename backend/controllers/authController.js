const { User } = require('../models');

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username dan password wajib diisi'
      });
    }

    const user = await User.findOne({ where: { username } });

    if (!user || user.password !== password) {
      return res.status(401).json({
        success: false,
        message: 'Username atau password tidak valid'
      });
    }

    // Return user info and mock token for session auth
    res.json({
      success: true,
      message: 'Login berhasil',
      token: `sitamu-token-${user.id}-${Date.now()}`,
      user: {
        id: user.id,
        username: user.username,
        nama: user.nama,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/auth/me
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findOne();
    if (!user) return res.status(404).json({ success: false, message: 'User tidak ditemukan' });

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        nama: user.nama,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
