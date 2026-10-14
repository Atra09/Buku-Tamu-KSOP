const { JadwalPetugas, User, ActivityLog } = require('../models');
const { resolveActor } = require('../utils/actorHelper');

// Helper to safely record activity log
const logActivity = async (req, action, details) => {
  try {
    const { actorNama, userId } = await resolveActor(req, 'Administrator');
    await ActivityLog.create({
      user_nama: actorNama,
      user_id: userId,
      action,
      details
    });
  } catch (err) {
    console.error(`Error logging activity ${action}:`, err);
  }
};

// Get all schedules with User relation
exports.getAllJadwal = async (req, res) => {
  try {
    const list = await JadwalPetugas.findAll({
      include: [{
        model: User,
        attributes: ['id', 'nama', 'username', 'role', 'foto']
      }],
      order: [
        ['id', 'ASC']
      ]
    });
    res.json({ success: true, data: list });
  } catch (err) {
    console.error('Error fetching jadwal:', err);
    res.status(500).json({ success: false, message: 'Gagal mengambil data jadwal' });
  }
};

// Get list of officers (users) for dropdown selection
exports.getPetugasOptions = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'nama', 'username', 'role', 'foto'],
      order: [['nama', 'ASC']]
    });
    res.json({ success: true, data: users });
  } catch (err) {
    console.error('Error fetching petugas options:', err);
    res.status(500).json({ success: false, message: 'Gagal mengambil daftar petugas' });
  }
};

// Create new schedule
exports.addJadwal = async (req, res) => {
  try {
    const { user_id, hari, shift, keterangan, status } = req.body;

    if (!user_id || !hari) {
      return res.status(400).json({
        success: false,
        message: 'Petugas dan Hari wajib dipilih'
      });
    }

    const newJadwal = await JadwalPetugas.create({
      user_id: parseInt(user_id, 10),
      hari,
      shift: (shift || 'Piket Harian').trim(),
      keterangan: (keterangan || '').trim(),
      status: status || 'Aktif'
    });

    const result = await JadwalPetugas.findByPk(newJadwal.id, {
      include: [{ model: User, attributes: ['id', 'nama', 'username', 'role', 'foto'] }]
    });

    const officerName = result.User?.nama || `Petugas ID ${result.user_id}`;
    await logActivity(
      req,
      'TAMBAH_JADWAL',
      `Menambahkan jadwal piket hari ${result.hari} untuk petugas "${officerName}" (${result.shift || 'Piket Harian'})`
    );

    res.status(201).json({
      success: true,
      data: result,
      message: 'Jadwal petugas berhasil ditambahkan'
    });
  } catch (err) {
    console.error('Error creating jadwal:', err);
    res.status(500).json({ success: false, message: 'Gagal menambahkan jadwal' });
  }
};

// Update existing schedule
exports.updateJadwal = async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id, hari, shift, keterangan, status } = req.body;

    const jadwal = await JadwalPetugas.findByPk(id, {
      include: [{ model: User, attributes: ['id', 'nama', 'username', 'role'] }]
    });

    if (!jadwal) {
      return res.status(404).json({
        success: false,
        message: 'Jadwal tidak ditemukan'
      });
    }

    const oldOfficer = jadwal.User?.nama || `Petugas ID ${jadwal.user_id}`;
    const oldHari = jadwal.hari;

    await jadwal.update({
      user_id: user_id ? parseInt(user_id, 10) : jadwal.user_id,
      hari: hari || jadwal.hari,
      shift: shift !== undefined ? shift.trim() : jadwal.shift,
      keterangan: keterangan !== undefined ? keterangan.trim() : jadwal.keterangan,
      status: status || jadwal.status
    });

    const updated = await JadwalPetugas.findByPk(id, {
      include: [{ model: User, attributes: ['id', 'nama', 'username', 'role', 'foto'] }]
    });

    const newOfficer = updated.User?.nama || `Petugas ID ${updated.user_id}`;
    let detailText = `Mengubah jadwal piket hari ${updated.hari} untuk petugas "${newOfficer}" (${updated.shift || 'Piket Harian'}) - Status: ${updated.status}`;
    if (oldHari !== updated.hari || oldOfficer !== newOfficer) {
      detailText = `Mengubah jadwal piket dari hari ${oldHari} (${oldOfficer}) menjadi hari ${updated.hari} (${newOfficer}) - Status: ${updated.status}`;
    }

    await logActivity(req, 'EDIT_JADWAL', detailText);

    res.json({
      success: true,
      data: updated,
      message: 'Jadwal petugas berhasil diperbarui'
    });
  } catch (err) {
    console.error('Error updating jadwal:', err);
    res.status(500).json({ success: false, message: 'Gagal memperbarui jadwal' });
  }
};

// Delete schedule
exports.deleteJadwal = async (req, res) => {
  try {
    const { id } = req.params;
    const jadwal = await JadwalPetugas.findByPk(id, {
      include: [{ model: User, attributes: ['id', 'nama', 'username', 'role'] }]
    });

    if (!jadwal) {
      return res.status(404).json({
        success: false,
        message: 'Jadwal tidak ditemukan'
      });
    }

    const officerName = jadwal.User?.nama || `Petugas ID ${jadwal.user_id}`;
    const hari = jadwal.hari;

    await jadwal.destroy();

    await logActivity(
      req,
      'HAPUS_JADWAL',
      `Menghapus jadwal piket hari ${hari} untuk petugas "${officerName}"`
    );

    res.json({
      success: true,
      message: 'Jadwal petugas berhasil dihapus'
    });
  } catch (err) {
    console.error('Error deleting jadwal:', err);
    res.status(500).json({ success: false, message: 'Gagal menghapus jadwal' });
  }
};
