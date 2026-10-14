const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const verifyToken = require('../middleware/jwt');
const { adminAuth } = require('../middleware/authorization');

// User Management Endpoints (Admin Only)
router.get('/', verifyToken, adminAuth, userController.getAllUsers);
router.post('/', verifyToken, adminAuth, userController.createUser);
router.put('/:id', verifyToken, adminAuth, userController.updateUser);
router.delete('/:id', verifyToken, adminAuth, userController.deleteUser);

module.exports = router;
