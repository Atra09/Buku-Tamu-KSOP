const bcrypt = require('bcryptjs');
const { User, ActivityLog } = require('../models');

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

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Username atau password tidak valid'
      });
    }

    // Check password with bcrypt or fallback to plaintext comparison
    let isMatch = false;
    if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
      isMatch = await bcrypt.compare(password, user.password);
    } else {
      isMatch = (user.password === password);
    }

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Username atau password tidak valid'
      });
    }

    // Record Login Activity
    try {
      await ActivityLog.create({
        user_nama: user.nama,
        user_id: user.id,
        action: 'LOGIN',
        details: `User ${user.username} (${user.role}) berhasil login ke sistem`
      });
    } catch (e) {
      console.error('Error recording login log:', e);
    }

    // Return user info and session token
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
