const express = require('express');
const router = express.Router();
const tamuController = require('../controllers/tamuController');
const verifyToken = require('../middleware/jwt');
const { userAuth, kordinatorAuth } = require('../middleware/authorization');
const { guestRegisterLimiter } = require('../middleware/rateLimiter');
const { handleUploadFoto } = require('../middleware/upload');

// Tamu Endpoints
router.get('/', verifyToken, userAuth, tamuController.getAllTamu);
router.get('/stats', verifyToken, userAuth, tamuController.getStats);
router.get('/:id', verifyToken, userAuth, tamuController.getTamuById);
router.post('/', guestRegisterLimiter, handleUploadFoto, tamuController.createTamu);
router.patch('/:id/status', verifyToken, userAuth, tamuController.updateStatus);
router.delete('/:id', verifyToken, kordinatorAuth, tamuController.deleteTamu);

module.exports = router;
