const { Tamu, MasterTujuan, MasterKategoriAsal, ActivityLog, QrSession, User, sequelize } = require('../models');
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');
const waService = require('./waService');
const localWaBot = require('./localWaBot');
const storageService = require('./storageService');
const { getWIBNow } = require('../utils/timeHelper');

/**
 * Menghasilkan nomor registrasi unik & berurutan (misal REG-20261014-01).
 * Dijalankan di dalam transaksi dengan row-level update lock (t.LOCK.UPDATE)
 * untuk mencegah race condition konkurensi antar-tamu.
 */
const generateNoReg = async (transaction = null) => {
  const { dateStr } = getWIBNow();

  const options = {
    where: {
      no_reg: { [Op.like]: `REG-${dateStr}-%` }
    },
    order: [['id', 'DESC']]
  };

  if (transaction) {
    options.transaction = transaction;
    options.lock = transaction.LOCK.UPDATE;
  }

  const lastGuest = await Tamu.findOne(options);

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

/**
 * Mengambil daftar seluruh tamu dengan pencarian dan filter
 */
const getAllTamu = async ({ search, tanggal, kategori_asal, status, limit = 50, offset = 0 }) => {
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

  if (tanggal) where.tanggal = tanggal;
  if (kategori_asal) where.kategori_asal = kategori_asal;
  if (status) where.status = status;

  const { count, rows } = await Tamu.findAndCountAll({
    where,
    order: [['id', 'DESC']],
    limit: parseInt(limit, 10),
    offset: parseInt(offset, 10)
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

  return { count, rows: mappedRows };
};

/**
 * Mengambil detail tamu berdasarkan ID
 */
const getTamuById = async (id) => {
  return await Tamu.findByPk(id, {
    include: [
      { model: MasterTujuan, as: 'MasterTujuan', attributes: ['id', 'nama_tujuan', 'nama_pejabat', 'no_hp'] },
      { model: MasterKategoriAsal, as: 'MasterKategoriAsal', attributes: ['id', 'nama_kategori', 'butuh_instansi'] },
      { model: User, as: 'PetugasPenerima', attributes: ['id', 'nama', 'username', 'role'] }
    ]
  });
};

/**
 * Logika Bisnis Pendaftaran Tamu (createTamu)
 */
const createTamu = async ({ data, file, actorNama, actorUserId, ipAddress }) => {
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
    foto_base64,
    qr_token
  } = data;

  const sanitizeText = (str) => {
    if (typeof str !== 'string') return '';
    return str.replace(/\0/g, '').replace(/[<>]/g, '').trim();
  };

  const cleanNama = sanitizeText(nama);
  const cleanAlamat = sanitizeText(alamat);
  const cleanAsalInstansi = sanitizeText(asal_instansi);
  const cleanKeperluan = sanitizeText(keperluan);
  const cleanNoTelpon = no_telpon ? no_telpon.trim() : '';
  const cleanJenisKelamin = jenis_kelamin || 'Laki-laki';
  const cleanBertemu = bertemu ? bertemu.trim() : '';
  const cleanKategori = kategori_asal ? kategori_asal.trim() : '';

  if (!cleanNama || !cleanBertemu || !cleanKeperluan) {
    const error = new Error('Field nama, bertemu, dan keperluan wajib diisi!');
    error.status = 400;
    throw error;
  }

  // Validasi status Baileys Socket jika bot aktif
  const botStatus = localWaBot.getBotStatus();
  if (botStatus && !botStatus.isConnected) {
    const error = new Error('bot belum terhubung, silahkan hubungi admin !!');
    error.status = 503;
    error.botNotConnected = true;
    throw error;
  }

  const wibNow = getWIBNow();
  const { tanggal, jam } = wibNow;

  let assignedUserId = actorUserId || null;
  let qrSessionDoc = null;

  // Verifikasi token QR jika mendaftar mandiri via scan QR
  if (qr_token) {
    qrSessionDoc = await QrSession.findOne({
      where: { token: qr_token },
      include: [{ model: User, as: 'Petugas', attributes: ['id', 'nama', 'username'] }]
    });

    if (!qrSessionDoc) {
      const error = new Error('Tiket scan barcode pendaftaran tidak ditemukan.');
      error.status = 400;
      error.code = 'INVALID_QR_TOKEN';
      throw error;
    }

    if (qrSessionDoc.status === 'REVOKED' || qrSessionDoc.status === 'EXPIRED') {
      const error = new Error('Tiket barcode pendaftaran telah kedaluwarsa atau dibatalkan.');
      error.status = 400;
      error.code = 'QR_TOKEN_EXPIRED';
      throw error;
    }

    if (new Date() > new Date(qrSessionDoc.expires_at)) {
      await qrSessionDoc.update({ status: 'EXPIRED' });
      const error = new Error('Masa berlaku tiket barcode pendaftaran telah habis (10 menit).');
      error.status = 400;
      error.code = 'QR_TOKEN_EXPIRED';
      throw error;
    }

    assignedUserId = qrSessionDoc.petugas_id;
  }

  // Cegah duplikasi tamu aktif hari ini dengan nomor telepon yang sama
  if (cleanNoTelpon) {
    const existingActiveGuest = await Tamu.findOne({
      where: {
        no_telpon: cleanNoTelpon,
        tanggal,
        status: 'Berkunjung'
      }
    });
    if (existingActiveGuest) {
      const error = new Error(`Nomor telepon/WhatsApp ${cleanNoTelpon} sudah terdaftar dan masih aktif berkunjung hari ini (${existingActiveGuest.no_reg}).`);
      error.status = 400;
      error.code = 'ALREADY_REGISTERED_TODAY';
      throw error;
    }
  }

  // Handle upload foto: via multipart file atau webcam base64
  let fotoPath = null;
  if (file) {
    fotoPath = `/uploads/${file.filename}`;
  } else if (foto_base64) {
    fotoPath = await storageService.saveWebcamBase64Photo(foto_base64, wibNow);
  }

  const cleanLokasi = (lokasi || '').trim();
  const isInvalidLokasi = !cleanLokasi ||
    cleanLokasi === 'Lokasi Tidak Terdeteksi' ||
    cleanLokasi === 'Mendeteksi Lokasi...' ||
    cleanLokasi.startsWith('Perangkat tidak mendukung') ||
    cleanLokasi.startsWith('Gagal mendeteksi') ||
    cleanLokasi.startsWith('Akses Lokasi Ditolak') ||
    cleanLokasi.startsWith('Waktu Deteksi');

  // Validasi Geofencing Wajib GPS Asli: Berlaku ketat untuk semua pendaftaran (tamu mandiri maupun petugas pos jaga)
  const addressMatch = cleanLokasi.match(/\((.*?)\)/);
  const addressOnly = (addressMatch && addressMatch[1])
    ? addressMatch[1].trim()
    : cleanLokasi.replace(/^[-+]?\d*\.?\d+\s*,\s*[-+]?\d*\.?\d+\s*/, '').trim();

  if (isInvalidLokasi || !addressOnly || !addressOnly.toLowerCase().includes('kalianget')) {
    const error = new Error('Pendaftaran ditolak: Anda terdeteksi berada di luar area kantor KSOP (Jalan Raya Kalianget, Desa Kalianget Timur, Kab. Sumenep).');
    error.status = 403;
    error.code = 'LOCATION_OUTSIDE_KSOP';
    throw error;
  }

  const finalLokasi = cleanLokasi;

  // Resolusi Foreign Keys: MasterTujuan & MasterKategoriAsal
  let matchedTujuan = null;
  let matchedKategori = null;

  try {
    matchedTujuan = await MasterTujuan.findOne({ where: { nama_tujuan: cleanBertemu } });
    if (!matchedTujuan) {
      const allTujuan = await MasterTujuan.findAll({ attributes: ['id', 'nama_tujuan'] });
      matchedTujuan = allTujuan.find(t => t.nama_tujuan && t.nama_tujuan.trim().toLowerCase() === cleanBertemu.toLowerCase()) || null;
    }
  } catch (e) {
    console.warn('[CreateTamu Warning] Could not resolve MasterTujuan FK:', e.message);
  }

  try {
    matchedKategori = await MasterKategoriAsal.findOne({ where: { nama_kategori: cleanKategori } });
    if (!matchedKategori) {
      const allKategori = await MasterKategoriAsal.findAll({ attributes: ['id', 'nama_kategori', 'butuh_instansi'] });
      matchedKategori = allKategori.find(k => k.nama_kategori && k.nama_kategori.trim().toLowerCase() === cleanKategori.toLowerCase()) || null;
    }
  } catch (e) {
    console.warn('[CreateTamu Warning] Could not resolve MasterKategoriAsal FK:', e.message);
  }

  // Transaksi Atomik: Kalkulasi no_reg dengan Update Lock + Pembuatan Tamu + Catatan Penggunaan QR
  let newTamu;
  await sequelize.transaction(async (t) => {
    const no_reg = await generateNoReg(t);

    newTamu = await Tamu.create({
      no_reg,
      nama: cleanNama,
      no_telpon: cleanNoTelpon,
      kategori_asal: cleanKategori || 'Instansi / Dinas',
      kategori_asal_id: matchedKategori ? matchedKategori.id : null,
      asal_instansi: cleanAsalInstansi,
      jenis_kelamin: cleanJenisKelamin,
      alamat: cleanAlamat,
      lokasi: finalLokasi,
      bertemu: cleanBertemu,
      tujuan_id: matchedTujuan ? matchedTujuan.id : null,
      keperluan: cleanKeperluan,
      user_id: assignedUserId,
      foto: fotoPath,
      tanggal,
      jam,
      status: 'Berkunjung'
    }, { transaction: t });

    if (qrSessionDoc) {
      await qrSessionDoc.update({
        ip_used: ipAddress || qrSessionDoc.ip_used || null
      }, { transaction: t });
    }
  });

  // Kirim notifikasi WA secara otomatis di latar belakang jika pejabat tujuan memiliki kontak HP
  if (matchedTujuan && matchedTujuan.no_hp) {
    console.log(`[WA Bot Trigger] Mengirim notifikasi WA ke: ${matchedTujuan.nama_pejabat || matchedTujuan.nama_tujuan} (${matchedTujuan.no_hp})`);
    waService.sendWANotification({
      targetNoHp: matchedTujuan.no_hp,
      namaPejabat: matchedTujuan.nama_pejabat,
      guest: newTamu.toJSON()
    }).catch(waErr => console.error('Error sending WA notification background:', waErr));
  }

  // Pencatatan Log Aktivitas
  try {
    if (qrSessionDoc) {
      const officerName = qrSessionDoc.Petugas?.nama || 'Petugas Jaga';
      await ActivityLog.create({
        user_nama: officerName,
        user_id: assignedUserId,
        action: 'REGISTRASI_TAMU',
        details: `Pendaftaran mandiri scan QR oleh tamu: ${cleanNama} (${cleanAsalInstansi}) - Dicatat atas akun petugas piket: ${officerName}`
      });
    } else {
      await ActivityLog.create({
        user_nama: actorNama || 'Sistem (Pos Jaga)',
        user_id: assignedUserId,
        action: 'REGISTRASI_TAMU',
        details: `Pendaftaran tamu baru di pos jaga: ${cleanNama} (${cleanAsalInstansi}) - Tujuan: ${cleanBertemu}`
      });
    }
  } catch (logErr) {
    console.error('Error logging registrasi tamu:', logErr);
  }

  return newTamu;
};

/**
 * Memperbarui status kunjungan tamu (Berkunjung / Selesai)
 */
const updateStatus = async (id, nextStatusInput, actorNama, actorUserId) => {
  const tamu = await Tamu.findByPk(id);
  if (!tamu) {
    const error = new Error('Data tamu tidak ditemukan');
    error.status = 404;
    throw error;
  }

  const nextStatus = nextStatusInput || (tamu.status === 'Berkunjung' ? 'Selesai' : 'Berkunjung');
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

  try {
    await ActivityLog.create({
      user_nama: actorNama || 'Petugas',
      user_id: actorUserId || null,
      action: 'UPDATE_STATUS_TAMU',
      details: `Mengubah status kunjungan ${tamu.nama} (${tamu.no_reg}) menjadi ${nextStatus}`
    });
  } catch (logErr) {
    console.error('Error logging update status tamu:', logErr);
  }

  return tamu;
};

/**
 * Menghapus data tamu beserta file foto secara asinkron
 */
const deleteTamu = async (id, actorNama, actorUserId) => {
  const tamu = await Tamu.findByPk(id);
  if (!tamu) {
    const error = new Error('Data tamu tidak ditemukan');
    error.status = 404;
    throw error;
  }

  const namaDeleted = tamu.nama;
  const noRegDeleted = tamu.no_reg;
  const fotoDeleted = tamu.foto;

  await tamu.destroy();

  // Hapus file foto dari public/uploads secara asinkron non-blocking
  if (fotoDeleted && typeof fotoDeleted === 'string' && fotoDeleted.startsWith('/uploads/')) {
    const filePath = path.resolve(__dirname, '../public', fotoDeleted.substring(1));
    fs.promises.unlink(filePath).catch(err => {
      // File mungkin sudah tidak ada, log sebagai warning saja
      console.warn('Info: foto fisik tidak ditemukan saat dihapus:', err.message);
    });
  }

  try {
    await ActivityLog.create({
      user_nama: actorNama || 'Petugas',
      user_id: actorUserId || null,
      action: 'HAPUS_TAMU',
      details: `Menghapus data kunjungan tamu: ${namaDeleted} (${noRegDeleted})`
    });
  } catch (logErr) {
    console.error('Error logging hapus tamu:', logErr);
  }

  return true;
};

/**
 * Mengambil ringkasan statistik kunjungan untuk Dashboard Admin
 */
const getDashboardStats = async () => {
  const now = new Date();
  const today = getWIBNow(now).tanggal;
  const currentYear = now.getFullYear();
  const firstDayOfMonth = `${today.substring(0, 7)}-01`;

  const dayOfWeek = now.getDay(); // 0: Minggu, 1: Senin, ..., 6: Sabtu
  const distanceToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + distanceToMonday);

  const startOfWeekStr = getWIBNow(monday).tanggal;
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const endOfWeekStr = getWIBNow(sunday).tanggal;

  const [
    totalHariIni,
    totalBulanIni,
    sedangBerkunjung,
    masterKategoriList,
    tamuCategoryGroups,
    weeklyRows,
    monthlyRows
  ] = await Promise.all([
    Tamu.count({ where: { tanggal: today } }),
    Tamu.count({ where: { tanggal: { [Op.gte]: firstDayOfMonth } } }),
    Tamu.count({ where: { status: 'Berkunjung' } }),
    MasterKategoriAsal.findAll({ order: [['id', 'ASC']] }),
    Tamu.findAll({
      attributes: [
        [sequelize.fn('COALESCE', sequelize.col('kategori_asal'), 'Lainnya'), 'kategori'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: [sequelize.fn('COALESCE', sequelize.col('kategori_asal'), 'Lainnya')],
      raw: true
    }),
    Tamu.findAll({
      attributes: [
        'tanggal',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: {
        tanggal: { [Op.between]: [startOfWeekStr, endOfWeekStr] }
      },
      group: ['tanggal'],
      raw: true
    }),
    Tamu.findAll({
      attributes: [
        [sequelize.fn('MONTH', sequelize.col('tanggal')), 'bulan'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: sequelize.where(sequelize.fn('YEAR', sequelize.col('tanggal')), currentYear),
      group: [sequelize.fn('MONTH', sequelize.col('tanggal'))],
      raw: true
    })
  ]);

  const defaultCategoryColors = [
    '#0ea5e9', '#6366f1', '#10b981', '#f59e0b',
    '#ec4899', '#8b5cf6', '#14b8a6', '#f97316'
  ];

  const dbCategoryCountMap = new Map();
  for (const group of tamuCategoryGroups) {
    if (group.kategori) {
      dbCategoryCountMap.set(String(group.kategori).trim().toLowerCase(), Number(group.count || 0));
    }
  }

  const categoryStats = [];
  const processedCatNames = new Set();

  masterKategoriList.forEach((masterCat, idx) => {
    const rawName = masterCat.nama_kategori || 'Kategori';
    const cleanKey = rawName.trim().toLowerCase();
    const count = dbCategoryCountMap.get(cleanKey) || 0;
    processedCatNames.add(cleanKey);

    categoryStats.push({
      label: rawName,
      value: count,
      color: defaultCategoryColors[idx % defaultCategoryColors.length]
    });
  });

  let extraIdx = masterKategoriList.length;
  for (const [catNameLower, count] of dbCategoryCountMap.entries()) {
    if (!processedCatNames.has(catNameLower)) {
      const formattedLabel = catNameLower.charAt(0).toUpperCase() + catNameLower.slice(1);
      categoryStats.push({
        label: formattedLabel,
        value: count,
        color: defaultCategoryColors[extraIdx % defaultCategoryColors.length]
      });
      extraIdx++;
    }
  }

  const dayNamesIndo = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  const weeklyMap = new Map();
  for (const row of weeklyRows) {
    if (row.tanggal) {
      weeklyMap.set(row.tanggal, Number(row.count || 0));
    }
  }

  const weeklyStats = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateStr = getWIBNow(d).tanggal;
    const dayLabel = dayNamesIndo[d.getDay()];
    const count = weeklyMap.get(dateStr) || 0;

    weeklyStats.push({
      day: dayLabel,
      label: dayLabel,
      date: dateStr,
      count
    });
  }

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const monthlyMap = new Map();
  for (const row of monthlyRows) {
    if (row.bulan !== undefined && row.bulan !== null) {
      monthlyMap.set(Number(row.bulan), Number(row.count || 0));
    }
  }

  const monthlyStats = [];
  for (let m = 0; m < 12; m++) {
    const count = monthlyMap.get(m + 1) || 0;
    monthlyStats.push({
      label: monthNames[m],
      month: monthNames[m],
      count
    });
  }

  return {
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
  };
};

module.exports = {
  getWIBNow,
  generateNoReg,
  getAllTamu,
  getTamuById,
  createTamu,
  updateStatus,
  deleteTamu,
  getDashboardStats
};
