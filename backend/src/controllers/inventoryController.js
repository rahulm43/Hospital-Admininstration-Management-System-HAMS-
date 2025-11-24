const InventoryItem = require('../models/InventoryItem');
const { AppError } = require('../utils/errorHandler');
const auditLog = require('../middleware/auditMiddleware');
const { Op } = require('sequelize');

exports.createInventoryItem = async (req, res, next) => {
  try {
    const itemData = req.body;
    const item = await InventoryItem.create(itemData);

    await auditLog(req.user.userId, 'InventoryItem', item.id, 'CREATE', null, item.toJSON(), req);

    res.status(201).json({
      status: 'success',
      message: 'Inventory item created successfully',
      data: item,
    });
  } catch (error) {
    next(error);
  }
};

exports.getInventoryItems = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, itemType, lowStock } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { location: { [Op.iLike]: `%${search}%` } },
      ];
    }
    if (itemType) where.itemType = itemType;
    if (lowStock === 'true') {
      where.quantity = { [Op.lte]: sequelize.literal('reorder_level') };
    }

    const { count, rows } = await InventoryItem.findAndCountAll({
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

exports.getInventoryItemById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const item = await InventoryItem.findByPk(id);

    if (!item) {
      throw new AppError('Inventory item not found', 404);
    }

    res.json({ status: 'success', data: item });
  } catch (error) {
    next(error);
  }
};

exports.updateInventoryItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const item = await InventoryItem.findByPk(id);
    if (!item) {
      throw new AppError('Inventory item not found', 404);
    }

    const previousData = item.toJSON();
    await item.update(updateData);

    await auditLog(req.user.userId, 'InventoryItem', id, 'UPDATE', previousData, item.toJSON(), req);

    res.json({
      status: 'success',
      message: 'Inventory item updated successfully',
      data: item,
    });
  } catch (error) {
    next(error);
  }
};

exports.adjustInventory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { quantityChange, reason } = req.body;

    const item = await InventoryItem.findByPk(id);
    if (!item) {
      throw new AppError('Inventory item not found', 404);
    }

    const previousData = item.toJSON();
    item.quantity += quantityChange;
    await item.save();

    await auditLog(req.user.userId, 'InventoryItem', id, 'UPDATE', previousData, item.toJSON(), req);

    res.json({
      status: 'success',
      message: 'Inventory adjusted successfully',
      data: item,
    });
  } catch (error) {
    next(error);
  }
};

exports.getLowStockItems = async (req, res, next) => {
  try {
    const items = await InventoryItem.findAll({
      where: sequelize.where(
        sequelize.col('quantity'),
        Op.lte,
        sequelize.col('reorder_level')
      ),
    });

    res.json({
      status: 'success',
      data: items,
    });
  } catch (error) {
    next(error);
  }
};
