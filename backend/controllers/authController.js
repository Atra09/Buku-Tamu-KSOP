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
        role: user.role,
        foto: user.foto
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/auth/profile
exports.updateProfile = async (req, res) => {
  try {
    const { userId, nama, username, password } = req.body;
    const targetId = userId || req.body.id;

    let user;
    if (targetId) {
      user = await User.findByPk(targetId);
    }
    if (!user && req.body.currentUsername) {
      user = await User.findOne({ where: { username: req.body.currentUsername } });
    }
    if (!user && username) {
      user = await User.findOne({ where: { username } });
    }
    if (!user) {
      user = await User.findOne();
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    }

    // Check if username is changed and already taken
    if (username && username !== user.username) {
      const existingUser = await User.findOne({ where: { username } });
      if (existingUser && existingUser.id !== user.id) {
        return res.status(400).json({ success: false, message: `Username "${username}" sudah digunakan` });
      }
      user.username = username;
    }

    if (nama) {
      user.nama = nama;
    }

    // Update password if provided
    if (password && password.trim() !== '') {
      user.password = await bcrypt.hash(password, 10);
    }

    // Handle foto file upload (Multer) or base64 string
    if (req.file) {
      user.foto = `/uploads/${req.file.filename}`;
    } else if (req.body.foto && req.body.foto.startsWith('data:image')) {
      try {
        const path = require('path');
        const fs = require('fs');
        const base64Data = req.body.foto.replace(/^data:image\/\w+;base64,/, '');
        const filename = `profile_${user.id}_${Date.now()}.png`;
        const uploadDir = path.resolve(__dirname, '../public/uploads');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        const uploadPath = path.join(uploadDir, filename);
        fs.writeFileSync(uploadPath, base64Data, 'base64');
        user.foto = `/uploads/${filename}`;
      } catch (err) {
        console.error('Error saving base64 profile image:', err);
      }
    } else if (req.body.foto) {
      user.foto = req.body.foto;
    }

    await user.save();

    // Log Activity
    try {
      await ActivityLog.create({
        user_nama: user.nama,
        user_id: user.id,
        action: 'UBAH_PROFIL',
        details: `User ${user.username} memperbarui data profil akun`
      });
    } catch (e) {
      console.error('Error recording profile update log:', e);
    }

    res.json({
      success: true,
      message: 'Profil berhasil diperbarui',
      user: {
        id: user.id,
        username: user.username,
        nama: user.nama,
        role: user.role,
        foto: user.foto
      }
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ success: false, message: error.message || 'Terjadi kesalahan server' });
  }
};
