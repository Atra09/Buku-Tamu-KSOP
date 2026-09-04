const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const tamuController = require('../controllers/tamuController');
const masterController = require('../controllers/masterController');
const authController = require('../controllers/authController');

// Auth Routes
router.post('/auth/login', authController.login);
router.get('/auth/me', authController.getProfile);

// Multer storage configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.resolve(__dirname, '../public/uploads');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, 'foto-' + uniqueSuffix + ext);
  }
});

const upload = multer({ storage });

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
router.post('/master/keperluan', masterController.addKeperluan);
router.post('/master/kategori-asal', masterController.addKategoriAsal);
router.put('/master/kategori-asal/:id', masterController.updateKategoriAsal);
router.delete('/master/kategori-asal/:id', masterController.deleteKategoriAsal);

module.exports = router;
