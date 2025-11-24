const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const User = require('../models/User');
const { AppError } = require('../utils/errorHandler');
const auditLog = require('../middleware/auditMiddleware');
const { Op } = require('sequelize');

exports.createAppointment = async (req, res, next) => {
  try {
    const { patientId, doctorId, slotStart, slotEnd, appointmentType, reason, notes } = req.body;

    // Validate that patient and doctor exist
    const [patient, doctor] = await Promise.all([
      Patient.findByPk(patientId),
      User.findByPk(doctorId),
    ]);

    if (!patient) throw new AppError('Patient not found', 404);
    if (!doctor) throw new AppError('Doctor not found', 404);

    // Check for conflicting appointments
    const conflictingAppointment = await Appointment.findOne({
      where: {
        doctorId,
        slotStart: { [Op.lt]: new Date(slotEnd) },
        slotEnd: { [Op.gt]: new Date(slotStart) },
        status: { [Op.ne]: 'CANCELLED' },
      },
    });

    if (conflictingAppointment) {
      throw new AppError('Doctor has conflicting appointment', 409);
    }

    const appointment = await Appointment.create({
      patientId,
      doctorId,
      slotStart,
      slotEnd,
      appointmentType,
      reason,
      notes,
    });

    await auditLog(req.user.userId, 'Appointment', appointment.id, 'CREATE', null, appointment.toJSON(), req);

    res.status(201).json({
      status: 'success',
      message: 'Appointment created successfully',
      data: appointment,
    });
  } catch (error) {
    next(error);
  }
};

exports.getAppointments = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, from, to, doctorId, patientId, status } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (from || to) {
      where.slotStart = {};
      if (from) where.slotStart[Op.gte] = new Date(from);
      if (to) where.slotStart[Op.lte] = new Date(to);
    }
    if (doctorId) where.doctorId = doctorId;
    if (patientId) where.patientId = patientId;
    if (status) where.status = status;

    const { count, rows } = await Appointment.findAndCountAll({
      where,
      include: [
        { model: Patient, as: 'patient', attributes: ['id', 'name', 'contactNumber'] },
        { model: User, as: 'doctor', attributes: ['id', 'name', 'department'] },
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['slotStart', 'DESC']],
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

exports.getAppointmentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const appointment = await Appointment.findByPk(id, {
      include: [
        { model: Patient, as: 'patient' },
        { model: User, as: 'doctor' },
      ],
    });

    if (!appointment) {
      throw new AppError('Appointment not found', 404);
    }

    res.json({ status: 'success', data: appointment });
  } catch (error) {
    next(error);
  }
};

exports.updateAppointment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const appointment = await Appointment.findByPk(id);
    if (!appointment) {
      throw new AppError('Appointment not found', 404);
    }

    // Check for conflicts if time is being changed
    if (updateData.slotStart || updateData.slotEnd) {
      const conflictingAppointment = await Appointment.findOne({
        where: {
          id: { [Op.ne]: id },
          doctorId: appointment.doctorId,
          slotStart: { [Op.lt]: new Date(updateData.slotEnd || appointment.slotEnd) },
          slotEnd: { [Op.gt]: new Date(updateData.slotStart || appointment.slotStart) },
          status: { [Op.ne]: 'CANCELLED' },
        },
      });

      if (conflictingAppointment) {
        throw new AppError('Doctor has conflicting appointment', 409);
      }
    }

    const previousData = appointment.toJSON();
    await appointment.update(updateData);

    await auditLog(req.user.userId, 'Appointment', id, 'UPDATE', previousData, appointment.toJSON(), req);

    res.json({
      status: 'success',
      message: 'Appointment updated successfully',
      data: appointment,
    });
  } catch (error) {
    next(error);
  }
};

exports.cancelAppointment = async (req, res, next) => {
  try {
    const { id } = req.params;

    const appointment = await Appointment.findByPk(id);
    if (!appointment) {
      throw new AppError('Appointment not found', 404);
    }

    const previousData = appointment.toJSON();
    appointment.status = 'CANCELLED';
    await appointment.save();

    await auditLog(req.user.userId, 'Appointment', id, 'UPDATE', previousData, appointment.toJSON(), req);

    res.json({
      status: 'success',
      message: 'Appointment cancelled successfully',
      data: appointment,
    });
  } catch (error) {
    next(error);
  }
};
