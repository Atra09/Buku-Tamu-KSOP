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

    // Format and enrich each row directly from the joined User relation (No N+1 User.findAll query)
    const enrichedRows = rows.map(r => {
      const logObj = r.toJSON();
      let rawRole = (logObj.User?.role || '').toLowerCase().trim();

      if (rawRole.includes('kordinat') || rawRole.includes('koordinat')) {
        rawRole = 'kordinator';
      } else if (rawRole.includes('admin')) {
        rawRole = 'admin';
      } else if (rawRole) {
        rawRole = 'user';
      } else {
        // Fallback jika user_id null (aktivitas guest / sistem pos jaga)
        const nameLower = (logObj.user_nama || '').toLowerCase();
        if (nameLower.includes('admin')) {
          rawRole = 'admin';
        } else if (nameLower.includes('kordinator') || nameLower.includes('koordinator')) {
          rawRole = 'kordinator';
        } else {
          rawRole = null;
        }
      }

      logObj.user_role = rawRole;
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

    let actorNama;
    let user_id = null;

    if (req.user && req.user.id) {
      // User internal terautentikasi via token JWT
      actorNama = req.user.nama || req.user.username || 'User';
      user_id = req.user.id;
    } else {
      // Permintaan publik tanpa autentikasi (misal: tamu mencetak badge di browser)
      // Terapkan whitelist aksi yang sah untuk mencegah polusi log / log injection
      const allowedPublicActions = [
        'CETAK_BADGE_TAMU',
        'PRINT_BADGE',
        'DOWNLOAD_LAPORAN_TAMU',
        'EKSPOR_EXCEL',
        'EXPORT_EXCEL',
        'REGISTRASI_TAMU'
      ];

      const cleanAction = String(action).trim().toUpperCase();
      if (!allowedPublicActions.includes(cleanAction)) {
        return res.status(403).json({
          success: false,
          message: 'Aksi tidak diizinkan tanpa autentikasi petugas.'
        });
      }

      actorNama = 'Tamu Mandiri (Guest)';
    }

    const newLog = await ActivityLog.create({
      user_nama: actorNama,
      user_id,
      action: String(action).slice(0, 100),
      details: typeof details === 'string' ? details.slice(0, 255) : '-'
    });

    res.status(201).json({ success: true, data: newLog });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
