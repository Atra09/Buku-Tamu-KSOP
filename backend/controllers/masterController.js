const { MasterTujuan, MasterKategoriAsal, ActivityLog } = require('../models');

// Helper to extract actor info from request
const getActorInfo = (req) => {
  let user_nama = 'Administrator';
  let user_id = null;
  if (req.user) {
    user_nama = req.user.nama || req.user.username || 'Admin';
    user_id = req.user.id || null;
  } else if (req.headers['x-user-nama']) {
    user_nama = decodeURIComponent(req.headers['x-user-nama']);
  }
  return { user_nama, user_id };
};

// Helper to safely record activity log
const logActivity = async (req, action, details) => {
  try {
    const { user_nama, user_id } = getActorInfo(req);
    await ActivityLog.create({
      user_nama,
      user_id,
      action,
      details
    });
  } catch (err) {
    console.error(`Error logging activity ${action}:`, err);
  }
};

// Get master data for dropdowns and full CRUD lists
exports.getDropdownData = async (req, res) => {
  try {
    const tujuan = await MasterTujuan.findAll({ order: [['nama_tujuan', 'ASC']] });
    const kategoriAsalList = await MasterKategoriAsal.findAll({ order: [['nama_kategori', 'ASC']] });

    res.json({
      success: true,
      data: {
        tujuanList: tujuan,
        tujuan: tujuan.map(t => t.nama_tujuan),
        kategoriAsalList: kategoriAsalList,
        kategoriAsal: kategoriAsalList.map(k => k.nama_kategori)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Add new Master Tujuan
exports.addTujuan = async (req, res) => {
  try {
    const { nama_tujuan, nama_pejabat, no_hp } = req.body;
    if (!nama_tujuan) return res.status(400).json({ success: false, message: 'Nama tujuan wajib' });
    const item = await MasterTujuan.create({
      nama_tujuan,
      nama_pejabat: nama_pejabat || null,
      no_hp: no_hp || null
    });
    
    await logActivity(req, 'TAMBAH_TUJUAN', `Menambahkan tujuan kunjungan baru: ${nama_tujuan}`);

    res.status(201).json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update Master Tujuan
exports.updateTujuan = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama_tujuan, nama_pejabat, no_hp } = req.body;
    const item = await MasterTujuan.findByPk(id);
    if (!item) return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });

    const oldName = item.nama_tujuan;
    await item.update({
      nama_tujuan: nama_tujuan !== undefined ? nama_tujuan : item.nama_tujuan,
      nama_pejabat: nama_pejabat !== undefined ? nama_pejabat : item.nama_pejabat,
      no_hp: no_hp !== undefined ? no_hp : item.no_hp
    });

    await logActivity(req, 'EDIT_TUJUAN', `Mengubah tujuan kunjungan dari "${oldName}" menjadi "${nama_tujuan || oldName}"`);

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

    const deletedName = item.nama_tujuan;
    await item.destroy();

    await logActivity(req, 'HAPUS_TUJUAN', `Menghapus tujuan kunjungan: ${deletedName}`);

    res.json({ success: true, message: 'Berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- Master Kategori Asal CRUD ---
const parseBoolean = (val, defaultVal = true) => {
  if (val === undefined || val === null) return defaultVal;
  if (val === false || val === 'false' || val === 0 || val === '0') return false;
  if (val === true || val === 'true' || val === 1 || val === '1') return true;
  return Boolean(val);
};

exports.addKategoriAsal = async (req, res) => {
  try {
    const { nama_kategori, butuh_instansi } = req.body;
    if (!nama_kategori) return res.status(400).json({ success: false, message: 'Nama kategori asal wajib' });
    const item = await MasterKategoriAsal.create({
      nama_kategori,
      butuh_instansi: parseBoolean(butuh_instansi, true)
    });

    await logActivity(req, 'TAMBAH_KATEGORI_ASAL', `Menambahkan kategori asal baru: ${nama_kategori}`);

    res.status(201).json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateKategoriAsal = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama_kategori, butuh_instansi } = req.body;
    const item = await MasterKategoriAsal.findByPk(id);
    if (!item) return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });

    const oldName = item.nama_kategori;
    await item.update({
      nama_kategori: nama_kategori !== undefined ? nama_kategori : item.nama_kategori,
      butuh_instansi: parseBoolean(butuh_instansi, item.butuh_instansi)
    });

    await logActivity(req, 'EDIT_KATEGORI_ASAL', `Mengubah kategori asal dari "${oldName}" menjadi "${nama_kategori || oldName}"`);

    res.json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteKategoriAsal = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await MasterKategoriAsal.findByPk(id);
    if (!item) return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });

    const deletedName = item.nama_kategori;
    await item.destroy();

    await logActivity(req, 'HAPUS_KATEGORI_ASAL', `Menghapus kategori asal: ${deletedName}`);

    res.json({ success: true, message: 'Berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
