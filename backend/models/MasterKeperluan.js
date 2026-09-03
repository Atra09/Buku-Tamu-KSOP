const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const MasterKeperluan = sequelize.define('MasterKeperluan', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nama_keperluan: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  }
}, {
  tableName: 'master_keperluan',
  timestamps: true
});

module.exports = MasterKeperluan;
