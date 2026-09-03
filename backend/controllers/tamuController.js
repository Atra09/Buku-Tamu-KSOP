const { Tamu, MasterTujuan, MasterKeperluan } = require('../models');
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');

// Helper to generate registration number e.g. REG-20260902-0001
const generateNoReg = async () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const countToday = await Tamu.count({
    where: {
      tanggal: new Date().toISOString().slice(0, 10)
    }
  });
  const seq = String(countToday + 1).padStart(4, '0');
  return `REG-${dateStr}-${seq}`;
};

// Get all guests with filtering & search
exports.getAllTamu = async (req, res) => {
  try {
    const { search, tanggal, kategori_asal, status, limit = 50, offset = 0 } = req.query;

    const where = {};

    if (search) {
      where[Op.or] = [
        { nama: { [Op.like]: `%${search}%` } },
        { no_reg: { [Op.like]: `%${search}%` } },
        { asal_instansi: { [Op.like]: `%${search}%` } },
        { bertemu: { [Op.like]: `%${search}%` } },
        { keperluan: { [Op.like]: `%${search}%` } }
      ];
    }

    if (tanggal) {
      where.tanggal = tanggal;
    }

    if (kategori_asal) {
      where.kategori_asal = kategori_asal;
    }

    if (status) {
      where.status = status;
    }

    const { count, rows } = await Tamu.findAndCountAll({
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
    console.error('Error getAllTamu:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get guest details by ID
exports.getTamuById = async (req, res) => {
  try {
    const { id } = req.params;
    const tamu = await Tamu.findByPk(id);

    if (!tamu) {
      return res.status(404).json({ success: false, message: 'Data tamu tidak ditemukan' });
    }

    res.json({ success: true, data: tamu });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Register new guest (Form registration)
exports.createTamu = async (req, res) => {
  try {
    const {
      nama,
      no_telpon,
      kategori_asal,
      asal_instansi,
      jenis_kelamin,
      alamat,
      bertemu,
      keperluan,
      foto_base64
    } = req.body;

    if (!nama || !asal_instansi || !bertemu || !keperluan) {
      return res.status(400).json({
        success: false,
        message: 'Mohon isi bidang yang wajib (Nama, Asal Instansi, Bertemu, Keperluan)'
      });
    }

    const no_reg = await generateNoReg();
    const now = new Date();
    const tanggal = now.toISOString().split('T')[0];
    const jam = now.toTimeString().split(' ')[0];

    let fotoPath = null;

    // Handle uploaded file or base64 webcam snapshot
    if (req.file) {
      fotoPath = `/uploads/${req.file.filename}`;
    } else if (foto_base64) {
      try {
        let base64Data = foto_base64;
        const matches = foto_base64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          base64Data = matches[2];
        }
        
        const buffer = Buffer.from(base64Data, 'base64');
        const fileName = `foto_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
        const uploadDir = path.resolve(__dirname, '../public/uploads');

        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }

        fs.writeFileSync(path.join(uploadDir, fileName), buffer);
        fotoPath = `/uploads/${fileName}`;
      } catch (err) {
        console.error('Error saving base64 photo:', err);
        fotoPath = foto_base64; // fallback store base64 string directly
      }
    }

    const newTamu = await Tamu.create({
      no_reg,
      nama,
      no_telpon: no_telpon || '',
      kategori_asal: kategori_asal || 'Instansi',
      asal_instansi,
      jenis_kelamin: jenis_kelamin || 'Laki-laki',
      alamat: alamat || '',
      bertemu,
      keperluan,
      foto: fotoPath,
      tanggal,
      jam,
      status: 'Berkunjung'
    });

    res.status(201).json({
      success: true,
      message: 'Registrasi tamu berhasil!',
      data: newTamu
    });
  } catch (error) {
    console.error('Error createTamu:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update status (e.g. Selesai berkunjung)
exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const tamu = await Tamu.findByPk(id);
    if (!tamu) {
      return res.status(404).json({ success: false, message: 'Data tamu tidak ditemukan' });
    }

    tamu.status = status || 'Selesai';
    await tamu.save();

    res.json({ success: true, message: 'Status tamu diperbarui', data: tamu });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete guest
exports.deleteTamu = async (req, res) => {
  try {
    const { id } = req.params;
    const tamu = await Tamu.findByPk(id);
    if (!tamu) {
      return res.status(404).json({ success: false, message: 'Data tamu tidak ditemukan' });
    }

    await tamu.destroy();
    res.json({ success: true, message: 'Data tamu berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Dashboard Statistics
exports.getStats = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const firstDayOfMonth = today.substring(0, 8) + '01';

    const totalHariIni = await Tamu.count({ where: { tanggal: today } });
    const totalBulanIni = await Tamu.count({
      where: {
        tanggal: { [Op.gte]: firstDayOfMonth }
      }
    });

    const sedangBerkunjung = await Tamu.count({ where: { status: 'Berkunjung' } });

    // Distribution by category
    const countInstansi = await Tamu.count({ where: { kategori_asal: 'Instansi' } });
    const countMasyarakat = await Tamu.count({ where: { kategori_asal: 'Masyarakat' } });
    const countPerusahaan = await Tamu.count({ where: { kategori_asal: 'Perusahaan' } });

    res.json({
      success: true,
      data: {
        totalHariIni,
        totalBulanIni,
        sedangBerkunjung,
        kategori: {
          instansi: countInstansi,
          masyarakat: countMasyarakat,
          perusahaan: countPerusahaan
        }
      }
    });
  } catch (error) {
    console.error('Error getStats:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
