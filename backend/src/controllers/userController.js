const { Op } = require('sequelize');
const User = require('../models/User');
const { AppError } = require('../utils/errorHandler');
const auditLog = require('../middleware/auditMiddleware');

exports.getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { count, rows } = await User.findAndCountAll({
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

exports.getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    await auditLog(req.user.userId, 'User', id, 'READ', null, null, req);

    res.json({ status: 'success', data: user });
  } catch (error) {
    next(error);
  }
};

exports.updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove sensitive fields that shouldn't be updated through this endpoint
    delete updateData.passwordHash;
    delete updateData.twoFactorSecret;

    const user = await User.findByPk(id);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const previousData = user.toJSON();
    await user.update(updateData);

    await auditLog(req.user.userId, 'User', id, 'UPDATE', previousData, user.toJSON(), req);

    res.json({
      status: 'success',
      message: 'User updated successfully',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Prevent deleting the current user
    if (user.id === req.user.userId) {
      throw new AppError('Cannot delete your own account', 400);
    }

    const userData = user.toJSON();
    await user.destroy();

    await auditLog(req.user.userId, 'User', id, 'DELETE', userData, null, req);

    res.json({ status: 'success', message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
};