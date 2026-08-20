const express = require('express');
const foodController = require('../controllers/foodController');
const protect = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const upload = require('../middleware/upload');

const router = express.Router();

router.get('/', foodController.getFoods);
router.get('/:id', foodController.getFood);

router.post(
  '/',
  protect,
  authorize('super_admin', 'restaurant_admin', 'manager'),
  upload.array('images', 5),
  foodController.createFood
);

router.put(
  '/:id',
  protect,
  authorize('super_admin', 'restaurant_admin', 'manager'),
  upload.array('images', 5),
  foodController.updateFood
);

router.delete(
  '/:id',
  protect,
  authorize('super_admin', 'restaurant_admin', 'manager'),
  foodController.deleteFood
);

module.exports = router;
