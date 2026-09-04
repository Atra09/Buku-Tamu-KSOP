const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Tamu = sequelize.define('Tamu', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  no_reg: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  nama: {
    type: DataTypes.STRING,
    allowNull: false
  },
  no_telpon: {
    type: DataTypes.STRING,
    allowNull: true
  },
  kategori_asal: {
    type: DataTypes.STRING,
    defaultValue: 'Instansi' // Instansi, Masyarakat, Perusahaan, Lainnya
  },
  kategori_asal_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'master_kategori_asal',
      key: 'id'
    }
  },
  asal_instansi: {
    type: DataTypes.STRING,
    allowNull: false
  },
  jenis_kelamin: {
    type: DataTypes.STRING,
    allowNull: false // Laki-laki / Perempuan
  },
  alamat: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  lokasi: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  bertemu: {
    type: DataTypes.STRING,
    allowNull: false
  },
  tujuan_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'master_tujuan',
      key: 'id'
    }
  },
  keperluan: {
    type: DataTypes.STRING,
    allowNull: false
  },
  keperluan_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'master_keperluan',
      key: 'id'
    }
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  foto: {
    type: DataTypes.STRING,
    allowNull: true
  },
  tanggal: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  jam: {
    type: DataTypes.STRING,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('Berkunjung', 'Selesai'),
    defaultValue: 'Berkunjung'
  },
  tanggal_keluar: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  jam_keluar: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'tamu',
  timestamps: true
});

module.exports = Tamu;
