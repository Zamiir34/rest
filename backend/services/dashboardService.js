const Order = require('../models/Order');
const Payment = require('../models/Payment');
const Customer = require('../models/Customer');
const Food = require('../models/Food');
const Inventory = require('../models/Inventory');
const Employee = require('../models/Employee');

const getDateRange = (period) => {
  const now = new Date();
  const start = new Date(now);

  switch (period) {
    case 'daily':
      start.setHours(0, 0, 0, 0);
      break;
    case 'weekly':
      start.setDate(now.getDate() - 7);
      break;
    case 'monthly':
      start.setMonth(now.getMonth() - 1);
      break;
    case 'yearly':
      start.setFullYear(now.getFullYear() - 1);
      break;
    default:
      start.setHours(0, 0, 0, 0);
  }
  return { start, end: now };
};

const mongoose = require('mongoose');

const getDashboardStats = async (period = 'daily', restaurantId = null) => {
  const { start, end } = getDateRange(period);
  const restObjectId = restaurantId ? new mongoose.Types.ObjectId(String(restaurantId)) : null;
  const restFilter = restObjectId ? { restaurant: restObjectId } : {};

  const [orders, customers, foods, inventory, employees, revenueAgg, salesByDay] =
    await Promise.all([
      Order.find({ createdAt: { $gte: start, $lte: end }, ...restFilter }),
      Customer.countDocuments({ createdAt: { $gte: start, $lte: end }, ...(restObjectId ? { restaurant: restObjectId } : {}) }),
      Food.countDocuments({ isAvailable: true, ...restFilter }),
      Inventory.find({ isActive: true, ...restFilter }),
      Employee.countDocuments({ isActive: true, ...restFilter }),
      Order.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end }, paymentStatus: 'paid', ...restFilter } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end }, paymentStatus: 'paid', ...restFilter } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            revenue: { $sum: '$total' },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

  const revenue = revenueAgg[0]?.total || 0;
  const lowStockItems = inventory.filter((i) => i.quantity <= i.minStock);

  const orderMatch = { createdAt: { $gte: start, $lte: end }, ...restFilter };

  const popularFoods = await Order.aggregate([
    { $match: orderMatch },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.food',
        name: { $first: '$items.name' },
        totalSold: { $sum: '$items.quantity' },
        revenue: { $sum: '$items.subtotal' },
      },
    },
    { $sort: { totalSold: -1 } },
    { $limit: 5 },
  ]);

  const recentOrders = await Order.find(restFilter)
    .sort({ createdAt: -1 })
    .limit(10)
    .populate('table');

  return {
    revenue,
    orders: orders.length,
    customers,
    foods,
    employees,
    lowStockCount: lowStockItems.length,
    lowStockItems: lowStockItems.slice(0, 5),
    popularFoods,
    salesByDay,
    recentOrders,
    ordersByStatus: {
      pending: orders.filter((o) => o.status === 'pending').length,
      preparing: orders.filter((o) => o.status === 'preparing').length,
      ready: orders.filter((o) => o.status === 'ready').length,
      completed: orders.filter((o) => o.status === 'completed').length,
    },
  };
};

module.exports = { getDashboardStats, getDateRange };
