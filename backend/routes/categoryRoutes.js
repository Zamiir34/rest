const express = require('express');
const categoryController = require('../controllers/categoryController');
const protect = require('../middleware/auth');
const authorize = require('../middleware/authorize');

const optionalAuth = require('../middleware/optionalAuth');

const router = express.Router();

router.get('/', optionalAuth, categoryController.getCategories);
router.get('/:id', optionalAuth, categoryController.getCategory);

router.post(
  '/',
  protect,
  authorize('super_admin', 'restaurant_admin', 'manager'),
  categoryController.createCategory
);

router.put(
  '/:id',
  protect,
  authorize('super_admin', 'restaurant_admin', 'manager'),
  categoryController.updateCategory
);

router.delete(
  '/:id',
  protect,
  authorize('super_admin', 'restaurant_admin', 'manager'),
  categoryController.deleteCategory
);

module.exports = router;
