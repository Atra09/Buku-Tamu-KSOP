const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ActivityLog = sequelize.define('ActivityLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_nama: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'Sistem'
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  action: {
    type: DataTypes.STRING,
    allowNull: false
  },
  details: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  ip_address: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'activity_logs',
  timestamps: true
});

module.exports = ActivityLog;
