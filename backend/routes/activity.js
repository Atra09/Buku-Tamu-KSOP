const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activityController');
const verifyToken = require('../middleware/jwt');
const { optionalVerifyToken } = require('../middleware/jwt');
const { kordinatorAuth } = require('../middleware/authorization');
const { publicLogsLimiter } = require('../middleware/rateLimiter');

// Activity Log Endpoints
router.get('/', verifyToken, kordinatorAuth, activityController.getActivityLogs);
router.post('/', optionalVerifyToken, publicLogsLimiter, activityController.createLog); // Supports authenticated user & public logging

module.exports = router;
