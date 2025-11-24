const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AuditLog = sequelize.define('AuditLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  entityType: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  entityId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  action: {
    type: DataTypes.ENUM('CREATE', 'READ', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT'),
    allowNull: false,
  },
  previousValues: {
    type: DataTypes.JSON,
  },
  newValues: {
    type: DataTypes.JSON,
  },
  ipAddress: {
    type: DataTypes.STRING(50),
  },
  userAgent: {
    type: DataTypes.TEXT,
  },
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'audit_logs',
  indexes: [
    { fields: ['user_id'] },
    { fields: ['entity_type'] },
    { fields: ['action'] },
    { fields: ['timestamp'] },
  ],
});

module.exports = AuditLog;
