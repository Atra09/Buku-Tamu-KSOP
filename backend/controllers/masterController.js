const { MasterTujuan, MasterKeperluan } = require('../models');

// Get master data for dropdowns and full CRUD lists
exports.getDropdownData = async (req, res) => {
  try {
    const tujuan = await MasterTujuan.findAll({ order: [['nama_tujuan', 'ASC']] });
    const keperluan = await MasterKeperluan.findAll({ order: [['nama_keperluan', 'ASC']] });

    res.json({
      success: true,
      data: {
        tujuanList: tujuan,
        tujuan: tujuan.map(t => t.nama_tujuan),
        keperluan: keperluan.map(k => k.nama_keperluan),
        kategoriAsal: ['Instansi', 'Masyarakat Umum', 'Perusahaan', 'Lainnya']
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Add new Master Tujuan
exports.addTujuan = async (req, res) => {
  try {
    const { nama_tujuan } = req.body;
    if (!nama_tujuan) return res.status(400).json({ success: false, message: 'Nama tujuan wajib' });
    const item = await MasterTujuan.create({ nama_tujuan });
    res.status(201).json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update Master Tujuan
exports.updateTujuan = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama_tujuan } = req.body;
    const item = await MasterTujuan.findByPk(id);
    if (!item) return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });

    await item.update({ nama_tujuan });
    res.json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete Master Tujuan
exports.deleteTujuan = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await MasterTujuan.findByPk(id);
    if (!item) return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });

    await item.destroy();
    res.json({ success: true, message: 'Berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Add new Master Keperluan
exports.addKeperluan = async (req, res) => {
  try {
    const { nama_keperluan } = req.body;
    if (!nama_keperluan) return res.status(400).json({ success: false, message: 'Nama keperluan wajib' });
    const item = await MasterKeperluan.create({ nama_keperluan });
    res.status(201).json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
