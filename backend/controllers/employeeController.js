const asyncHandler = require('../utils/asyncHandler');
const Employee = require('../models/Employee');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { getPagination, paginateResponse } = require('../utils/pagination');

exports.getEmployees = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = { isActive: true };

  const [employees, total] = await Promise.all([
    Employee.find(filter)
      .populate('user', 'name email role phone avatar isActive')
      .sort('-createdAt')
      .skip(skip)
      .limit(limit),
    Employee.countDocuments(filter),
  ]);

  res.json({ success: true, ...paginateResponse(employees, total, page, limit) });
});

exports.getEmployee = asyncHandler(async (req, res) => {
  const employee = await Employee.findById(req.params.id).populate(
    'user',
    '-password -refreshToken'
  );
  if (!employee) throw new ApiError(404, 'Employee not found');
  res.json({ success: true, data: employee });
});

exports.createEmployee = asyncHandler(async (req, res) => {
  const { name, email, password, role, phone, ...employeeData } = req.body;

  const user = await User.create({ name, email, password, role, phone });
  const employee = await Employee.create({ user: user._id, ...employeeData });
  await employee.populate('user', '-password');

  res.status(201).json({ success: true, data: employee });
});

exports.updateEmployee = asyncHandler(async (req, res) => {
  const employee = await Employee.findById(req.params.id);
  if (!employee) throw new ApiError(404, 'Employee not found');

  const { name, email, role, phone, ...employeeData } = req.body;
  if (name || email || role || phone) {
    await User.findByIdAndUpdate(employee.user, { name, email, role, phone });
  }
  Object.assign(employee, employeeData);
  await employee.save();
  await employee.populate('user', '-password');

  res.json({ success: true, data: employee });
});

exports.recordAttendance = asyncHandler(async (req, res) => {
  const employee = await Employee.findById(req.params.id);
  if (!employee) throw new ApiError(404, 'Employee not found');

  employee.attendance.push(req.body);
  await employee.save();
  res.json({ success: true, data: employee });
});

exports.deleteEmployee = asyncHandler(async (req, res) => {
  const employee = await Employee.findById(req.params.id);
  if (!employee) throw new ApiError(404, 'Employee not found');

  employee.isActive = false;
  await employee.save();
  await User.findByIdAndUpdate(employee.user, { isActive: false });

  res.json({ success: true, message: 'Employee deactivated' });
});
