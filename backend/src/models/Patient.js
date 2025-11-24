const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Patient = sequelize.define('Patient', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  dateOfBirth: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'date_of_birth'
  },
  gender: {
    type: DataTypes.ENUM('MALE', 'FEMALE', 'OTHER'),
    allowNull: false,
  },
  contactNumber: {
    type: DataTypes.STRING(20),
    field: 'contact_number'
  },
  email: {
    type: DataTypes.STRING(255),
  },
  address: {
    type: DataTypes.TEXT,
  },
  emergencyContactName: {
    type: DataTypes.STRING(255),
    field: 'emergency_contact_name'
  },
  emergencyContactNumber: {
    type: DataTypes.STRING(20),
    field: 'emergency_contact_number'
  },
  insuranceProvider: {
    type: DataTypes.STRING(255),
    field: 'insurance_provider'
  },
  insurancePolicyNumber: {
    type: DataTypes.STRING(100),
    field: 'insurance_policy_number'
  },
  bloodGroup: {
    type: DataTypes.ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'),
    field: 'blood_group'
  },
  allergies: {
    type: DataTypes.TEXT,
  },
  chronicConditions: {
    type: DataTypes.TEXT,
    field: 'chronic_conditions'
  },
  currentMedications: {
    type: DataTypes.TEXT,
    field: 'current_medications'
  },
  notes: {
    type: DataTypes.TEXT,
  },
}, {
  tableName: 'patients',
  indexes: [{ fields: ['email'] }, { fields: ['contact_number'] }],
});

module.exports = Patient;