const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Patient = require('./Patient');
const User = require('./User');

const Appointment = sequelize.define('Appointment', {
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
    field: 'patient_id'
  },
  doctorId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: User,
      key: 'id',
    },
    field: 'doctor_id'
  },
  slotStart: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'slot_start'
  },
  slotEnd: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'slot_end'
  },
  status: {
    type: DataTypes.ENUM('SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'),
    defaultValue: 'SCHEDULED',
  },
  appointmentType: {
    type: DataTypes.ENUM('CONSULTATION', 'FOLLOW_UP', 'PROCEDURE', 'CHECKUP'),
    defaultValue: 'CONSULTATION',
    field: 'appointment_type'
  },
  reason: {
    type: DataTypes.TEXT,
  },
  notes: {
    type: DataTypes.TEXT,
  },
}, {
  tableName: 'appointments',
  indexes: [
    { fields: ['patient_id'] },
    { fields: ['doctor_id'] },
    { fields: ['slot_start'] },
    { fields: ['status'] },
  ],
});

Appointment.belongsTo(Patient, { foreignKey: 'patientId', as: 'patient' });
Appointment.belongsTo(User, { foreignKey: 'doctorId', as: 'doctor' });

module.exports = Appointment;