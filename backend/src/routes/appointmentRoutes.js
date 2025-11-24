const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const { authenticate, authorize } = require('../middleware/auth');

router.post('/', authenticate, authorize('RECEPTIONIST', 'DOCTOR', 'ADMIN'), appointmentController.createAppointment);
router.get('/', authenticate, appointmentController.getAppointments);
router.get('/:id', authenticate, appointmentController.getAppointmentById);
router.put('/:id', authenticate, authorize('RECEPTIONIST', 'DOCTOR', 'ADMIN'), appointmentController.updateAppointment);
router.patch('/:id/cancel', authenticate, authorize('RECEPTIONIST', 'DOCTOR', 'ADMIN'), appointmentController.cancelAppointment);

module.exports = router;
