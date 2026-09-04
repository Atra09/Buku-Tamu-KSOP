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

    const mappedRows = rows.map(item => {
      const g = item.toJSON();
      if (g.status === 'Selesai' && !g.tanggal_keluar && g.updatedAt) {
        try {
          const updatedDate = new Date(g.updatedAt);
          g.tanggal_keluar = updatedDate.toISOString().split('T')[0];
          g.jam_keluar = updatedDate.toTimeString().split(' ')[0];
        } catch (e) {}
      }
      return g;
    });

    res.json({
      success: true,
      total: count,
      data: mappedRows
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
      lokasi,
      bertemu,
      keperluan,
      foto_base64
    } = req.body;

    const isMasyarakat = kategori_asal && kategori_asal.toLowerCase().includes('masyarakat');
    const finalAsalInstansi = (asal_instansi && asal_instansi.trim())
      ? asal_instansi.trim()
      : (isMasyarakat ? 'Masyarakat Umum' : '-');

    if (!nama || (!isMasyarakat && !asal_instansi) || !bertemu || !keperluan) {
      return res.status(400).json({
        success: false,
        message: 'Mohon isi bidang yang wajib (Nama, Bertemu, Keperluan)'
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

    const defaultFallbackLokasi = 'Desa Gapura, Kec. Kota Sumenep, Kab. Sumenep';
    const finalLokasi = (lokasi && lokasi.trim() && lokasi !== 'Lokasi Tidak Terdeteksi' && lokasi !== 'Mendeteksi Lokasi...') 
      ? lokasi.trim() 
      : defaultFallbackLokasi;

    const newTamu = await Tamu.create({
      no_reg,
      nama,
      no_telpon: no_telpon || '',
      kategori_asal: kategori_asal || 'Instansi / Dinas',
      asal_instansi: finalAsalInstansi,
      jenis_kelamin: jenis_kelamin || 'Laki-laki',
      alamat: alamat || '',
      lokasi: finalLokasi,
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

    const nextStatus = status || (tamu.status === 'Berkunjung' ? 'Selesai' : 'Berkunjung');
    tamu.status = nextStatus;

    if (nextStatus === 'Selesai') {
      const now = new Date();
      tamu.tanggal_keluar = now.toISOString().split('T')[0];
      tamu.jam_keluar = now.toTimeString().split(' ')[0];
    } else {
      tamu.tanggal_keluar = null;
      tamu.jam_keluar = null;
    }

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

// Helper for local YYYY-MM-DD string
const getLocalDateString = (d = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Get Dashboard Statistics
exports.getStats = async (req, res) => {
  try {
    const now = new Date();
    const today = getLocalDateString(now);
    const currentYear = now.getFullYear();
    const firstDayOfMonth = `${today.substring(0, 7)}-01`;

    const totalHariIni = await Tamu.count({ where: { tanggal: today } });
    const totalBulanIni = await Tamu.count({
      where: {
        tanggal: { [Op.gte]: firstDayOfMonth }
      }
    });

    const sedangBerkunjung = await Tamu.count({ where: { status: 'Berkunjung' } });

    // 1. Distribution by category (Exact match with dropdown values)
    const countInstansi = await Tamu.count({
      where: {
        kategori_asal: { [Op.or]: ['Instansi', 'Instansi / Dinas'] }
      }
    });
    const countPerusahaan = await Tamu.count({
      where: {
        kategori_asal: { [Op.or]: ['Perusahaan', 'Perusahaan / Swasta'] }
      }
    });
    const countMasyarakat = await Tamu.count({
      where: {
        kategori_asal: { [Op.or]: ['Masyarakat', 'Masyarakat Umum'] }
      }
    });
    const countLainnya = await Tamu.count({
      where: {
        kategori_asal: { [Op.notIn]: ['Instansi', 'Instansi / Dinas', 'Perusahaan', 'Perusahaan / Swasta', 'Masyarakat', 'Masyarakat Umum'] }
      }
    });

    const categoryStats = [
      { label: 'Instansi / Dinas', value: countInstansi },
      { label: 'Perusahaan / Swasta', value: countPerusahaan },
      { label: 'Masyarakat Umum', value: countMasyarakat },
      { label: 'Lainnya', value: countLainnya }
    ];

    // 2. Weekly Stats (Senin hingga Minggu dari minggu berjalan)
    const dayNames = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
    
    // Hitung tanggal Hari Senin dari minggu berjalan
    const dayOfWeek = now.getDay(); // 0: Minggu, 1: Senin, ..., 6: Sabtu
    const distanceToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + distanceToMonday);

    const weeklyStats = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = getLocalDateString(d);
      const count = await Tamu.count({ where: { tanggal: dateStr } });
      const dayLabel = dayNames[i];
      const shortDate = `${d.getDate()}/${d.getMonth() + 1}`;
      weeklyStats.push({
        label: `${dayLabel} (${shortDate})`,
        day: dayLabel,
        date: dateStr,
        count
      });
    }

    // 3. Monthly Stats (12 bulan tahun berjalan dengan kalkulasi akhir bulan presisi)
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const monthlyStats = [];
    for (let m = 0; m < 12; m++) {
      const mStr = String(m + 1).padStart(2, '0');
      const lastDay = new Date(currentYear, m + 1, 0).getDate();
      const startOfMonth = `${currentYear}-${mStr}-01`;
      const endOfMonth = `${currentYear}-${mStr}-${String(lastDay).padStart(2, '0')}`;
      
      const count = await Tamu.count({
        where: {
          tanggal: {
            [Op.between]: [startOfMonth, endOfMonth]
          }
        }
      });

      monthlyStats.push({
        label: monthNames[m],
        month: monthNames[m],
        count
      });
    }

    res.json({
      success: true,
      data: {
        totalHariIni,
        totalBulanIni,
        sedangBerkunjung,
        kategori: {
          instansi: countInstansi,
          masyarakat: countMasyarakat,
          perusahaan: countPerusahaan,
          lainnya: countLainnya
        },
        categoryStats,
        weeklyStats,
        monthlyStats
      }
    });
  } catch (error) {
    console.error('Error getStats:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
