const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  nama: {
    type: DataTypes.STRING,
    defaultValue: 'Administrator'
  },
  role: {
    type: DataTypes.STRING,
    defaultValue: 'user'
  },
  foto: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'users',
  timestamps: true
});

module.exports = User;
