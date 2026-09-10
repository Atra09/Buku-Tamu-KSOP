const { Tamu, MasterTujuan, MasterKategoriAsal, ActivityLog } = require('../models');
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');
const waService = require('../services/waService');

// Helper to generate registration number e.g. REG-20260907-0001 (Unique & Incremental)
const generateNoReg = async () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;

  const lastGuest = await Tamu.findOne({
    where: {
      no_reg: { [Op.like]: `REG-${dateStr}-%` }
    },
    order: [['id', 'DESC']]
  });

  let seqNum = 1;
  if (lastGuest && lastGuest.no_reg) {
    const parts = lastGuest.no_reg.split('-');
    if (parts.length === 3) {
      const lastSeq = parseInt(parts[2], 10);
      if (!isNaN(lastSeq)) {
        seqNum = lastSeq + 1;
      }
    }
  }

  const seq = String(seqNum).padStart(2, '0');
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
        const now = new Date();
        const yy = String(now.getFullYear()).slice(-2);
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const hh = String(now.getHours()).padStart(2, '0');
        const min = String(now.getMinutes()).padStart(2, '0');
        const ss = String(now.getSeconds()).padStart(2, '0');
        
        const fileName = `${yy}-${mm}-${dd}_${hh}.${min}.${ss}.jpg`;
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

    // Resolve FK IDs for MySQL relational integrity
    const matchedTujuan = await MasterTujuan.findOne({ where: { nama_tujuan: bertemu } });
    const matchedKategori = await MasterKategoriAsal.findOne({ where: { nama_kategori: kategori_asal } });

    const newTamu = await Tamu.create({
      no_reg,
      nama,
      no_telpon: no_telpon || '',
      kategori_asal: kategori_asal || 'Instansi / Dinas',
      kategori_asal_id: matchedKategori ? matchedKategori.id : null,
      asal_instansi: finalAsalInstansi,
      jenis_kelamin: jenis_kelamin || 'Laki-laki',
      alamat: alamat || '',
      lokasi: finalLokasi,
      bertemu,
      tujuan_id: matchedTujuan ? matchedTujuan.id : null,
      keperluan,
      foto: fotoPath,
      tanggal,
      jam,
      status: 'Berkunjung'
    });

    // Kirim notifikasi WA secara otomatis di latar belakang jika pejabat tujuan memiliki kontak HP
    if (matchedTujuan && matchedTujuan.no_hp) {
      waService.sendWANotification({
        targetNoHp: matchedTujuan.no_hp,
        namaPejabat: matchedTujuan.nama_pejabat,
        guest: newTamu.toJSON()
      }).catch(waErr => console.error('Error sending WA notification background:', waErr));
    }

    // Record Activity Log
    try {
      let actorNama = 'Sistem (Publik)';
      if (req.user && req.user.nama) {
        actorNama = req.user.nama;
      } else if (req.headers['x-user-nama']) {
        actorNama = decodeURIComponent(req.headers['x-user-nama']);
      }

      await ActivityLog.create({
        user_nama: actorNama,
        user_id: req.user ? req.user.id : null,
        action: 'REGISTRASI_TAMU',
        details: `Pendaftaran tamu baru: ${nama} (${finalAsalInstansi}) - Tujuan: ${bertemu}`
      });
    } catch (logErr) {
      console.error('Error logging registrasi tamu:', logErr);
    }

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

    // Record Activity Log
    try {
      let actorNama = 'Admin';
      if (req.user && req.user.nama) {
        actorNama = req.user.nama;
      } else if (req.headers['x-user-nama']) {
        actorNama = decodeURIComponent(req.headers['x-user-nama']);
      }

      await ActivityLog.create({
        user_nama: actorNama,
        user_id: req.user ? req.user.id : null,
        action: 'UPDATE_STATUS_TAMU',
        details: `Mengubah status kunjungan ${tamu.nama} (${tamu.no_reg}) menjadi ${nextStatus}`
      });
    } catch (logErr) {
      console.error('Error logging update status tamu:', logErr);
    }

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

    const namaDeleted = tamu.nama;
    const noRegDeleted = tamu.no_reg;
    const fotoDeleted = tamu.foto;

    await tamu.destroy();

    // Hapus file foto dari folder backend/public/uploads jika ada
    if (fotoDeleted && typeof fotoDeleted === 'string' && fotoDeleted.startsWith('/uploads/')) {
      const filePath = path.resolve(__dirname, '../public', fotoDeleted.substring(1));
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (unlinkErr) {
          console.error('Gagal menghapus file foto fisik:', unlinkErr);
        }
      }
    }

    // Record Activity Log
    try {
      let actorNama = 'Admin';
      if (req.user && req.user.nama) {
        actorNama = req.user.nama;
      } else if (req.headers['x-user-nama']) {
        actorNama = decodeURIComponent(req.headers['x-user-nama']);
      }

      await ActivityLog.create({
        user_nama: actorNama,
        user_id: req.user ? req.user.id : null,
        action: 'HAPUS_TAMU',
        details: `Menghapus data kunjungan tamu: ${namaDeleted} (${noRegDeleted})`
      });
    } catch (logErr) {
      console.error('Error logging hapus tamu:', logErr);
    }

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
