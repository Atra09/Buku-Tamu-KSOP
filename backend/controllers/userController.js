const bcrypt = require('bcryptjs');
const { User, ActivityLog } = require('../models');
const { resolveActor } = require('../utils/actorHelper');

// GET /api/users - Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'username', 'nama', 'role', 'createdAt', 'updatedAt'],
      order: [['id', 'DESC']]
    });

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/users - Create new user with bcrypt password hashing
exports.createUser = async (req, res) => {
  try {
    const { username, password, nama, role } = req.body;

    if (!username || !password || !nama) {
      return res.status(400).json({
        success: false,
        message: 'Username, password, dan nama wajib diisi'
      });
    }

    if (password.trim().length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password minimal 6 karakter'
      });
    }

    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Username sudah digunakan, silakan gunakan username lain'
      });
    }

    // Hash password using bcryptjs
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const allowedRoles = ['admin', 'kordinator', 'koordinator', 'user'];
    const rawRole = role ? role.toLowerCase().trim() : 'user';
    const finalRole = (rawRole === 'koordinator' || rawRole === 'kordinator') 
      ? 'kordinator' 
      : (allowedRoles.includes(rawRole) ? rawRole : 'user');

    const newUser = await User.create({
      username,
      password: hashedPassword,
      nama,
      role: finalRole
    });

    // Record Activity Log
    const { actorNama: createActor, userId: createActorId } = await resolveActor(req, 'Admin');
    await ActivityLog.create({
      user_nama: createActor,
      user_id: createActorId,
      action: 'TAMBAH_USER',
      details: `Menambahkan akun user baru: ${username} (${role || 'user'})`
    });

    res.status(201).json({
      success: true,
      message: 'User berhasil ditambahkan',
      data: {
        id: newUser.id,
        username: newUser.username,
        nama: newUser.nama,
        role: newUser.role
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/users/:id - Update user
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, password, nama, role } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    }

    const allowedRoles = ['admin', 'kordinator', 'koordinator', 'user'];
    const updateData = {
      nama: nama || user.nama
    };

    if (role) {
      const rawRole = role.toLowerCase().trim();
      const targetRole = (rawRole === 'koordinator' || rawRole === 'kordinator')
        ? 'kordinator'
        : (allowedRoles.includes(rawRole) ? rawRole : user.role);

      // Guard: Jika akun ini adalah Admin dan ingin diubah menjadi non-admin
      if (user.role === 'admin' && targetRole !== 'admin') {
        const adminCount = await User.count({ where: { role: 'admin' } });
        if (adminCount <= 1) {
          return res.status(400).json({
            success: false,
            message: 'Tidak dapat mengubah role Admin terakhir di sistem. Minimal satu akun Admin harus tetap aktif.'
          });
        }
      }

      // Guard: Mencegah admin mendowngrade rolenya sendiri secara tidak sengaja
      if (req.user && Number(req.user.id) === Number(user.id) && targetRole !== 'admin') {
        return res.status(400).json({
          success: false,
          message: 'Tidak dapat menurunkan (downgrade) hak akses akun Anda sendiri yang sedang aktif.'
        });
      }

      updateData.role = targetRole;
    }

    if (username && username !== user.username) {
      const existingUser = await User.findOne({ where: { username } });
      if (existingUser) {
        return res.status(400).json({ success: false, message: 'Username sudah digunakan' });
      }
      updateData.username = username;
    }

    if (password && password.trim() !== '') {
      if (password.trim().length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password minimal 6 karakter'
        });
      }
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }

    await user.update(updateData);

    // Record Activity Log
    const { actorNama: updateActor, userId: updateActorId } = await resolveActor(req, 'Admin');
    await ActivityLog.create({
      user_nama: updateActor,
      user_id: updateActorId,
      action: 'UPDATE_USER',
      details: `Memperbarui akun user: ${user.username}`
    });

    res.json({
      success: true,
      message: 'User berhasil diperbarui',
      data: {
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

// DELETE /api/users/:id - Delete user
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    }

    // Guard 1: Self-deletion guard (Admin tidak dapat menghapus akunnya sendiri yang sedang aktif)
    if (req.user && Number(req.user.id) === Number(user.id)) {
      return res.status(400).json({
        success: false,
        message: 'Tidak dapat menghapus akun Anda sendiri yang sedang aktif digunakan.'
      });
    }

    // Guard 2: Last-admin protection (Admin terakhir tidak dapat dihapus)
    if (user.role === 'admin') {
      const adminCount = await User.count({ where: { role: 'admin' } });
      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Tidak dapat menghapus Admin terakhir di sistem. Minimal satu akun Admin harus tetap aktif.'
        });
      }
    }

    const deletedUsername = user.username;
    await user.destroy();

    // Record Activity Log
    const { actorNama: deleteActor, userId: deleteActorId } = await resolveActor(req, 'Admin');
    await ActivityLog.create({
      user_nama: deleteActor,
      user_id: deleteActorId,
      action: 'HAPUS_USER',
      details: `Menghapus akun user: ${deletedUsername}`
    });

    res.json({ success: true, message: 'User berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
