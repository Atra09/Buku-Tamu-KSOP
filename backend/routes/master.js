const express = require('express');
const router = express.Router();
const masterController = require('../controllers/masterController');
const verifyToken = require('../middleware/jwt');
const { kordinatorAuth } = require('../middleware/authorization');

// Master Data Endpoints
router.get('/dropdowns', masterController.getDropdownData); // Public untuk dropdown form tamu

// Master Tujuan
router.post('/tujuan', verifyToken, kordinatorAuth, masterController.addTujuan);
router.put('/tujuan/:id', verifyToken, kordinatorAuth, masterController.updateTujuan);
router.delete('/tujuan/:id', verifyToken, kordinatorAuth, masterController.deleteTujuan);

// Master Kategori Asal
router.post('/kategori-asal', verifyToken, kordinatorAuth, masterController.addKategoriAsal);
router.put('/kategori-asal/:id', verifyToken, kordinatorAuth, masterController.updateKategoriAsal);
router.delete('/kategori-asal/:id', verifyToken, kordinatorAuth, masterController.deleteKategoriAsal);

module.exports = router;
