const { ActivityLog, User } = require('../models');
const { Op } = require('sequelize');

// GET /api/logs - Get activity logs with search & pagination
exports.getActivityLogs = async (req, res) => {
  try {
    const { search, limit = 50, offset = 0 } = req.query;

    const where = {};
    if (search) {
      where[Op.or] = [
        { user_nama: { [Op.like]: `%${search}%` } },
        { action: { [Op.like]: `%${search}%` } },
        { details: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await ActivityLog.findAndCountAll({
      where,
      include: [{
        model: User,
        attributes: ['id', 'username', 'nama', 'role'],
        required: false
      }],
      order: [['id', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Fallback: Link user_nama or user_id to User model if unlinked
    const users = await User.findAll({
      attributes: ['id', 'username', 'nama', 'role']
    });

    const userMap = {};
    const userById = {};
    users.forEach(u => {
      userById[u.id] = u;
      if (u.nama) userMap[u.nama.toLowerCase().trim()] = u;
      if (u.username) userMap[u.username.toLowerCase().trim()] = u;
    });

    const enrichedRows = rows.map(r => {
      const logObj = r.toJSON();
      const nameKey = (logObj.user_nama || '').toLowerCase().trim();
      
      const userFromId = logObj.user_id ? userById[logObj.user_id] : null;
      const userFromName = userMap[nameKey];
      const matchedUser = userFromId || userFromName || logObj.User;

      let rawRole = (matchedUser?.role || logObj.User?.role || '').toLowerCase().trim();

      if (rawRole.includes('kordinat') || rawRole.includes('koordinat')) {
        rawRole = 'kordinator';
      } else if (rawRole.includes('admin')) {
        rawRole = 'admin';
      } else if (rawRole) {
        rawRole = 'user';
      } else {
        rawRole = null;
      }

      logObj.user_role = rawRole;

      if (!logObj.User && matchedUser) {
        logObj.User = {
          id: matchedUser.id,
          username: matchedUser.username,
          nama: matchedUser.nama,
          role: matchedUser.role
        };
      }
      return logObj;
    });

    res.json({
      success: true,
      total: count,
      data: enrichedRows
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/logs - Record client-side activity (e.g. print badge, download report)
exports.createLog = async (req, res) => {
  try {
    const { action, details } = req.body;
    if (!action) return res.status(400).json({ success: false, message: 'Aksi wajib diisi' });

    let actorNama = 'Administrator';
    let user_id = null;
    if (req.user) {
      actorNama = req.user.nama || req.user.username || 'Admin';
      user_id = req.user.id || null;
    } else if (req.headers['x-user-nama']) {
      actorNama = decodeURIComponent(req.headers['x-user-nama']);
    }

    const newLog = await ActivityLog.create({
      user_nama: actorNama,
      user_id,
      action,
      details: details || '-'
    });

    res.status(201).json({ success: true, data: newLog });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
