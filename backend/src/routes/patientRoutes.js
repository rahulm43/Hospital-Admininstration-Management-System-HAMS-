const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const { authenticate, authorize } = require('../middleware/auth');

router.post('/', authenticate, authorize('ADMIN', 'RECEPTIONIST', 'DOCTOR'), patientController.createPatient);
router.get('/', authenticate, patientController.getPatients);
router.get('/:id', authenticate, patientController.getPatientById);
router.put('/:id', authenticate, authorize('ADMIN', 'DOCTOR', 'RECEPTIONIST'), patientController.updatePatient);
router.delete('/:id', authenticate, authorize('ADMIN'), patientController.deletePatient);

module.exports = router;
