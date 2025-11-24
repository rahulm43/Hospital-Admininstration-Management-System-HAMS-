const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

const Staff = sequelize.define('Staff', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: User,
      key: 'id',
    },
    field: 'user_id'
  },
  employeeId: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    field: 'employee_id'
  },
  specialization: {
    type: DataTypes.STRING(255),
  },
  licenseNumber: {
    type: DataTypes.STRING(100),
    field: 'license_number'
  },
  department: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  shift: {
    type: DataTypes.ENUM('MORNING', 'AFTERNOON', 'NIGHT', 'FLEXIBLE'),
    defaultValue: 'FLEXIBLE',
  },
  availabilityStatus: {
    type: DataTypes.ENUM('AVAILABLE', 'BUSY', 'ON_LEAVE', 'OFF_DUTY'),
    defaultValue: 'AVAILABLE',
    field: 'availability_status'
  },
  yearsOfExperience: {
    type: DataTypes.INTEGER,
    field: 'years_of_experience'
  },
}, {
  tableName: 'staff',
  indexes: [{ fields: ['employee_id'] }, { fields: ['department'] }],
});

Staff.belongsTo(User, { foreignKey: 'userId', as: 'user' });

module.exports = Staff;