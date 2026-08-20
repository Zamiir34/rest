const express = require('express');
const orderController = require('../controllers/orderController');
const protect = require('../middleware/auth');
const authorize = require('../middleware/authorize');

const router = express.Router();

router.post('/public', orderController.createPublicOrder);
router.get('/public/:id', orderController.getOrder);

router.use(protect);

router.get('/', authorize('super_admin', 'restaurant_admin', 'manager', 'cashier', 'chef', 'waiter'), orderController.getOrders);
router.get('/kitchen', authorize('chef', 'manager', 'super_admin', 'restaurant_admin'), orderController.getKitchenOrders);
router.get('/:id', authorize('super_admin', 'restaurant_admin', 'manager', 'cashier', 'chef', 'waiter'), orderController.getOrder);
router.post('/', authorize('super_admin', 'restaurant_admin', 'manager', 'cashier', 'waiter'), orderController.createOrder);
router.patch('/:id/status', authorize('super_admin', 'restaurant_admin', 'manager', 'cashier', 'chef', 'waiter'), orderController.updateOrderStatus);
router.patch('/:id/cancel', authorize('super_admin', 'restaurant_admin', 'manager', 'cashier'), orderController.cancelOrder);

module.exports = router;
