const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Patient = require('./Patient');
const User = require('./User');

const LabOrder = sequelize.define('LabOrder', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  patientId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: Patient,
      key: 'id',
    },
  },
  orderedByDoctorId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: User,
      key: 'id',
    },
  },
  orderNumber: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
  },
  tests: {
    type: DataTypes.JSON,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'),
    defaultValue: 'PENDING',
  },
  priority: {
    type: DataTypes.ENUM('ROUTINE', 'URGENT', 'STAT'),
    defaultValue: 'ROUTINE',
  },
  resultsUrl: {
    type: DataTypes.STRING(500),
  },
  resultsDate: {
    type: DataTypes.DATE,
  },
  notes: {
    type: DataTypes.TEXT,
  },
  orderDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'lab_orders',
  indexes: [{ fields: ['patient_id'] }, { fields: ['order_number'] }, { fields: ['status'] }],
});

LabOrder.belongsTo(Patient, { foreignKey: 'patientId', as: 'patient' });
LabOrder.belongsTo(User, { foreignKey: 'orderedByDoctorId', as: 'doctor' });

module.exports = LabOrder;
