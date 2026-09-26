const express = require('express');
const settingsController = require('../controllers/settingsController');
const protect = require('../middleware/auth');
const authorize = require('../middleware/authorize');

const optionalAuth = require('../middleware/optionalAuth');

const router = express.Router();

router.get('/', optionalAuth, settingsController.getSettings);

router.use(protect);

router.put('/', authorize('super_admin', 'restaurant_admin'), settingsController.updateSettings);
router.get('/suppliers', authorize('super_admin', 'restaurant_admin', 'manager'), settingsController.getSuppliers);
router.post('/suppliers', authorize('super_admin', 'restaurant_admin', 'manager'), settingsController.createSupplier);
router.put('/suppliers/:id', authorize('super_admin', 'restaurant_admin', 'manager'), settingsController.updateSupplier);
router.delete('/suppliers/:id', authorize('super_admin', 'restaurant_admin', 'manager'), settingsController.deleteSupplier);

module.exports = router;
