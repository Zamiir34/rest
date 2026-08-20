const asyncHandler = require('../utils/asyncHandler');
const { getDashboardStats } = require('../services/dashboardService');

exports.getDashboard = asyncHandler(async (req, res) => {
  const period = req.query.period || 'daily';
  const stats = await getDashboardStats(period);
  res.json({ success: true, data: stats });
});

exports.getAnalytics = asyncHandler(async (req, res) => {
  const [daily, weekly, monthly, yearly] = await Promise.all([
    getDashboardStats('daily'),
    getDashboardStats('weekly'),
    getDashboardStats('monthly'),
    getDashboardStats('yearly'),
  ]);

  res.json({
    success: true,
    data: { daily, weekly, monthly, yearly },
  });
});
