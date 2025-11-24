const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');
const { authenticate, authorize } = require('../middleware/auth');

router.post('/', authenticate, authorize('ACCOUNTANT', 'ADMIN'), invoiceController.createInvoice);
router.get('/', authenticate, invoiceController.getInvoices);
router.get('/:id', authenticate, invoiceController.getInvoiceById);
router.put('/:id', authenticate, authorize('ACCOUNTANT', 'ADMIN'), invoiceController.updateInvoice);
router.patch('/:id/status', authenticate, authorize('ACCOUNTANT', 'ADMIN'), invoiceController.updateInvoiceStatus);

module.exports = router;