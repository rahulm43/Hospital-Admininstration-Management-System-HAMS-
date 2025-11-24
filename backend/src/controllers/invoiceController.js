const { Invoice, InvoiceLineItem } = require('../models/Invoice');
const Patient = require('../models/Patient');
const { AppError } = require('../utils/errorHandler');
const auditLog = require('../middleware/auditMiddleware');
const { Op } = require('sequelize');

const generateInvoiceNumber = async () => {
  const lastInvoice = await Invoice.findOne({
    order: [['createdAt', 'DESC']],
  });
  const number = lastInvoice ? parseInt(lastInvoice.invoiceNumber.split('-')[1]) + 1 : 1001;
  return `INV-${number}`;
};

exports.createInvoice = async (req, res, next) => {
  try {
    const { patientId, lineItems = [], taxPercent = 0, discountAmount = 0 } = req.body;

    const patient = await Patient.findByPk(patientId);
    if (!patient) {
      throw new AppError('Patient not found', 404);
    }

    const invoiceNumber = await generateInvoiceNumber();
    let subtotal = 0;

    const invoice = await Invoice.create({
      patientId,
      invoiceNumber,
      subtotal: 0,
      taxAmount: 0,
      discountAmount,
      totalAmount: 0,
    });

    // Create line items and calculate subtotal
    for (const item of lineItems) {
      const lineTotal = item.quantity * item.unitPrice;
      subtotal += lineTotal;
      await InvoiceLineItem.create({
        invoiceId: invoice.id,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: lineTotal,
        category: item.category,
      });
    }

    const taxAmount = (subtotal * taxPercent) / 100;
    const totalAmount = subtotal + taxAmount - discountAmount;

    await invoice.update({
      subtotal,
      taxAmount,
      totalAmount,
      status: 'ISSUED',
    });

    // Reload with line items
    const fullInvoice = await Invoice.findByPk(invoice.id, {
      include: [{ model: InvoiceLineItem, as: 'lineItems' }],
    });

    await auditLog(req.user.userId, 'Invoice', invoice.id, 'CREATE', null, fullInvoice.toJSON(), req);

    res.status(201).json({
      status: 'success',
      message: 'Invoice created successfully',
      data: fullInvoice,
    });
  } catch (error) {
    next(error);
  }
};

exports.getInvoices = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, from, to, status, patientId } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt[Op.gte] = new Date(from);
      if (to) where.createdAt[Op.lte] = new Date(to);
    }
    if (status) where.status = status;
    if (patientId) where.patientId = patientId;

    const { count, rows } = await Invoice.findAndCountAll({
      where,
      include: [{ model: Patient, as: 'patient', attributes: ['id', 'name'] }],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
    });

    res.json({
      status: 'success',
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getInvoiceById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const invoice = await Invoice.findByPk(id, {
      include: [
        { model: Patient, as: 'patient' },
        { model: InvoiceLineItem, as: 'lineItems' },
      ],
    });

    if (!invoice) {
      throw new AppError('Invoice not found', 404);
    }

    res.json({ status: 'success', data: invoice });
  } catch (error) {
    next(error);
  }
};

exports.updateInvoiceStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, paymentMethod, paidDate } = req.body;

    const invoice = await Invoice.findByPk(id);
    if (!invoice) {
      throw new AppError('Invoice not found', 404);
    }

    const previousData = invoice.toJSON();
    invoice.status = status;
    if (paymentMethod) invoice.paymentMethod = paymentMethod;
    if (paidDate) invoice.paidDate = paidDate;
    await invoice.save();

    await auditLog(req.user.userId, 'Invoice', id, 'UPDATE', previousData, invoice.toJSON(), req);

    res.json({
      status: 'success',
      message: 'Invoice updated successfully',
      data: invoice,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateInvoice = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { patientId, lineItems = [], taxPercent = 0, discountAmount = 0, status, dueDate, paymentMethod, paidDate } = req.body;

    const invoice = await Invoice.findByPk(id);
    if (!invoice) {
      throw new AppError('Invoice not found', 404);
    }

    const previousData = invoice.toJSON();

    // Update invoice fields
    if (patientId) invoice.patientId = patientId;
    if (status) invoice.status = status;
    if (dueDate) invoice.dueDate = dueDate;
    if (paymentMethod) invoice.paymentMethod = paymentMethod;
    if (paidDate) invoice.paidDate = paidDate; // Add paidDate handling
    if (discountAmount !== undefined) invoice.discountAmount = discountAmount;

    // If line items are provided, recalculate the invoice
    if (lineItems.length > 0) {
      // Delete existing line items
      await InvoiceLineItem.destroy({ where: { invoiceId: id } });

      // Create new line items and calculate subtotal
      let subtotal = 0;
      for (const item of lineItems) {
        const lineTotal = item.quantity * item.unitPrice;
        subtotal += lineTotal;
        await InvoiceLineItem.create({
          invoiceId: id,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: lineTotal,
          category: item.category,
        });
      }

      const taxAmount = (subtotal * taxPercent) / 100;
      const totalAmount = subtotal + taxAmount - discountAmount;

      invoice.subtotal = subtotal;
      invoice.taxAmount = taxAmount;
      invoice.totalAmount = totalAmount;
    }

    await invoice.save();

    // Reload with line items
    const fullInvoice = await Invoice.findByPk(id, {
      include: [{ model: InvoiceLineItem, as: 'lineItems' }],
    });

    await auditLog(req.user.userId, 'Invoice', id, 'UPDATE', previousData, fullInvoice.toJSON(), req);

    res.json({
      status: 'success',
      message: 'Invoice updated successfully',
      data: fullInvoice,
    });
  } catch (error) {
    next(error);
  }
};
