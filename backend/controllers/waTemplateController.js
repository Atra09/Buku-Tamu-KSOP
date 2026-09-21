const { WaTemplate, ActivityLog, User } = require('../models');
const { Op } = require('sequelize');

const resolveActor = async (req) => {
  let actorNama = 'Admin';
  let userId = null;

  if (req.user) {
    actorNama = req.user.nama || req.user.username || 'Admin';
    userId = req.user.id || null;
  } else if (req.headers['x-user-nama']) {
    actorNama = decodeURIComponent(req.headers['x-user-nama']);
    try {
      const matched = await User.findOne({
        where: {
          [Op.or]: [
            { nama: actorNama },
            { username: actorNama }
          ]
        }
      });
      if (matched) {
        userId = matched.id;
      }
    } catch (e) {}
  }

  return { actorNama, userId };
};

// GET /api/wa-templates - Get all WA templates
exports.getTemplates = async (req, res) => {
  try {
    await WaTemplate.sync();
    const templates = await WaTemplate.findAll({
      order: [['id', 'ASC']]
    });
    return res.status(200).json({ success: true, data: templates });
  } catch (err) {
    console.error('[WaTemplate Controller Error]:', err);
    return res.status(500).json({ success: false, message: 'Gagal mengambil data template WA' });
  }
};

// POST /api/wa-templates - Create a new custom template
exports.createTemplate = async (req, res) => {
  try {
    await WaTemplate.sync();
    const { nama_template, isi_pesan } = req.body;

    if (!nama_template || !isi_pesan) {
      return res.status(400).json({ success: false, message: 'Nama template dan isi pesan harus diisi' });
    }

    const newTemplate = await WaTemplate.create({
      nama_template: nama_template.trim(),
      isi_pesan: isi_pesan.trim(),
      is_active: false
    });

    // Log Activity
    try {
      const { actorNama, userId } = await resolveActor(req);
      await ActivityLog.create({
        user_id: userId,
        user_nama: actorNama,
        action: 'CREATE',
        module: 'WA Bot Notifikasi',
        details: `Menambah template pesan WA baru: "${newTemplate.nama_template}"`
      });
    } catch (e) {}

    return res.status(201).json({ success: true, message: 'Template pesan berhasil ditambahkan', data: newTemplate });
  } catch (err) {
    console.error('[WaTemplate Controller Error]:', err);
    return res.status(500).json({ success: false, message: 'Gagal menambahkan template pesan WA' });
  }
};

// PUT /api/wa-templates/:id - Update custom template
exports.updateTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama_template, isi_pesan } = req.body;

    const template = await WaTemplate.findByPk(id);
    if (!template) {
      return res.status(404).json({ success: false, message: 'Template tidak ditemukan' });
    }

    if (nama_template) template.nama_template = nama_template.trim();
    if (isi_pesan) template.isi_pesan = isi_pesan.trim();

    await template.save();

    // Log Activity
    try {
      const { actorNama, userId } = await resolveActor(req);
      await ActivityLog.create({
        user_id: userId,
        user_nama: actorNama,
        action: 'UPDATE',
        module: 'WA Bot Notifikasi',
        details: `Mengubah template pesan WA: "${template.nama_template}"`
      });
    } catch (e) {}

    return res.status(200).json({ success: true, message: 'Template pesan berhasil diperbarui', data: template });
  } catch (err) {
    console.error('[WaTemplate Controller Error]:', err);
    return res.status(500).json({ success: false, message: 'Gagal memperbarui template pesan WA' });
  }
};

// DELETE /api/wa-templates/:id - Delete custom template
exports.deleteTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const template = await WaTemplate.findByPk(id);

    if (!template) {
      return res.status(404).json({ success: false, message: 'Template tidak ditemukan' });
    }

    const templateName = template.nama_template;
    await template.destroy();

    // Log Activity
    try {
      const { actorNama, userId } = await resolveActor(req);
      await ActivityLog.create({
        user_id: userId,
        user_nama: actorNama,
        action: 'DELETE',
        module: 'WA Bot Notifikasi',
        details: `Menghapus template pesan WA: "${templateName}"`
      });
    } catch (e) {}

    return res.status(200).json({ success: true, message: 'Template pesan berhasil dihapus' });
  } catch (err) {
    console.error('[WaTemplate Controller Error]:', err);
    return res.status(500).json({ success: false, message: 'Gagal menghapus template pesan WA' });
  }
};

// PATCH /api/wa-templates/activate/:id - Set template active (or 0 for system default)
exports.setActiveTemplate = async (req, res) => {
  try {
    const { id } = req.params;

    // Reset all custom templates to is_active = false
    await WaTemplate.update({ is_active: false }, { where: {} });

    let activeName = 'Format Default Sistem';

    if (id !== '0' && id !== 'default') {
      const template = await WaTemplate.findByPk(id);
      if (!template) {
        return res.status(404).json({ success: false, message: 'Template tidak ditemukan' });
      }
      template.is_active = true;
      await template.save();
      activeName = template.nama_template;
    }

    // Log Activity
    try {
      const { actorNama, userId } = await resolveActor(req);
      await ActivityLog.create({
        user_id: userId,
        user_nama: actorNama,
        action: 'UPDATE',
        module: 'WA Bot Notifikasi',
        details: `Mengaktifkan template pesan WA: "${activeName}"`
      });
    } catch (e) {}

    return res.status(200).json({ success: true, message: `Template "${activeName}" berhasil diaktifkan` });
  } catch (err) {
    console.error('[WaTemplate Controller Error]:', err);
    return res.status(500).json({ success: false, message: 'Gagal mengubah template pesan aktif' });
  }
};
