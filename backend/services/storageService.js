const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ALLOWED_MIMES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const EXT_MAP = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp'
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

/**
 * Menyimpan foto base64 webcam ke folder public/uploads secara asinkron (non-blocking)
 * @param {string} fotoBase64 - String base64 atau data URL gambar
 * @param {object} wibNow - Objek timestamp WIB { yy, month, day, hh, min, ss }
 * @returns {Promise<string>} Path file foto relatif untuk disimpan di database (misal /uploads/...)
 */
const saveWebcamBase64Photo = async (fotoBase64, wibNow) => {
  if (!fotoBase64) return null;

  let base64Data = fotoBase64;
  let mimeType = 'image/jpeg';
  const matches = fotoBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  if (matches && matches.length === 3) {
    mimeType = matches[1].toLowerCase();
    base64Data = matches[2];
  }

  if (!ALLOWED_MIMES.includes(mimeType)) {
    const error = new Error('Format foto webcam tidak valid (hanya JPEG, PNG, dan WebP).');
    error.status = 400;
    throw error;
  }

  const buffer = Buffer.from(base64Data, 'base64');
  if (buffer.length > MAX_FILE_SIZE) {
    const error = new Error('Ukuran foto webcam melebihi batas maksimal 5MB.');
    error.status = 400;
    throw error;
  }

  const fileExt = EXT_MAP[mimeType] || '.jpg';
  const randomSuffix = crypto.randomBytes(3).toString('hex');
  const fileName = `${wibNow.yy}-${wibNow.month}-${wibNow.day}_${wibNow.hh}.${wibNow.min}.${wibNow.ss}_${randomSuffix}${fileExt}`;
  const uploadDir = path.resolve(__dirname, '../public/uploads');

  if (!fs.existsSync(uploadDir)) {
    await fs.promises.mkdir(uploadDir, { recursive: true });
  }

  const fullFilePath = path.join(uploadDir, fileName);
  await fs.promises.writeFile(fullFilePath, buffer);

  return `/uploads/${fileName}`;
};

const getProfilDirs = () => [
  path.resolve(__dirname, '../public/profil'),
  path.resolve(__dirname, '../../frontend/public/profil')
];

/**
 * Membersihkan foto profil lama secara asinkron non-blocking
 */
const cleanupOldProfilePhotos = async (cleanUser, currentFotoUrl, newFileName) => {
  const profilDirs = getProfilDirs();

  await Promise.all(profilDirs.map(async (profilDir) => {
    try {
      const files = await fs.promises.readdir(profilDir);
      await Promise.all(files.map(async (file) => {
        if (file === '.gitkeep') return;
        if (newFileName && file === newFileName) return;

        const lowerFile = file.toLowerCase();
        if (
          lowerFile.startsWith('profile_') ||
          (cleanUser && (lowerFile.startsWith(`${cleanUser}.`) || lowerFile.startsWith(`${cleanUser}_`)))
        ) {
          try {
            await fs.promises.unlink(path.join(profilDir, file));
          } catch (e) {}
        }
      }));

      if (currentFotoUrl && typeof currentFotoUrl === 'string') {
        const cleanPath = currentFotoUrl.split('?')[0];
        if (cleanPath.startsWith('/profil/')) {
          const fileNameOnly = cleanPath.replace('/profil/', '');
          if (fileNameOnly !== newFileName) {
            const targetPath = path.join(profilDir, fileNameOnly);
            try {
              await fs.promises.unlink(targetPath);
            } catch (e) {}
          }
        }
      }
    } catch (err) {
      // Directory may not exist yet or no access
    }
  }));
};

/**
 * Menyimpan foto profil user (dari file Multer atau string base64) secara asinkron non-blocking
 */
const saveProfilePhoto = async ({ file, fotoBase64, username, oldFoto }) => {
  const cleanUser = (username || 'user').toLowerCase().replace(/[^a-z0-9_-]/g, '');
  const profilDirs = getProfilDirs();

  // Ensure directories exist asynchronously
  await Promise.all(profilDirs.map(async (dir) => {
    try {
      await fs.promises.mkdir(dir, { recursive: true });
    } catch (e) {}
  }));

  if (file) {
    const origName = file.originalname || file.filename || 'profile.png';
    const ext = (path.extname(origName) || '.png').toLowerCase();
    const targetFilename = `${cleanUser}${ext}`;

    await cleanupOldProfilePhotos(cleanUser, oldFoto, targetFilename);

    let buffer = file.buffer;
    if (!buffer && file.path) {
      buffer = await fs.promises.readFile(file.path);
    }

    if (buffer) {
      await Promise.all(profilDirs.map(dir =>
        fs.promises.writeFile(path.join(dir, targetFilename), buffer).catch(() => {})
      ));
    }

    return `/profil/${targetFilename}`;
  }

  if (fotoBase64 && fotoBase64.startsWith('data:image')) {
    const base64Data = fotoBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    const targetFilename = `${cleanUser}.png`;

    await cleanupOldProfilePhotos(cleanUser, oldFoto, targetFilename);

    await Promise.all(profilDirs.map(dir =>
      fs.promises.writeFile(path.join(dir, targetFilename), buffer).catch(() => {})
    ));

    return `/profil/${targetFilename}`;
  }

  if (fotoBase64) {
    return fotoBase64.split('?')[0];
  }

  return null;
};

module.exports = {
  saveWebcamBase64Photo,
  saveProfilePhoto,
  cleanupOldProfilePhotos
};
