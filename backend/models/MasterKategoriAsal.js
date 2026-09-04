const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const MasterKategoriAsal = sequelize.define('MasterKategoriAsal', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nama_kategori: {
    type: DataTypes.STRING,
    allowNull: false
  },
  butuh_instansi: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'master_kategori_asal',
  timestamps: true
});

module.exports = MasterKategoriAsal;
