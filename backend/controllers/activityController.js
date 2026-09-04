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
