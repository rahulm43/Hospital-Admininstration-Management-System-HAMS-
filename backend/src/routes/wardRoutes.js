const express = require('express');
const router = express.Router();
const wardController = require('../controllers/wardController');
const { authenticate, authorize } = require('../middleware/auth');

// Ward routes
router.post('/', authenticate, authorize('ADMIN'), wardController.createWard);
router.get('/', authenticate, wardController.getWards);
router.get('/:id', authenticate, wardController.getWardById);
router.put('/:id', authenticate, authorize('ADMIN'), wardController.updateWard);

// Bed routes
router.post('/:wardId/beds', authenticate, authorize('ADMIN'), wardController.createBed);
router.patch('/beds/:id/status', authenticate, authorize('ADMIN', 'NURSE'), wardController.updateBedStatus);
router.get('/beds/status', authenticate, wardController.getBedStatus);

// New bed assignment routes
router.post('/beds/:id/assign', authenticate, authorize('ADMIN', 'NURSE'), wardController.assignBed);
router.post('/beds/:id/unassign', authenticate, authorize('ADMIN', 'NURSE'), wardController.unassignBed);

module.exports = router;