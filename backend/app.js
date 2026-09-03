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

// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Routes
app.use('/api', apiRouter);

// Base route test
app.get('/', (req, res) => {
  res.json({
    message: 'Si-Tamu (Buku Tamu Digital) API Server',
    database: 'db_bukutamu',
    status: 'Active',
    version: '1.0.0'
  });
});

// Sync DB and seed initial master data
const startDatabase = async () => {
  try {
    await ensureMySQLDatabaseExists();
    await sequelize.sync({ alter: true });
    console.log('Database db_bukutamu synced successfully');
    await seedInitialData();
  } catch (err) {
    console.error('Failed to sync database db_bukutamu:', err);
  }
};

startDatabase();

module.exports = app;
