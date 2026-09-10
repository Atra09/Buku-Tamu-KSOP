const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const apiRouter = require('./routes/api');
const { ensureMySQLDatabaseExists } = require('./config/database');
const { sequelize, seedInitialData } = require('./models');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

const fs = require('fs');

// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Serve frontend production build (dist) if available
const frontendDist = path.join(__dirname, '../frontend/dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
}

// API Routes
app.use('/api', apiRouter);

// Base route & SPA Fallback
app.get('*', (req, res) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
    return res.status(404).json({ success: false, message: 'Endpoint tidak ditemukan' });
  }
  if (fs.existsSync(path.join(frontendDist, 'index.html'))) {
    return res.sendFile(path.join(frontendDist, 'index.html'));
  }
  res.json({
    message: 'Si-Tamu (Buku Tamu Digital) API Server',
    database: 'db_bukutamu',
    status: 'Active',
    version: '1.0.0'
  });
});

const localWaBot = require('./services/localWaBot');

// Sync DB, seed initial master data, and start Local WA Bot
const startDatabase = async () => {
  try {
    await ensureMySQLDatabaseExists();
    await sequelize.sync({ alter: true });
    console.log('Database db_bukutamu synced successfully');
    await seedInitialData();

    // Start Local WA Bot (Baileys)
    localWaBot.connectToWhatsApp();
  } catch (err) {
    console.error('Failed to sync database db_bukutamu:', err);
  }
};

startDatabase();

module.exports = app;
