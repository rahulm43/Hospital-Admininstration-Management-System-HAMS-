const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Patient = require('./Patient');
const User = require('./User');

const Invoice = sequelize.define('Invoice', {
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
  invoiceNumber: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    field: 'invoice_number'
  },
  subtotal: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
  taxAmount: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
    field: 'tax_amount'
  },
  discountAmount: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
    field: 'discount_amount'
  },
  totalAmount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    field: 'total_amount'
  },
  status: {
    type: DataTypes.ENUM('DRAFT', 'ISSUED', 'PAID', 'PARTIALLY_PAID', 'OVERDUE', 'CANCELLED'),
    defaultValue: 'DRAFT',
  },
  dueDate: {
    type: DataTypes.DATE,
    field: 'due_date'
  },
  paidDate: {
    type: DataTypes.DATE,
    field: 'paid_date'
  },
  paymentMethod: {
    type: DataTypes.ENUM('CASH', 'CARD', 'BANK_TRANSFER', 'INSURANCE', 'CHECK'),
    field: 'payment_method'
  },
  notes: {
    type: DataTypes.TEXT,
  },
}, {
  tableName: 'invoices',
  indexes: [{ fields: ['patient_id'] }, { fields: ['invoice_number'] }, { fields: ['status'] }],
});

const InvoiceLineItem = sequelize.define('InvoiceLineItem', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  invoiceId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: Invoice,
      key: 'id',
    },
    field: 'invoice_id'
  },
  description: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  unitPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'unit_price'
  },
  totalPrice: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    field: 'total_price'
  },
  category: {
    type: DataTypes.ENUM('CONSULTATION', 'PROCEDURE', 'MEDICINE', 'IMAGING', 'LAB_TEST', 'ROOM_CHARGES', 'OTHER'),
    defaultValue: 'OTHER',
  },
}, {
  tableName: 'invoice_line_items',
});

Invoice.hasMany(InvoiceLineItem, { foreignKey: 'invoiceId', as: 'lineItems', onDelete: 'CASCADE' });
InvoiceLineItem.belongsTo(Invoice, { foreignKey: 'invoiceId', as: 'invoice' });
Invoice.belongsTo(Patient, { foreignKey: 'patientId', as: 'patient' });

module.exports = { Invoice, InvoiceLineItem };