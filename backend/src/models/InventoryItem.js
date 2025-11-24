const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const InventoryItem = sequelize.define('InventoryItem', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  itemType: {
    type: DataTypes.ENUM('MEDICINE', 'SUPPLY', 'EQUIPMENT'),
    allowNull: false,
    field: 'item_type'
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  reorderLevel: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'reorder_level'
  },
  unit: {
    type: DataTypes.STRING(50),
  },
  location: {
    type: DataTypes.STRING(255),
  },
  expiryDate: {
    type: DataTypes.DATE,
    field: 'expiry_date'
  },
  unitCost: {
    type: DataTypes.DECIMAL(10, 2),
    field: 'unit_cost'
  },
  supplier: {
    type: DataTypes.STRING(255),
  },
  notes: {
    type: DataTypes.TEXT,
  },
}, {
  tableName: 'inventory_items',
  indexes: [{ fields: ['name'] }, { fields: ['item_type'] }],
});

module.exports = InventoryItem;