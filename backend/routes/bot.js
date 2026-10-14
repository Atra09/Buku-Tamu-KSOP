const express = require('express');
const router = express.Router();
const localWaBot = require('../services/localWaBot');
const waTemplateController = require('../controllers/waTemplateController');
const { ActivityLog } = require('../models');
const { resolveActor } = require('../utils/actorHelper');
const verifyToken = require('../middleware/jwt');
const { adminAuth } = require('../middleware/authorization');

// WA Bot Status & Control Endpoints
router.get('/wa-bot/status', (req, res) => {
  const status = localWaBot.getBotStatus();
  res.json({ success: true, ...status });
});

router.post('/wa-bot/disconnect', verifyToken, adminAuth, async (req, res) => {
  const result = await localWaBot.disconnectWhatsApp();
  const { actorNama, userId } = await resolveActor(req, 'Admin');

  try {
    await ActivityLog.create({
      user_nama: actorNama,
      user_id: userId,
      action: 'DISCONNECT_WA_BOT',
      details: 'Memutuskan koneksi WhatsApp Bot Notifikasi'
    });
  } catch (e) {
    console.error('Error logging WA Bot disconnect:', e);
  }

  res.json(result);
});

// WA Template Endpoints (Admin Only)
router.get('/wa-templates', verifyToken, adminAuth, waTemplateController.getTemplates);
router.post('/wa-templates', verifyToken, adminAuth, waTemplateController.createTemplate);
router.put('/wa-templates/:id', verifyToken, adminAuth, waTemplateController.updateTemplate);
router.delete('/wa-templates/:id', verifyToken, adminAuth, waTemplateController.deleteTemplate);
router.patch('/wa-templates/activate/:id', verifyToken, adminAuth, waTemplateController.setActiveTemplate);

module.exports = router;
