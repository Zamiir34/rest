const express = require('express');
const customerController = require('../controllers/customerController');
const protect = require('../middleware/auth');
const authorize = require('../middleware/authorize');

const router = express.Router();

router.use(protect);
router.use(authorize('super_admin', 'restaurant_admin', 'manager', 'cashier'));

router.get('/', customerController.getCustomers);
router.get('/:id', customerController.getCustomer);
router.put('/:id', customerController.updateCustomer);
router.delete('/:id', authorize('super_admin', 'restaurant_admin', 'manager'), customerController.deleteCustomer);

module.exports = router;
