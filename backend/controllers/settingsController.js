const asyncHandler = require('../utils/asyncHandler');
const Settings = require('../models/Settings');
const Supplier = require('../models/Supplier');
const ApiError = require('../utils/ApiError');

exports.getSettings = asyncHandler(async (req, res) => {
  let settings = await Settings.findOne();
  if (!settings) settings = await Settings.create({});
  res.json({ success: true, data: settings });
});

exports.updateSettings = asyncHandler(async (req, res) => {
  let settings = await Settings.findOne();
  if (!settings) settings = await Settings.create(req.body);
  else {
    Object.assign(settings, req.body);
    await settings.save();
  }
  res.json({ success: true, data: settings });
});

exports.getSuppliers = asyncHandler(async (req, res) => {
  const suppliers = await Supplier.find({ isActive: true }).sort('name');
  res.json({ success: true, data: suppliers });
});

exports.createSupplier = asyncHandler(async (req, res) => {
  const supplier = await Supplier.create(req.body);
  res.status(201).json({ success: true, data: supplier });
});

exports.updateSupplier = asyncHandler(async (req, res) => {
  const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!supplier) throw new ApiError(404, 'Supplier not found');
  res.json({ success: true, data: supplier });
});

exports.deleteSupplier = asyncHandler(async (req, res) => {
  await Supplier.findByIdAndUpdate(req.params.id, { isActive: false });
  res.json({ success: true, message: 'Supplier deactivated' });
});
