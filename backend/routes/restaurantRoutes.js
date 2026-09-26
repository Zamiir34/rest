const express = require('express');
const router = express.Router();
const restaurantController = require('../controllers/restaurantController');
const protect = require('../middleware/auth');
const authorize = require('../middleware/authorize');

// Only super_admin can manage all restaurants across the platform
router.use(protect);
router.use(authorize('super_admin'));

router.get('/overview', restaurantController.getPlatformOverview);
router.get('/', restaurantController.getRestaurants);
router.post('/', restaurantController.createRestaurant);

router.get('/:id', restaurantController.getRestaurantById);
router.put('/:id', restaurantController.updateRestaurant);
router.patch('/:id/status', restaurantController.updateRestaurantStatus);
router.delete('/:id', restaurantController.deleteRestaurant);
router.get('/:id/stats', restaurantController.getRestaurantStats);

module.exports = router;
