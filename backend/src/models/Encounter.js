const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Patient = require('./Patient');
const User = require('./User');

const Encounter = sequelize.define('Encounter', {
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
  doctorId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: User,
      key: 'id',
    },
  },
  encounterType: {
    type: DataTypes.ENUM('CONSULTATION', 'ADMISSION', 'SURGERY', 'EMERGENCY'),
    allowNull: false,
  },
  reason: {
    type: DataTypes.TEXT,
  },
  diagnosis: {
    type: DataTypes.TEXT,
  },
  treatment: {
    type: DataTypes.TEXT,
  },
  notes: {
    type: DataTypes.TEXT,
  },
  status: {
    type: DataTypes.ENUM('ONGOING', 'COMPLETED', 'SCHEDULED'),
    defaultValue: 'ONGOING',
  },
  encounterDate: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'encounters',
  indexes: [{ fields: ['patient_id'] }, { fields: ['doctor_id'] }],
});

Encounter.belongsTo(Patient, { foreignKey: 'patientId', as: 'patient' });
Encounter.belongsTo(User, { foreignKey: 'doctorId', as: 'doctor' });

module.exports = Encounter;
