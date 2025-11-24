const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const { authenticate, authorize } = require('../middleware/auth');

router.post('/', authenticate, authorize('ADMIN', 'ACCOUNTANT'), inventoryController.createInventoryItem);
router.get('/', authenticate, inventoryController.getInventoryItems);
router.get('/low-stock', authenticate, inventoryController.getLowStockItems);
router.get('/:id', authenticate, inventoryController.getInventoryItemById);
router.put('/:id', authenticate, authorize('ADMIN', 'ACCOUNTANT'), inventoryController.updateInventoryItem);
router.patch('/:id/adjust', authenticate, authorize('ADMIN', 'ACCOUNTANT'), inventoryController.adjustInventory);

module.exports = router;
