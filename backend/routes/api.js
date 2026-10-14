const express = require('express');
const router = express.Router();

const authRoutes = require('./auth');
const tamuRoutes = require('./tamu');
const masterRoutes = require('./master');
const jadwalRoutes = require('./jadwal');
const qrRoutes = require('./qr');
const userRoutes = require('./user');
const activityRoutes = require('./activity');
const botRoutes = require('./bot');

/**
 * Aggregator Router
 * Menyusun sub-router modular per domain tanpa mengubah URL API endpoint frontend sama sekali.
 */
router.use('/auth', authRoutes);
router.use('/tamu', tamuRoutes);
router.use('/master', masterRoutes);
router.use('/jadwal', jadwalRoutes);
router.use('/qr', qrRoutes);
router.use('/users', userRoutes);
router.use('/logs', activityRoutes);
router.use('/', botRoutes);

module.exports = router;
