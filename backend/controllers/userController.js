const bcrypt = require('bcryptjs');
const { User, ActivityLog } = require('../models');

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

    const newUser = await User.create({
      username,
      password: hashedPassword,
      nama,
      role: role || 'user'
    });

    // Record Activity Log
    await ActivityLog.create({
      user_nama: req.user ? req.user.nama : 'Admin',
      user_id: req.user ? req.user.id : null,
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

    const updateData = {
      nama: nama || user.nama,
      role: role || user.role
    };

    if (username && username !== user.username) {
      const existingUser = await User.findOne({ where: { username } });
      if (existingUser) {
        return res.status(400).json({ success: false, message: 'Username sudah digunakan' });
      }
      updateData.username = username;
    }

    if (password && password.trim() !== '') {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }

    await user.update(updateData);

    // Record Activity Log
    await ActivityLog.create({
      user_nama: req.user ? req.user.nama : 'Admin',
      user_id: req.user ? req.user.id : null,
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

    const deletedUsername = user.username;
    await user.destroy();

    // Record Activity Log
    await ActivityLog.create({
      user_nama: req.user ? req.user.nama : 'Admin',
      user_id: req.user ? req.user.id : null,
      action: 'HAPUS_USER',
      details: `Menghapus akun user: ${deletedUsername}`
    });

    res.json({ success: true, message: 'User berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
