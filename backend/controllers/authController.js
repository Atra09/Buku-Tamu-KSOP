const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, ActivityLog } = require('../models');
const storageService = require('../services/storageService');

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

    // Validasi tipe data string untuk mencegah Object / NoSQL-style Injection
    if (typeof username !== 'string' || typeof password !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Format username atau password tidak valid'
      });
    }

    const cleanUsername = username.trim();
    const cleanPassword = password;

    if (!cleanUsername || !cleanPassword) {
      return res.status(400).json({
        success: false,
        message: 'Username dan password wajib diisi'
      });
    }

    // Parameterized Query via Sequelize ORM (Menggunakan Prepared Statement: SELECT * FROM users WHERE username = ?)
    const user = await User.findOne({
      where: { username: cleanUsername }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Username atau password tidak valid'
      });
    }

    // Check password with bcrypt or fallback to plaintext comparison
    let isMatch = false;
    let needsUpgrade = false;

    if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
      isMatch = await bcrypt.compare(password, user.password);
    } else {
      isMatch = (user.password === password);
      if (isMatch) {
        needsUpgrade = true;
      }
    }

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Username atau password tidak valid'
      });
    }

    // Auto-upgrade legacy plaintext password to secure bcrypt hash
    if (needsUpgrade) {
      try {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        await user.save();
        console.log(`[Security Auto-Upgrade] Password akun "${user.username}" berhasil di-hash ke bcrypt.`);
      } catch (upgradeErr) {
        console.error('[Security Auto-Upgrade Error]:', upgradeErr);
      }
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

    // Sign genuine JWT token matching standard
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        nama: user.nama,
        role: user.role
      },
      process.env.JWT_SECRET || 'sitamu_ksop_secret_key_2026_rwerwerwer33',
      { expiresIn: '3h' }
    );

    // Return user info and session token
    res.json({
      success: true,
      message: 'Login berhasil',
      token,
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
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Autentikasi diperlukan' });
    }

    const user = await User.findByPk(userId);
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
    const { nama, username, password } = req.body;

    // Kunci targetId HANYA dari token JWT yang sudah terverifikasi (Anti-IDOR)
    const targetId = req.user?.id;
    if (!targetId) {
      return res.status(401).json({ success: false, message: 'Autentikasi diperlukan' });
    }

    const user = await User.findByPk(targetId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    }

    const roleStr = (user.role || '').toLowerCase();
    const isAdmin = roleStr === 'admin' || roleStr === 'superuser' || roleStr === 'super user';

    // Aturan Hak Akses:
    // Koordinator dan User biasa TIDAK BISA mengedit nama dan username-nya sendiri.
    // Hanya Administrator yang berhak mengubah nama dan username.
    if (isAdmin) {
      if (username && username.trim() !== '' && username.trim() !== user.username) {
        const cleanUsername = username.trim();
        const existingUser = await User.findOne({ where: { username: cleanUsername } });
        if (existingUser && existingUser.id !== user.id) {
          return res.status(400).json({ success: false, message: `Username "${cleanUsername}" sudah digunakan` });
        }
        user.username = cleanUsername;
      }

      if (nama && nama.trim() !== '') {
        user.nama = nama.trim();
      }
    }

    // Update password if provided (Dapat diubah oleh pemilik akun terautentikasi)
    if (password && password.trim() !== '') {
      if (password.trim().length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password minimal 6 karakter'
        });
      }
      user.password = await bcrypt.hash(password.trim(), 10);
    }

    // Simpan foto profil secara asinkron non-blocking via storageService
    if (req.file || req.body.foto) {
      const newFotoPath = await storageService.saveProfilePhoto({
        file: req.file,
        fotoBase64: req.body.foto,
        username: user.username,
        oldFoto: user.foto
      });
      if (newFotoPath) {
        user.foto = newFotoPath;
      }
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
