const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const WaTemplate = sequelize.define('WaTemplate', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nama_template: {
    type: DataTypes.STRING,
    allowNull: false
  },
  isi_pesan: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'wa_templates',
  timestamps: true
});

module.exports = WaTemplate;
