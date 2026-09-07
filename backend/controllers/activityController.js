const { ActivityLog } = require('../models');
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
      order: [['id', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      total: count,
      data: rows
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
