const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const QrSession = sequelize.define('QrSession', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  token: {
    type: DataTypes.STRING(64),
    allowNull: false,
    unique: true
  },
  petugas_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  jadwal_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'jadwal_petugas',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('ACTIVE', 'USED', 'REVOKED', 'EXPIRED'),
    allowNull: false,
    defaultValue: 'ACTIVE'
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: false
  },
  ip_created: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  ip_used: {
    type: DataTypes.STRING(100),
    allowNull: true
  }
}, {
  tableName: 'qr_sessions',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['token']
    },
    {
      fields: ['status', 'expires_at']
    }
  ]
});

module.exports = QrSession;
