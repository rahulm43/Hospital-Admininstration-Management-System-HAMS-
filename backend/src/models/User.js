const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: { isEmail: true },
  },
  passwordHash: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'password_hash'
  },
  role: {
    type: DataTypes.ENUM('SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'ACCOUNTANT', 'LAB_TECHNICIAN'),
    allowNull: false,
    defaultValue: 'RECEPTIONIST',
  },
  department: {
    type: DataTypes.STRING(255),
  },
  status: {
    type: DataTypes.ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED'),
    defaultValue: 'ACTIVE',
  },
  lastLogin: {
    type: DataTypes.DATE,
    field: 'last_login'
  },
  twoFactorEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'two_factor_enabled'
  },
  twoFactorSecret: {
    type: DataTypes.STRING(255),
    field: 'two_factor_secret'
  },
}, {
  tableName: 'users',
  indexes: [{ fields: ['email'] }, { fields: ['role'] }],
});

module.exports = User;