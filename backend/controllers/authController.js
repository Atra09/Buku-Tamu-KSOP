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
      if (password.trim().length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password minimal 6 karakter'
        });
      }
      user.password = await bcrypt.hash(password, 10);
    }

    // Helper untuk hapus file foto profil lama secara fisik
    const cleanUser = user.username.toLowerCase().trim().replace(/[^a-z0-9_-]/g, '_');
    const oldFoto = user.foto;
    const path = require('path');
    const fs = require('fs');

    const getProfilDirs = () => [
      path.resolve(__dirname, '../public/profil'),
      path.resolve(__dirname, '../../frontend/public/profil')
    ];

    const cleanupOldProfilePhotos = (targetUsername, currentFotoUrl, newFileName) => {
      const profilDirs = getProfilDirs();

      profilDirs.forEach(profilDir => {
        try {
          if (fs.existsSync(profilDir)) {
            const files = fs.readdirSync(profilDir);
            files.forEach(file => {
              if (file === '.gitkeep') return;
              if (newFileName && file === newFileName) return;

              const lowerFile = file.toLowerCase();
              if (
                lowerFile.startsWith('profile_') ||
                (cleanUser && (lowerFile.startsWith(`${cleanUser}.`) || lowerFile.startsWith(`${cleanUser}_`)))
              ) {
                try {
                  fs.unlinkSync(path.join(profilDir, file));
                } catch (e) {}
              }
            });
          }

          if (currentFotoUrl && typeof currentFotoUrl === 'string') {
            const cleanPath = currentFotoUrl.split('?')[0];
            if (cleanPath.startsWith('/profil/')) {
              const fileNameOnly = cleanPath.replace('/profil/', '');
              if (fileNameOnly !== newFileName) {
                const targetPath = path.join(profilDir, fileNameOnly);
                if (fs.existsSync(targetPath)) {
                  try {
                    fs.unlinkSync(targetPath);
                  } catch (e) {}
                }
              }
            }
          }
        } catch (err) {
          console.error('[Auth Cleanup Error]:', err.message);
        }
      });
    };

    // Handle foto file upload (Multer memoryStorage/diskStorage) or base64 string
    if (req.file) {
      const origName = req.file.originalname || req.file.filename || 'profile.png';
      const ext = (path.extname(origName) || '.png').toLowerCase();
      const targetFilename = `${cleanUser}${ext}`;

      const profilDirs = getProfilDirs();

      profilDirs.forEach(dir => {
        try {
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }
        } catch (e) {}
      });

      cleanupOldProfilePhotos(user.username, oldFoto, targetFilename);

      if (req.file.buffer) {
        profilDirs.forEach(dir => {
          try { fs.writeFileSync(path.join(dir, targetFilename), req.file.buffer); } catch (e) {}
        });
      } else if (req.file.path && fs.existsSync(req.file.path)) {
        profilDirs.forEach(dir => {
          try { fs.copyFileSync(req.file.path, path.join(dir, targetFilename)); } catch (e) {}
        });
      }

      user.foto = `/profil/${targetFilename}`;
    } else if (req.body.foto && req.body.foto.startsWith('data:image')) {
      try {
        const base64Data = req.body.foto.replace(/^data:image\/\w+;base64,/, '');
        const filename = `${cleanUser}.png`;
        cleanupOldProfilePhotos(user.username, oldFoto, filename);

        const profilDirs = getProfilDirs();

        profilDirs.forEach(dir => {
          try {
            if (!fs.existsSync(dir)) {
              fs.mkdirSync(dir, { recursive: true });
            }
          } catch (e) {}
        });

        profilDirs.forEach(dir => {
          try { fs.writeFileSync(path.join(dir, filename), base64Data, 'base64'); } catch (e) {}
        });

        user.foto = `/profil/${filename}`;
      } catch (err) {
        console.error('Error saving base64 profile image:', err);
      }
    } else if (req.body.foto) {
      const cleanPath = req.body.foto.split('?')[0];
      user.foto = cleanPath;
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
