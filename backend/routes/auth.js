const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const verifyToken = require('../middleware/jwt');
const { userAuth } = require('../middleware/authorization');
const { loginLimiter } = require('../middleware/rateLimiter');
const { uploadProfil } = require('../middleware/upload');

// Auth Endpoints
router.post('/login', loginLimiter, authController.login);
router.get('/me', verifyToken, userAuth, authController.getProfile);
router.put('/profile', verifyToken, userAuth, uploadProfil.single('foto'), authController.updateProfile);

module.exports = router;
