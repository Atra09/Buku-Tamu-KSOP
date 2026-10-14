const tamuService = require('../services/tamuService');
const { resolveActor } = require('../utils/actorHelper');

/**
 * Controller Tamu (Lean Controller Pattern)
 * Hanya bertugas menerima HTTP request, validasi header aktor,
 * mendelegasikan pemrosesan ke tamuService, dan mengembalikan response JSON.
 */

// GET /api/tamu
exports.getAllTamu = async (req, res) => {
  try {
    const { search, tanggal, kategori_asal, status, limit, offset } = req.query;
    const result = await tamuService.getAllTamu({ search, tanggal, kategori_asal, status, limit, offset });
    res.json({
      success: true,
      total: result.count,
      data: result.rows
    });
  } catch (error) {
    console.error('Error getAllTamu:', error);
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

// GET /api/tamu/:id
exports.getTamuById = async (req, res) => {
  try {
    const tamu = await tamuService.getTamuById(req.params.id);
    if (!tamu) {
      return res.status(404).json({ success: false, message: 'Data tamu tidak ditemukan' });
    }
    res.json({ success: true, data: tamu });
  } catch (error) {
    console.error('Error getTamuById:', error);
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

// POST /api/tamu (Registrasi Tamu Baru)
exports.createTamu = async (req, res) => {
  try {
    const { actorNama, userId: actorUserId } = await resolveActor(req, 'Sistem (Pos Jaga)');
    const ipAddress = req.ip || req.connection?.remoteAddress || null;

    const newTamu = await tamuService.createTamu({
      data: req.body,
      file: req.file,
      actorNama,
      actorUserId,
      ipAddress
    });

    res.status(201).json({
      success: true,
      message: 'Registrasi tamu berhasil!',
      data: newTamu
    });
  } catch (error) {
    console.error('Error createTamu:', error);
    res.status(error.status || 500).json({
      success: false,
      code: error.code,
      botNotConnected: error.botNotConnected,
      message: error.message
    });
  }
};

// PATCH /api/tamu/:id/status
exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const { actorNama, userId } = await resolveActor(req);

    const updatedTamu = await tamuService.updateStatus(id, status, actorNama, userId);
    res.json({ success: true, message: 'Status tamu diperbarui', data: updatedTamu });
  } catch (error) {
    console.error('Error updateStatus:', error);
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

// DELETE /api/tamu/:id
exports.deleteTamu = async (req, res) => {
  try {
    const { id } = req.params;
    const { actorNama, userId } = await resolveActor(req);

    await tamuService.deleteTamu(id, actorNama, userId);
    res.json({ success: true, message: 'Data tamu berhasil dihapus' });
  } catch (error) {
    console.error('Error deleteTamu:', error);
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

// GET /api/tamu/stats
exports.getStats = async (req, res) => {
  try {
    const stats = await tamuService.getDashboardStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getStats:', error);
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};
