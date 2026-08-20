const express = require('express');
const reservationController = require('../controllers/reservationController');
const protect = require('../middleware/auth');
const authorize = require('../middleware/authorize');

const router = express.Router();

router.post('/public', reservationController.createReservation);

router.use(protect);
router.get('/', authorize('super_admin', 'restaurant_admin', 'manager', 'waiter'), reservationController.getReservations);
router.post('/', authorize('super_admin', 'restaurant_admin', 'manager', 'waiter'), reservationController.createReservation);
router.put('/:id', authorize('super_admin', 'restaurant_admin', 'manager', 'waiter'), reservationController.updateReservation);
router.delete('/:id', authorize('super_admin', 'restaurant_admin', 'manager'), reservationController.deleteReservation);

module.exports = router;
