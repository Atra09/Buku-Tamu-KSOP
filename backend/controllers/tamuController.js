const { Tamu, MasterTujuan, MasterKategoriAsal, ActivityLog, User } = require('../models');
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');
const waService = require('../services/waService');
const localWaBot = require('../services/localWaBot');

// Helper to resolve actor info and user_id for activity logging
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

// Helper for explicit Asia/Jakarta (WIB UTC+7) date & time strings
const getWIBNow = (d = new Date()) => {
  const tanggal = d.toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' });
  const jam = d.toLocaleTimeString('en-GB', { timeZone: 'Asia/Jakarta', hour12: false });
  const [year, month, day] = tanggal.split('-');
  const [hh, min, ss] = jam.split(':');

  return {
    tanggal,
    jam,
    year,
    month,
    day,
    dateStr: `${year}${month}${day}`,
    yy: year.slice(-2),
    hh,
    min,
    ss
  };
};

// Helper to generate registration number e.g. REG-20260907-0001 (Unique & Incremental)
const generateNoReg = async () => {
  const { dateStr } = getWIBNow();

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
          const wib = getWIBNow(updatedDate);
          g.tanggal_keluar = wib.tanggal;
          g.jam_keluar = wib.jam;
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

    // 1. Verifikasi koneksi WA Bot. Pendaftaran dibatalkan jika WA Bot tidak aktif.
    const botStatus = localWaBot.getBotStatus();
    if (!botStatus.isConnected) {
      return res.status(400).json({
        success: false,
        botNotConnected: true,
        message: 'bot belum terhubung, silahkan hubungi admin !!'
      });
    }

    const no_reg = await generateNoReg();
    const wibNow = getWIBNow();
    const tanggal = wibNow.tanggal;
    const jam = wibNow.jam;

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
        const fileName = `${wibNow.yy}-${wibNow.month}-${wibNow.day}_${wibNow.hh}.${wibNow.min}.${wibNow.ss}.jpg`;
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
    let matchedTujuan = null;
    let matchedKategori = null;
    const cleanBertemu = (bertemu || '').trim();
    const cleanKategori = (kategori_asal || '').trim();

    try {
      matchedTujuan = await MasterTujuan.findOne({
        where: { nama_tujuan: cleanBertemu },
        attributes: ['id', 'nama_tujuan', 'nama_pejabat', 'no_hp']
      });
      if (!matchedTujuan) {
        const allTujuan = await MasterTujuan.findAll({ attributes: ['id', 'nama_tujuan', 'nama_pejabat', 'no_hp'] });
        matchedTujuan = allTujuan.find(t => t.nama_tujuan && t.nama_tujuan.trim().toLowerCase() === cleanBertemu.toLowerCase()) || null;
      }
    } catch (e) {
      console.warn('[CreateTamu Warning] Could not resolve MasterTujuan FK:', e.message);
    }

    try {
      matchedKategori = await MasterKategoriAsal.findOne({
        where: { nama_kategori: cleanKategori },
        attributes: ['id', 'nama_kategori', 'butuh_instansi']
      });
      if (!matchedKategori) {
        const allKategori = await MasterKategoriAsal.findAll({ attributes: ['id', 'nama_kategori', 'butuh_instansi'] });
        matchedKategori = allKategori.find(k => k.nama_kategori && k.nama_kategori.trim().toLowerCase() === cleanKategori.toLowerCase()) || null;
      }
    } catch (e) {
      console.warn('[CreateTamu Warning] Could not resolve MasterKategoriAsal FK:', e.message);
    }

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
      console.log(`[WA Bot Trigger] Mengirim notifikasi WA ke: ${matchedTujuan.nama_pejabat || matchedTujuan.nama_tujuan} (${matchedTujuan.no_hp})`);
      waService.sendWANotification({
        targetNoHp: matchedTujuan.no_hp,
        namaPejabat: matchedTujuan.nama_pejabat,
        guest: newTamu.toJSON()
      }).catch(waErr => console.error('Error sending WA notification background:', waErr));
    } else {
      console.log(`[WA Bot Skip] Tujuan: "${bertemu}". Matched: ${!!matchedTujuan}, No HP: ${matchedTujuan ? matchedTujuan.no_hp : 'N/A'}`);
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
      const wibNow = getWIBNow();
      tamu.tanggal_keluar = wibNow.tanggal;
      tamu.jam_keluar = wibNow.jam;
    } else {
      tamu.tanggal_keluar = null;
      tamu.jam_keluar = null;
    }

    await tamu.save();

    // Record Activity Log
    try {
      const { actorNama, userId } = await resolveActor(req);

      await ActivityLog.create({
        user_nama: actorNama,
        user_id: userId,
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
      const { actorNama, userId } = await resolveActor(req);

      await ActivityLog.create({
        user_nama: actorNama,
        user_id: userId,
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

// Helper for local YYYY-MM-DD string in Asia/Jakarta (WIB)
const getLocalDateString = (d = new Date()) => {
  return getWIBNow(d).tanggal;
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

    // 1. Distribution by category directly & dynamically from MasterKategoriAsal database table
    const masterKategoriList = await MasterKategoriAsal.findAll({
      order: [['id', 'ASC']]
    });

    const categoryStats = [];
    const countedCategoryIds = [];
    const countedNames = [];

    for (const kat of masterKategoriList) {
      countedCategoryIds.push(kat.id);
      countedNames.push(kat.nama_kategori);

      const count = await Tamu.count({
        where: {
          [Op.or]: [
            { kategori_asal_id: kat.id },
            { kategori_asal: kat.nama_kategori }
          ]
        }
      });

      categoryStats.push({
        id: kat.id,
        label: kat.nama_kategori,
        value: count
      });
    }

    // Count leftover unmapped guests
    const unmappedCount = await Tamu.count({
      where: {
        [Op.and]: [
          {
            [Op.or]: [
              { kategori_asal_id: null },
              { kategori_asal_id: { [Op.notIn]: countedCategoryIds } }
            ]
          },
          {
            kategori_asal: { [Op.notIn]: countedNames }
          }
        ]
      }
    });

    if (unmappedCount > 0) {
      const existingLainnya = categoryStats.find(c => c.label.toLowerCase().includes('lainnya'));
      if (existingLainnya) {
        existingLainnya.value += unmappedCount;
      } else {
        categoryStats.push({
          id: 0,
          label: 'Lainnya',
          value: unmappedCount
        });
      }
    }

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
        totalKategoriAsal: masterKategoriList.length,
        kategori: categoryStats.reduce((acc, c) => {
          acc[c.label] = c.value;
          return acc;
        }, {}),
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
