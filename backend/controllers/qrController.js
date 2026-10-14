const crypto = require('crypto');
const QRCode = require('qrcode');
const { QrSession, JadwalPetugas, User } = require('../models');
const { Op } = require('sequelize');

const HARI_MAP = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

// Helper to determine active officer for today from JadwalPetugas
const getTodayActiveOfficer = async (fallbackUserId = null) => {
  const todayHari = HARI_MAP[new Date().getDay()];
  
  // 1. Prioritize active schedule for today's day
  let jadwal = await JadwalPetugas.findOne({
    where: { hari: todayHari, status: 'Aktif' },
    include: [{ model: User, attributes: ['id', 'nama', 'username', 'role', 'foto'] }]
  });

  if (jadwal && jadwal.User) {
    return {
      officer: jadwal.User,
      jadwal,
      source: 'SCHEDULE_TODAY'
    };
  }

  // 2. Fallback to any active schedule if today has no schedule
  jadwal = await JadwalPetugas.findOne({
    where: { status: 'Aktif' },
    include: [{ model: User, attributes: ['id', 'nama', 'username', 'role', 'foto'] }],
    order: [['id', 'ASC']]
  });

  if (jadwal && jadwal.User) {
    return {
      officer: jadwal.User,
      jadwal,
      source: 'SCHEDULE_ANY_ACTIVE'
    };
  }

  // 3. Fallback to fallbackUserId or first admin/user in database
  let officer = null;
  if (fallbackUserId) {
    officer = await User.findByPk(fallbackUserId, {
      attributes: ['id', 'nama', 'username', 'role', 'foto']
    });
  }

  if (!officer) {
    officer = await User.findOne({
      order: [['id', 'ASC']],
      attributes: ['id', 'nama', 'username', 'role', 'foto']
    });
  }

  return {
    officer,
    jadwal: null,
    source: 'USER_FALLBACK'
  };
};

exports.generateQrToken = async (req, res) => {
  try {
    const forceNew = req.query.force === 'true' || req.query.force === '1';
    const fallbackUserId = req.user ? req.user.id : null;
    const { officer, jadwal } = await getTodayActiveOfficer(fallbackUserId);

    if (!officer) {
      return res.status(500).json({
        success: false,
        message: 'Tidak ada akun petugas yang tersedia di sistem.'
      });
    }

    const DURATION_MINUTES = 10;
    const now = new Date();

    // Tentukan Base URL publik (mengikuti logika persis seperti Salin Tautan)
    let baseUrl = req.query.origin;

    if (!baseUrl || typeof baseUrl !== 'string' || !baseUrl.startsWith('http')) {
      // Fallback ke header reverse proxy (Cloudflare / Nginx) atau Express
      const proto = req.headers['x-forwarded-proto'] || (req.secure ? 'https' : req.protocol) || 'https';
      const host = req.headers['x-forwarded-host'] || req.get('host') || 'localhost';
      baseUrl = `${proto}://${host}`;
    }

    // Bersihkan trailing slash
    baseUrl = baseUrl.replace(/\/+$/, '');

    // Helper untuk membuat QR code data URL dengan kontras tinggi & warna KSOP
    const generateQrImage = async (fullUrl) => {
      return await QRCode.toDataURL(fullUrl, {
        errorCorrectionLevel: 'M',
        margin: 2,
        width: 420,
        color: {
          dark: '#0c4a6e', // KSOP Deep Sky/Navy
          light: '#ffffff'
        }
      });
    };

    // 1. Jika TIDAK dipaksa baru, cari sesi ACTIVE yang masih berlaku untuk petugas ini
    if (!forceNew) {
      const activeSession = await QrSession.findOne({
        where: {
          petugas_id: officer.id,
          status: 'ACTIVE',
          expires_at: { [Op.gt]: now }
        },
        order: [['id', 'DESC']]
      });

      if (activeSession) {
        const remainingSeconds = Math.max(0, Math.floor((new Date(activeSession.expires_at) - now) / 1000));
        // Jika sisa waktu masih lebih dari 10 detik, pakai sesi ini
        if (remainingSeconds > 10) {
          const registrationPath = `/buku-tamu?reg=${activeSession.token}`;
          const fullRegistrationUrl = `${baseUrl}${registrationPath}`;
          const qrDataUrl = await generateQrImage(fullRegistrationUrl);

          return res.json({
            success: true,
            data: {
              token: activeSession.token,
              registration_path: registrationPath,
              registration_url: fullRegistrationUrl,
              qr_image: qrDataUrl,
              expires_at: activeSession.expires_at,
              duration_seconds: DURATION_MINUTES * 60,
              remaining_seconds: remainingSeconds,
              is_reused: true,
              hari: jadwal ? jadwal.hari : HARI_MAP[new Date().getDay()],
              shift: jadwal ? jadwal.shift : 'Piket Harian',
              pos_info: {
                petugas_nama: officer.nama,
                petugas_role: officer.role
              }
            }
          });
        }
      }
    }

    // 2. Buat token baru jika dipaksa (force=true) atau tidak ada sesi aktif
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + DURATION_MINUTES * 60 * 1000);

    const session = await QrSession.create({
      token,
      petugas_id: officer.id,
      jadwal_id: jadwal ? jadwal.id : null,
      status: 'ACTIVE',
      expires_at: expiresAt,
      ip_created: req.ip || req.connection?.remoteAddress || null
    });

    // Generate high-resolution QR image data URL menggunakan URL lengkap
    const registrationPath = `/buku-tamu?reg=${session.token}`;
    const fullRegistrationUrl = `${baseUrl}${registrationPath}`;
    const qrDataUrl = await generateQrImage(fullRegistrationUrl);

    res.json({
      success: true,
      data: {
        token: session.token,
        registration_path: registrationPath,
        registration_url: fullRegistrationUrl,
        qr_image: qrDataUrl,
        expires_at: session.expires_at,
        duration_seconds: DURATION_MINUTES * 60,
        remaining_seconds: DURATION_MINUTES * 60,
        is_reused: false,
        hari: jadwal ? jadwal.hari : HARI_MAP[new Date().getDay()],
        shift: jadwal ? jadwal.shift : 'Piket Harian',
        pos_info: {
          petugas_nama: officer.nama,
          petugas_role: officer.role
        }
      }
    });
  } catch (err) {
    console.error('Error generating QR token:', err);
    res.status(500).json({
      success: false,
      message: 'Gagal membuat token QR dinamis: ' + err.message
    });
  }
};

/**
 * Verify validity of QR token
 * Publicly accessible by guest's smartphone
 */
exports.verifyQrToken = async (req, res) => {
  try {
    const token = req.query.reg || req.query.token || req.body.reg || req.body.token;

    if (!token) {
      return res.status(400).json({
        success: false,
        code: 'MISSING_TOKEN',
        message: 'Parameter token barcode wajib disertakan.'
      });
    }

    const session = await QrSession.findOne({
      where: { token },
      include: [
        { model: User, as: 'Petugas', attributes: ['id', 'nama', 'role'] },
        { model: JadwalPetugas, as: 'Jadwal', attributes: ['id', 'hari', 'shift'] }
      ]
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        code: 'INVALID',
        message: 'Tiket barcode tidak ditemukan atau tidak valid.'
      });
    }

    if (session.status !== 'ACTIVE') {
      const msg = session.status === 'USED'
        ? 'Tiket barcode ini sudah pernah digunakan untuk pendaftaran tamu (1x pakai).'
        : 'Tiket barcode ini telah dibatalkan atau tidak berlaku lagi.';
      return res.status(400).json({
        success: false,
        code: 'NOT_ACTIVE',
        status: session.status,
        message: msg
      });
    }

    if (new Date() > new Date(session.expires_at)) {
      await session.update({ status: 'EXPIRED' });
      return res.status(400).json({
        success: false,
        code: 'EXPIRED',
        message: 'Masa berlaku tiket barcode telah habis (kedaluwarsa 10 menit). Silakan minta petugas untuk scan barcode terbaru.'
      });
    }

    // STRICT PRIVACY: Anonymous officer representation
    res.json({
      success: true,
      valid: true,
      token: session.token,
      expires_at: session.expires_at,
      guest_mode: {
        officer_label: 'Petugas Jaga',
        pos_label: 'Pos Pelayanan KSOP'
      }
    });
  } catch (err) {
    console.error('Error verifying QR token:', err);
    res.status(500).json({
      success: false,
      message: 'Gagal memverifikasi token QR: ' + err.message
    });
  }
};

/**
 * Revoke a QR token immediately (used on unauthorized admin access attempts)
 */
exports.revokeQrToken = async (req, res) => {
  try {
    const token = req.body.token || req.query.token;
    if (token) {
      await QrSession.update(
        { status: 'REVOKED' },
        { where: { token, status: 'ACTIVE' } }
      );
    }
    res.json({
      success: true,
      message: 'Sesi tiket barcode berhasil dibatalkan dan dihanguskan.'
    });
  } catch (err) {
    console.error('Error revoking QR token:', err);
    res.status(500).json({
      success: false,
      message: 'Gagal membatalkan token: ' + err.message
    });
  }
};
