const express = require('express');
const paymentController = require('../controllers/paymentController');
const protect = require('../middleware/auth');
const authorize = require('../middleware/authorize');

const router = express.Router();

router.get('/public/order/:orderId/invoice', paymentController.getPublicInvoiceByOrder);

router.use(protect);
router.use(authorize('super_admin', 'restaurant_admin', 'manager', 'cashier'));

router.get('/daily-summary', paymentController.getDailySummary);
router.get('/', paymentController.getPayments);
router.post('/', paymentController.processPayment);
router.post('/split', paymentController.splitBill);
router.get('/:id/invoice', paymentController.getInvoice);

module.exports = router;
