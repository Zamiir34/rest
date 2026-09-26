const asyncHandler = require('../utils/asyncHandler');
const { getDashboardStats } = require('../services/dashboardService');

exports.getDashboard = asyncHandler(async (req, res) => {
  const period = req.query.period || 'daily';
  const restaurantId = req.user?.role === 'super_admin' ? req.query.restaurantId : (req.user?.restaurantId?._id || req.user?.restaurantId);
  const stats = await getDashboardStats(period, restaurantId);
  res.json({ success: true, data: stats });
});

exports.getAnalytics = asyncHandler(async (req, res) => {
  const restaurantId = req.user?.role === 'super_admin' ? req.query.restaurantId : (req.user?.restaurantId?._id || req.user?.restaurantId);
  const [daily, weekly, monthly, yearly] = await Promise.all([
    getDashboardStats('daily', restaurantId),
    getDashboardStats('weekly', restaurantId),
    getDashboardStats('monthly', restaurantId),
    getDashboardStats('yearly', restaurantId),
  ]);

  res.json({
    success: true,
    data: { daily, weekly, monthly, yearly },
  });
});
