const express = require('express');
const reportController = require('../controllers/reportController');
const protect = require('../middleware/auth');
const authorize = require('../middleware/authorize');

const router = express.Router();

router.use(protect);
router.use(authorize('super_admin', 'restaurant_admin', 'manager'));

router.get('/', reportController.generateReport);

module.exports = router;
