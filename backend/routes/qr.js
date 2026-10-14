const express = require('express');
const router = express.Router();
const qrController = require('../controllers/qrController');
const verifyToken = require('../middleware/jwt');
const { userAuth } = require('../middleware/authorization');

// QR Token Endpoints
router.get('/generate', verifyToken, userAuth, qrController.generateQrToken);
router.get('/verify', qrController.verifyQrToken);
router.post('/verify', qrController.verifyQrToken);
router.post('/revoke', verifyToken, userAuth, qrController.revokeQrToken);

module.exports = router;
