const asyncHandler = require('../utils/asyncHandler');
const Order = require('../models/Order');
const ApiError = require('../utils/ApiError');
const { getPagination, paginateResponse } = require('../utils/pagination');
const { createOrder, updateOrderStatus } = require('../services/orderService');

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

exports.getOrders = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = { ...getRestaurantFilter(req.user, req.query) };

  if (req.query.status) filter.status = req.query.status;
  if (req.query.tableNumber) filter.tableNumber = req.query.tableNumber;
  if (req.query.orderType) filter.orderType = req.query.orderType;
  if (req.query.paymentStatus) filter.paymentStatus = req.query.paymentStatus;
  if (req.query.search) {
    filter.$or = [
      { orderNumber: { $regex: req.query.search, $options: 'i' } },
      { customerName: { $regex: req.query.search, $options: 'i' } },
      { tableNumber: { $regex: req.query.search, $options: 'i' } },
    ];
  }

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate('table')
      .populate('items.food')
      .sort('-createdAt')
      .skip(skip)
      .limit(limit),
    Order.countDocuments(filter),
  ]);

  res.json({ success: true, ...paginateResponse(orders, total, page, limit) });
});

exports.getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('table')
    .populate('items.food')
    .populate('customer');
  if (!order) throw new ApiError(404, 'Order not found');
  res.json({ success: true, data: order });
});

exports.createOrder = asyncHandler(async (req, res) => {
  const restaurantId =
    req.user?.role !== 'super_admin'
      ? req.user?.restaurantId?._id || req.user?.restaurantId
      : req.body.restaurant || req.user?.restaurantId?._id || req.user?.restaurantId;
  const order = await createOrder(
    { ...req.body, restaurant: restaurantId, createdBy: req.user?._id },
    req.app.get('io')
  );
  res.status(201).json({ success: true, data: order });
});

exports.createPublicOrder = asyncHandler(async (req, res) => {
  const order = await createOrder(req.body, req.app.get('io'));
  res.status(201).json({ success: true, data: order });
});

exports.updateOrderStatus = asyncHandler(async (req, res) => {
  const order = await updateOrderStatus(
    req.params.id,
    req.body.status,
    req.user?._id,
    req.app.get('io')
  );
  res.json({ success: true, data: order });
});

exports.getKitchenOrders = asyncHandler(async (req, res) => {
  const statuses = ['pending', 'accepted', 'preparing', 'ready'];
  const filter = { ...getRestaurantFilter(req.user), status: { $in: statuses } };
  const orders = await Order.find(filter)
    .populate('table')
    .populate('items.food')
    .sort('createdAt');
  res.json({ success: true, data: orders });
});

exports.cancelOrder = asyncHandler(async (req, res) => {
  const order = await updateOrderStatus(
    req.params.id,
    'cancelled',
    req.user?._id,
    req.app.get('io')
  );
  res.json({ success: true, data: order });
});
