const User = require('./User');
const Patient = require('./Patient');
const Staff = require('./Staff');
const Appointment = require('./Appointment');
const { Ward, Room, Bed } = require('./Ward');
const Encounter = require('./Encounter');
const InventoryItem = require('./InventoryItem');
const { Invoice, InvoiceLineItem } = require('./Invoice');
const LabOrder = require('./LabOrder');
const AuditLog = require('./AuditLog');

module.exports = {
  User,
  Patient,
  Staff,
  Appointment,
  Ward,
  Room,
  Bed,
  Encounter,
  InventoryItem,
  Invoice,
  InvoiceLineItem,
  LabOrder,
  AuditLog,
};
