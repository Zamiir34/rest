const express = require('express');
const dashboardController = require('../controllers/dashboardController');
const protect = require('../middleware/auth');
const authorize = require('../middleware/authorize');

const router = express.Router();

router.use(protect);
router.use(authorize('super_admin', 'restaurant_admin', 'manager', 'cashier'));

router.get('/', dashboardController.getDashboard);
router.get('/analytics', dashboardController.getAnalytics);

module.exports = router;
