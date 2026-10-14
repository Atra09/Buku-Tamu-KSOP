const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
require('dotenv').config();

const apiRouter = require('./routes/api');
const { ensureMySQLDatabaseExists } = require('./config/database');
const { sequelize, seedInitialData } = require('./models');

const app = express();

// Trust reverse proxy (Nginx & Cloudflare Tunnel) to get accurate client IP address
app.set('trust proxy', 1);

// HTTP Security Headers (Helmet)
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false
}));

// CORS Configuration
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
  : true;

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Lightweight API Request Logger for terminal visibility
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      const status = res.statusCode;
      const statusIcon = status < 400 ? '✅' : '❌';
      console.log(`[API ${statusIcon}] ${req.method} ${req.originalUrl} - ${status} (${duration}ms)`);
    });
  }
  next();
});

const fs = require('fs');

// Serve static uploads & profil (Check backend public and frontend public)
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
app.use('/profil', express.static(path.join(__dirname, 'public/profil')));
app.use('/profil', express.static(path.join(__dirname, '../frontend/public/profil')));

// Serve frontend production build (dist) if available
const frontendDist = path.join(__dirname, '../frontend/dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
}

// API Routes
app.use('/api', apiRouter);

// Base route & SPA Fallback
app.get('*', (req, res) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads') || req.path.startsWith('/profil')) {
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
    await sequelize.sync();
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
