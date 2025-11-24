const { Ward, Room, Bed } = require('../models/Ward');
const { AppError } = require('../utils/errorHandler');
const auditLog = require('../middleware/auditMiddleware');
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const Patient = require('../models/Patient');

// Ward Controllers
exports.createWard = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { wardName, department, totalBeds, description } = req.body;
    const ward = await Ward.create({
      wardName,
      department,
      totalBeds,
      description,
      occupiedBeds: 0,
    }, { transaction: t });

    // Automatically create rooms and beds based on totalBeds
    if (totalBeds > 0) {
      // Create rooms - for simplicity, we'll create rooms with 4 beds each
      const roomsNeeded = Math.ceil(totalBeds / 4);
      const bedsPerRoom = Math.floor(totalBeds / roomsNeeded);
      const extraBeds = totalBeds % roomsNeeded;
      
      for (let i = 0; i < roomsNeeded; i++) {
        // Create room
        const room = await Room.create({
          wardId: ward.id,
          roomNumber: `${i + 1}`,
          totalBeds: bedsPerRoom + (i < extraBeds ? 1 : 0),
          roomType: 'GENERAL',
          status: 'AVAILABLE',
        }, { transaction: t });
        
        // Create beds for this room
        const bedsInThisRoom = bedsPerRoom + (i < extraBeds ? 1 : 0);
        for (let j = 0; j < bedsInThisRoom; j++) {
          await Bed.create({
            roomId: room.id,
            bedNumber: `${j + 1}`,
            status: 'AVAILABLE',
          }, { transaction: t });
        }
      }
    }

    await auditLog(req.user.userId, 'Ward', ward.id, 'CREATE', null, ward.toJSON(), req);

    // Commit transaction
    await t.commit();

    res.status(201).json({
      status: 'success',
      message: 'Ward created successfully with rooms and beds',
      data: ward,
    });
  } catch (error) {
    // Rollback transaction
    await t.rollback();
    next(error);
  }
};

exports.getWards = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows } = await Ward.findAndCountAll({
      include: [
        {
          model: Room,
          as: 'rooms',
          include: [{ model: Bed, as: 'beds' }]
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['wardName', 'ASC']],
    });

    // Calculate occupied beds for each ward
    rows.forEach(ward => {
      let occupiedCount = 0;
      if (ward.rooms && ward.rooms.length > 0) {
        ward.rooms.forEach(room => {
          if (room.beds && room.beds.length > 0) {
            occupiedCount += room.beds.filter(bed => bed.status === 'OCCUPIED').length;
          }
        });
      }
      ward.occupiedBeds = occupiedCount;
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

exports.getWardById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const ward = await Ward.findByPk(id, {
      include: [
        {
          model: Room,
          as: 'rooms',
          include: [{ model: Bed, as: 'beds' }],
        },
      ],
    });

    if (!ward) {
      throw new AppError('Ward not found', 404);
    }

    // Calculate occupied beds for this ward
    let occupiedCount = 0;
    if (ward.rooms && ward.rooms.length > 0) {
      ward.rooms.forEach(room => {
        if (room.beds && room.beds.length > 0) {
          occupiedCount += room.beds.filter(bed => bed.status === 'OCCUPIED').length;
        }
      });
    }
    ward.occupiedBeds = occupiedCount;

    res.json({ status: 'success', data: ward });
  } catch (error) {
    next(error);
  }
};

exports.updateWard = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const ward = await Ward.findByPk(id);
    if (!ward) {
      throw new AppError('Ward not found', 404);
    }

    const previousData = ward.toJSON();
    await ward.update(updateData);

    await auditLog(req.user.userId, 'Ward', id, 'UPDATE', previousData, ward.toJSON(), req);

    res.json({
      status: 'success',
      message: 'Ward updated successfully',
      data: ward,
    });
  } catch (error) {
    next(error);
  }
};

// Bed Controllers
exports.createBed = async (req, res, next) => {
  try {
    const { roomId, bedNumber } = req.body;

    const room = await Room.findByPk(roomId);
    if (!room) {
      throw new AppError('Room not found', 404);
    }

    const bed = await Bed.create({
      roomId,
      bedNumber,
      status: 'AVAILABLE',
    });

    await auditLog(req.user.userId, 'Bed', bed.id, 'CREATE', null, bed.toJSON(), req);

    res.status(201).json({
      status: 'success',
      message: 'Bed created successfully',
      data: bed,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateBedStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, occupantPatientId } = req.body;

    const bed = await Bed.findByPk(id);
    if (!bed) {
      throw new AppError('Bed not found', 404);
    }

    const previousData = bed.toJSON();
    const oldStatus = bed.status;
    bed.status = status;
    
    // Only set occupantPatientId when status is OCCUPIED
    if (status === 'OCCUPIED' && occupantPatientId) {
      bed.occupantPatientId = occupantPatientId;
      bed.occupancyStartDate = new Date();
    } else if (oldStatus === 'OCCUPIED' && status !== 'OCCUPIED') {
      bed.occupancyStartDate = null;
      bed.occupantPatientId = null;
    } else if (status !== 'OCCUPIED') {
      // Clear patient info for non-OCCUPIED statuses
      bed.occupantPatientId = null;
      bed.occupancyStartDate = null;
    }
    
    await bed.save();

    // Update the ward's occupiedBeds count
    const room = await Room.findByPk(bed.roomId, {
      include: [{ model: Ward, as: 'ward' }]
    });
    
    if (room && room.ward) {
      const ward = room.ward;
      const allBeds = await Bed.findAll({
        include: [{
          model: Room,
          as: 'room',
          where: { wardId: ward.id }
        }]
      });
      
      const occupiedCount = allBeds.filter(b => b.status === 'OCCUPIED').length;
      await ward.update({ occupiedBeds: occupiedCount });
    }

    // Fetch the updated bed with all related data
    const updatedBed = await Bed.findByPk(id, {
      include: [{
        model: Room,
        as: 'room',
        include: [{ model: Ward, as: 'ward' }]
      }]
    });

    await auditLog(req.user.userId, 'Bed', id, 'UPDATE', previousData, updatedBed.toJSON(), req);

    res.json({
      status: 'success',
      message: 'Bed status updated successfully',
      data: updatedBed,
    });
  } catch (error) {
    next(error);
  }
};

exports.getBedStatus = async (req, res, next) => {
  try {
    const { wardId, patientId } = req.query;
    
    // Build the query with optional filters
    const queryOptions = {
      include: [
        {
          model: Room,
          as: 'room',
          include: [{ model: Ward, as: 'ward' }],
        },
      ],
    };

    // Apply filters
    if (wardId) {
      // Filter by specific ward
      queryOptions.include[0].where = { wardId: wardId };
    }
    
    // If patientId is provided, filter beds by occupantPatientId
    if (patientId) {
      queryOptions.where = { occupantPatientId: patientId };
    }

    const beds = await Bed.findAll(queryOptions);

    const summary = {
      total: beds.length,
      available: beds.filter(b => b.status === 'AVAILABLE').length,
      occupied: beds.filter(b => b.status === 'OCCUPIED').length,
      maintenance: beds.filter(b => b.status === 'MAINTENANCE').length,
      cleaning: beds.filter(b => b.status === 'CLEANING').length,
      reserved: beds.filter(b => b.status === 'RESERVED').length,
    };

    res.json({
      status: 'success',
      data: { beds, summary },
    });
  } catch (error) {
    next(error);
  }
};

// New bed assignment methods
exports.assignBed = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { id: bedId } = req.params;
    const { patientId } = req.body;

    // Validate input
    if (!patientId) {
      throw new AppError('Patient ID is required', 400);
    }

    // Check if bed exists
    const bed = await Bed.findByPk(bedId, { transaction: t });
    if (!bed) {
      throw new AppError('Bed not found', 404);
    }

    // Check if bed is available
    if (bed.status !== 'AVAILABLE') {
      throw new AppError('Bed is not available for assignment', 400);
    }

    // Check if patient exists
    const patient = await Patient.findByPk(patientId, { transaction: t });
    if (!patient) {
      throw new AppError('Patient not found', 404);
    }

    // Store previous data for audit
    const previousData = bed.toJSON();

    // Update bed status and assign patient
    bed.status = 'OCCUPIED';
    bed.occupantPatientId = patientId;
    bed.occupancyStartDate = new Date();
    await bed.save({ transaction: t });

    // Update the ward's occupiedBeds count
    const room = await Room.findByPk(bed.roomId, {
      include: [{ model: Ward, as: 'ward' }],
      transaction: t
    });
    
    if (room && room.ward) {
      const ward = room.ward;
      const allBeds = await Bed.findAll({
        include: [{
          model: Room,
          as: 'room',
          where: { wardId: ward.id }
        }],
        transaction: t
      });
      
      const occupiedCount = allBeds.filter(b => b.status === 'OCCUPIED').length;
      await ward.update({ occupiedBeds: occupiedCount }, { transaction: t });
    }

    // Commit transaction
    await t.commit();

    // Fetch the updated bed with all related data
    const updatedBed = await Bed.findByPk(bedId, {
      include: [{
        model: Room,
        as: 'room',
        include: [{ model: Ward, as: 'ward' }]
      }]
    });

    await auditLog(req.user.userId, 'Bed', bedId, 'ASSIGN', previousData, updatedBed.toJSON(), req);

    res.json({
      status: 'success',
      message: 'Bed assigned successfully',
      data: updatedBed,
    });
  } catch (error) {
    // Rollback transaction
    await t.rollback();
    next(error);
  }
};

exports.unassignBed = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { id: bedId } = req.params;

    // Check if bed exists
    const bed = await Bed.findByPk(bedId, { transaction: t });
    if (!bed) {
      throw new AppError('Bed not found', 404);
    }

    // Check if bed is occupied
    if (bed.status !== 'OCCUPIED') {
      throw new AppError('Bed is not currently assigned', 400);
    }

    // Store previous data for audit
    const previousData = bed.toJSON();

    // Update bed status and clear patient info
    bed.status = 'AVAILABLE';
    bed.occupantPatientId = null;
    bed.occupancyStartDate = null;
    await bed.save({ transaction: t });

    // Update the ward's occupiedBeds count
    const room = await Room.findByPk(bed.roomId, {
      include: [{ model: Ward, as: 'ward' }],
      transaction: t
    });
    
    if (room && room.ward) {
      const ward = room.ward;
      const allBeds = await Bed.findAll({
        include: [{
          model: Room,
          as: 'room',
          where: { wardId: ward.id }
        }],
        transaction: t
      });
      
      const occupiedCount = allBeds.filter(b => b.status === 'OCCUPIED').length;
      await ward.update({ occupiedBeds: occupiedCount }, { transaction: t });
    }

    // Commit transaction
    await t.commit();

    // Fetch the updated bed with all related data
    const updatedBed = await Bed.findByPk(bedId, {
      include: [{
        model: Room,
        as: 'room',
        include: [{ model: Ward, as: 'ward' }]
      }]
    });

    await auditLog(req.user.userId, 'Bed', bedId, 'UNASSIGN', previousData, updatedBed.toJSON(), req);

    res.json({
      status: 'success',
      message: 'Bed unassigned successfully',
      data: updatedBed,
    });
  } catch (error) {
    // Rollback transaction
    await t.rollback();
    next(error);
  }
};