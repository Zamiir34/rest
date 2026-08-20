const express = require('express');
const inventoryController = require('../controllers/inventoryController');
const protect = require('../middleware/auth');
const authorize = require('../middleware/authorize');

const router = express.Router();

router.use(protect);
router.use(authorize('super_admin', 'restaurant_admin', 'manager'));

router.get('/', inventoryController.getInventory);
router.post('/', inventoryController.createInventory);
router.put('/:id', inventoryController.updateInventory);
router.patch('/:id/restock', inventoryController.restockInventory);
router.delete('/:id', inventoryController.deleteInventory);

module.exports = router;
