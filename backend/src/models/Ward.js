const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Ward = sequelize.define('Ward', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  wardName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'ward_name'
  },
  department: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  totalBeds: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'total_beds'
  },
  occupiedBeds: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'occupied_beds'
  },
  description: {
    type: DataTypes.TEXT,
  },
}, {
  tableName: 'wards',
  indexes: [{ fields: ['ward_name'] }, { fields: ['department'] }],
});

const Room = sequelize.define('Room', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  wardId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: Ward,
      key: 'id',
    },
    field: 'ward_id'
  },
  roomNumber: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'room_number'
  },
  totalBeds: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'total_beds'
  },
  roomType: {
    type: DataTypes.ENUM('GENERAL', 'SEMI_PRIVATE', 'PRIVATE', 'ICU'),
    defaultValue: 'GENERAL',
    field: 'room_type'
  },
  status: {
    type: DataTypes.ENUM('AVAILABLE', 'OCCUPIED', 'CLEANING', 'MAINTENANCE'),
    defaultValue: 'AVAILABLE',
  },
}, {
  tableName: 'rooms',
});

const Bed = sequelize.define('Bed', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  roomId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: Room,
      key: 'id',
    },
    field: 'room_id'
  },
  bedNumber: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'bed_number'
  },
  status: {
    type: DataTypes.ENUM('AVAILABLE', 'OCCUPIED', 'RESERVED', 'CLEANING', 'MAINTENANCE'),
    defaultValue: 'AVAILABLE',
  },
  occupantPatientId: {
    type: DataTypes.UUID,
    field: 'occupant_patient_id'
  },
  occupancyStartDate: {
    type: DataTypes.DATE,
    field: 'occupancy_start_date'
  },
}, {
  tableName: 'beds',
});

Ward.hasMany(Room, { foreignKey: 'wardId', as: 'rooms' });
Room.belongsTo(Ward, { foreignKey: 'wardId', as: 'ward' });
Room.hasMany(Bed, { foreignKey: 'roomId', as: 'beds' });
Bed.belongsTo(Room, { foreignKey: 'roomId', as: 'room' });

module.exports = { Ward, Room, Bed };