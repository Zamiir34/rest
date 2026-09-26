const asyncHandler = require('../utils/asyncHandler');
const Inventory = require('../models/Inventory');
const ApiError = require('../utils/ApiError');
const { getPagination, paginateResponse } = require('../utils/pagination');
const { createNotification } = require('../services/notificationService');

// Helper: get restaurantId filter based on user role
const getRestaurantFilter = (user, query) => {
  const queryRestId = query?.restaurantId || query?.restaurant;
  if (queryRestId) return { restaurant: queryRestId };

  if (!user) return {};
  if (user.role === 'super_admin') {
    return queryRestId ? { restaurant: queryRestId } : {};
  }
  const restId = user.restaurantId?._id || user.restaurantId;
  if (restId) return { restaurant: restId };
  return { restaurant: null };
};

exports.getInventory = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = { ...getRestaurantFilter(req.user, req.query), isActive: true };
  if (req.query.lowStock === 'true') {
    filter.$expr = { $lte: ['$quantity', '$minStock'] };
  }
  if (req.query.search) {
    filter.name = { $regex: req.query.search, $options: 'i' };
  }

  const [items, total] = await Promise.all([
    Inventory.find(filter).populate('supplier').sort('name').skip(skip).limit(limit),
    Inventory.countDocuments(filter),
  ]);

  res.json({ success: true, ...paginateResponse(items, total, page, limit) });
});

exports.createInventory = asyncHandler(async (req, res) => {
  const restaurantId =
    req.user.role !== 'super_admin'
      ? req.user.restaurantId?._id || req.user.restaurantId
      : req.body.restaurant || req.user.restaurantId?._id || req.user.restaurantId;

  const data = {
    ...req.body,
    restaurant: restaurantId,
  };
  const item = await Inventory.create(data);
  res.status(201).json({ success: true, data: item });
});

exports.updateInventory = asyncHandler(async (req, res) => {
  const item = await Inventory.findById(req.params.id);
  if (!item) throw new ApiError(404, 'Inventory item not found');

  Object.assign(item, req.body);
  await item.save();

  if (item.quantity <= item.minStock) {
    await createNotification({
      title: 'Low Stock Alert',
      message: `${item.name} is low (${item.quantity} ${item.unit} remaining)`,
      type: 'inventory',
      recipientRole: 'manager',
      relatedId: item._id,
      relatedModel: 'Inventory',
      priority: 'high',
    });
    req.app.get('io')?.emit('low_stock_alert', item);
  }

  res.json({ success: true, data: item });
});

exports.deleteInventory = asyncHandler(async (req, res) => {
  const item = await Inventory.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true }
  );
  if (!item) throw new ApiError(404, 'Inventory item not found');
  res.json({ success: true, message: 'Inventory item deactivated' });
});

exports.restockInventory = asyncHandler(async (req, res) => {
  const item = await Inventory.findById(req.params.id);
  if (!item) throw new ApiError(404, 'Inventory item not found');

  item.quantity += req.body.quantity;
  item.lastRestocked = new Date();
  if (req.body.purchaseDate) item.purchaseDate = req.body.purchaseDate;
  if (req.body.expiryDate) item.expiryDate = req.body.expiryDate;
  await item.save();

  res.json({ success: true, data: item });
});
