const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const JadwalPetugas = sequelize.define('JadwalPetugas', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  hari: {
    type: DataTypes.ENUM('Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'),
    allowNull: false
  },
  shift: {
    type: DataTypes.STRING,
    defaultValue: 'Piket Harian'
  },
  keterangan: {
    type: DataTypes.STRING,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('Aktif', 'Nonaktif'),
    defaultValue: 'Aktif'
  }
}, {
  tableName: 'jadwal_petugas',
  timestamps: true
});

module.exports = JadwalPetugas;
