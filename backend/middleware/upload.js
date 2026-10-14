const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { getWIBNow } = require('../utils/timeHelper');

// Konfigurasi Multer Disk Storage untuk upload foto tamu dari perangkat
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.resolve(__dirname, '../public/uploads');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const wib = getWIBNow();
    const rawExt = path.extname(file.originalname).toLowerCase();
    const ext = ['.jpg', '.jpeg', '.png', '.webp'].includes(rawExt) ? rawExt : '.jpg';
    const randomSuffix = crypto.randomBytes(3).toString('hex');
    cb(null, `${wib.yy}-${wib.month}-${wib.day}_${wib.hh}.${wib.min}.${wib.ss}_${randomSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Maksimal 5MB
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
    const allowedExts = ['.jpg', '.jpeg', '.png', '.webp'];
    const rawExt = path.extname(file.originalname).toLowerCase();

    if (allowedMimes.includes(file.mimetype) && allowedExts.includes(rawExt)) {
      cb(null, true);
    } else {
      cb(new Error('Format file tidak didukung. Hanya file foto JPEG, PNG, dan WebP yang diizinkan.'), false);
    }
  }
});

/**
 * Wrapper middleware untuk menangani error upload Multer secara konsisten dalam format JSON
 */
const handleUploadFoto = (req, res, next) => {
  upload.single('foto')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, message: 'Ukuran file foto melebihi batas maksimal 5MB.' });
      }
      return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
};

// Multer memoryStorage configuration untuk upload foto profil akun
const uploadProfil = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

module.exports = {
  upload,
  handleUploadFoto,
  uploadProfil
};
