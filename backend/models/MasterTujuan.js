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
  },
  nama_pejabat: {
    type: DataTypes.STRING,
    allowNull: true
  },
  no_hp: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'master_tujuan',
  timestamps: true
});

module.exports = MasterTujuan;
