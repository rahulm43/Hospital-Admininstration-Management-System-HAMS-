const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');

// User management routes (for staff management)
router.get('/', authenticate, authorize('ADMIN'), userController.getUsers);
router.get('/:id', authenticate, authorize('ADMIN'), userController.getUserById);
router.put('/:id', authenticate, authorize('ADMIN'), userController.updateUser);
router.delete('/:id', authenticate, authorize('ADMIN'), userController.deleteUser);

module.exports = router;