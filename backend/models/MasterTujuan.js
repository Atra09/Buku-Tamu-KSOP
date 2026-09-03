const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const MasterTujuan = sequelize.define('MasterTujuan', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nama_tujuan: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  }
}, {
  tableName: 'master_tujuan',
  timestamps: true
});

module.exports = MasterTujuan;
