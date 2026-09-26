const express = require('express');
const tableController = require('../controllers/tableController');
const protect = require('../middleware/auth');
const authorize = require('../middleware/authorize');

const router = express.Router();

router.get('/public/:tableNumber', tableController.getTable);

router.use(protect);

router.get('/', authorize('super_admin', 'restaurant_admin', 'manager', 'cashier', 'waiter'), tableController.getTables);
router.post('/', authorize('super_admin', 'restaurant_admin', 'manager', 'cashier'), tableController.createTable);
router.put('/:id', authorize('super_admin', 'restaurant_admin', 'manager', 'cashier'), tableController.updateTable);
router.delete('/:id', authorize('super_admin', 'restaurant_admin', 'manager'), tableController.deleteTable);
router.post('/:id/regenerate-qr', authorize('super_admin', 'restaurant_admin', 'manager'), tableController.regenerateQR);
router.get('/:id/download-qr', authorize('super_admin', 'restaurant_admin', 'manager', 'cashier'), tableController.downloadQR);

module.exports = router;
