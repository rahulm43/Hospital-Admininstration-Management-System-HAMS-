const { Op } = require('sequelize');
const Patient = require('../models/Patient');
const { AppError } = require('../utils/errorHandler');
const auditLog = require('../middleware/auditMiddleware');

exports.createPatient = async (req, res, next) => {
  try {
    const patientData = req.body;
    const patient = await Patient.create(patientData);
    await auditLog(req.user.userId, 'Patient', patient.id, 'CREATE', null, patient.toJSON(), req);

    res.status(201).json({
      status: 'success',
      message: 'Patient created successfully',
      data: patient,
    });
  } catch (error) {
    next(error);
  }
};

exports.getPatients = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { contactNumber: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { count, rows } = await Patient.findAndCountAll({
      where,
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

exports.getPatientById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const patient = await Patient.findByPk(id);

    if (!patient) {
      throw new AppError('Patient not found', 404);
    }

    await auditLog(req.user.userId, 'Patient', id, 'READ', null, null, req);

    res.json({ status: 'success', data: patient });
  } catch (error) {
    next(error);
  }
};

exports.updatePatient = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const patient = await Patient.findByPk(id);
    if (!patient) {
      throw new AppError('Patient not found', 404);
    }

    const previousData = patient.toJSON();
    await patient.update(updateData);

    await auditLog(req.user.userId, 'Patient', id, 'UPDATE', previousData, patient.toJSON(), req);

    res.json({
      status: 'success',
      message: 'Patient updated successfully',
      data: patient,
    });
  } catch (error) {
    next(error);
  }
};

exports.deletePatient = async (req, res, next) => {
  try {
    const { id } = req.params;

    const patient = await Patient.findByPk(id);
    if (!patient) {
      throw new AppError('Patient not found', 404);
    }

    const patientData = patient.toJSON();
    await patient.destroy();

    await auditLog(req.user.userId, 'Patient', id, 'DELETE', patientData, null, req);

    res.json({ status: 'success', message: 'Patient deleted successfully' });
  } catch (error) {
    next(error);
  }
};
