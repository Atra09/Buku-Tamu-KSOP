const express = require('express');
const router = express.Router();
const jadwalController = require('../controllers/jadwalController');
const verifyToken = require('../middleware/jwt');
const { userAuth, kordinatorAuth } = require('../middleware/authorization');

// Jadwal Petugas Endpoints
router.get('/', verifyToken, userAuth, jadwalController.getAllJadwal);
router.get('/petugas', verifyToken, userAuth, jadwalController.getPetugasOptions);
router.post('/', verifyToken, kordinatorAuth, jadwalController.addJadwal);
router.put('/:id', verifyToken, kordinatorAuth, jadwalController.updateJadwal);
router.delete('/:id', verifyToken, kordinatorAuth, jadwalController.deleteJadwal);

module.exports = router;
