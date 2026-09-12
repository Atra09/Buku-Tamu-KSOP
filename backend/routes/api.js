const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const tamuController = require('../controllers/tamuController');
const masterController = require('../controllers/masterController');
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');
const activityController = require('../controllers/activityController');

// Multer storage configuration for guest uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.resolve(__dirname, '../public/uploads');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `${yy}-${mm}-${dd}_${hh}.${min}.${ss}${ext}`);
  }
});

// Multer storage configuration for user profile photos (frontend/public/profil)
const profilStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.resolve(__dirname, '../../frontend/public/profil');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.png';
    const rawUsername = req.body?.username || req.body?.currentUsername || 'user';
    const cleanUsername = rawUsername.toLowerCase().trim().replace(/[^a-z0-9_-]/g, '_');
    cb(null, `${cleanUsername}${ext}`);
  }
});

const upload = multer({ storage });
const uploadProfil = multer({ storage: profilStorage });

// Auth Routes
router.post('/auth/login', authController.login);
router.get('/auth/me', authController.getProfile);
router.put('/auth/profile', uploadProfil.single('foto'), authController.updateProfile);

// Tamu Routes
router.get('/tamu', tamuController.getAllTamu);
router.get('/tamu/stats', tamuController.getStats);
router.get('/tamu/:id', tamuController.getTamuById);
router.post('/tamu', upload.single('foto'), tamuController.createTamu);
router.patch('/tamu/:id/status', tamuController.updateStatus);
router.delete('/tamu/:id', tamuController.deleteTamu);

// Master Data Routes
router.get('/master/dropdowns', masterController.getDropdownData);
router.post('/master/tujuan', masterController.addTujuan);
router.put('/master/tujuan/:id', masterController.updateTujuan);
router.delete('/master/tujuan/:id', masterController.deleteTujuan);
router.post('/master/kategori-asal', masterController.addKategoriAsal);
router.put('/master/kategori-asal/:id', masterController.updateKategoriAsal);
router.delete('/master/kategori-asal/:id', masterController.deleteKategoriAsal);

// User Management Routes
router.get('/users', userController.getAllUsers);
router.post('/users', userController.createUser);
router.put('/users/:id', userController.updateUser);
router.delete('/users/:id', userController.deleteUser);

const localWaBot = require('../services/localWaBot');

// Activity Log Routes
router.get('/logs', activityController.getActivityLogs);
router.post('/logs', activityController.createLog);

// WA Bot Status & Control Routes
router.get('/wa-bot/status', (req, res) => {
  const status = localWaBot.getBotStatus();
  res.json({ success: true, ...status });
});

router.post('/wa-bot/disconnect', async (req, res) => {
  const ActivityLog = require('../models/ActivityLog');
  const result = await localWaBot.disconnectWhatsApp();

  let actorNama = 'Admin';
  let user_id = null;
  if (req.user) {
    actorNama = req.user.nama || req.user.username || 'Admin';
    user_id = req.user.id || null;
  } else if (req.headers['x-user-nama']) {
    actorNama = decodeURIComponent(req.headers['x-user-nama']);
  }

  try {
    await ActivityLog.create({
      user_nama: actorNama,
      user_id,
      action: 'DISCONNECT_WA_BOT',
      details: 'Memutuskan koneksi WhatsApp Bot Notifikasi'
    });
  } catch (e) {
    console.error('Error logging WA Bot disconnect:', e);
  }

  res.json(result);
});

module.exports = router;
