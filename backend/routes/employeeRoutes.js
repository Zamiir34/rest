const express = require('express');
const employeeController = require('../controllers/employeeController');
const protect = require('../middleware/auth');
const authorize = require('../middleware/authorize');

const router = express.Router();

router.use(protect);
router.use(authorize('super_admin', 'restaurant_admin', 'manager'));

router.get('/', employeeController.getEmployees);
router.get('/:id', employeeController.getEmployee);
router.post('/', employeeController.createEmployee);
router.put('/:id', employeeController.updateEmployee);
router.patch('/:id/attendance', employeeController.recordAttendance);
router.delete('/:id', employeeController.deleteEmployee);

module.exports = router;
