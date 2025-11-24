const AuditLog = require('../models/AuditLog');

const auditLog = async (userId, entityType, entityId, action, previousValues = null, newValues = null, req = null) => {
  try {
    await AuditLog.create({
      userId,
      entityType,
      entityId,
      action,
      previousValues,
      newValues,
      ipAddress: req?.ip,
      userAgent: req?.get('user-agent'),
    });
  } catch (error) {
    // Silently fail - don't block main operation
    console.error('Error creating audit log:', error);
  }
};

module.exports = auditLog;
