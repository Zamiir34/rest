const asyncHandler = require('../utils/asyncHandler');
const Settings = require('../models/Settings');
const Supplier = require('../models/Supplier');
const ApiError = require('../utils/ApiError');

const Restaurant = require('../models/Restaurant');

exports.getSettings = asyncHandler(async (req, res) => {
  const restId = req.user?.restaurantId?._id || req.user?.restaurantId || req.query.restaurantId;
  const filter = restId ? { restaurant: restId } : {};

  let settings = await Settings.findOne(filter);
  if (!settings) {
    let defaultName = 'Restaurant POS';
    let defaultPhone = '';
    let defaultEmail = '';
    let defaultAddress = '';
    let defaultCurrency = 'USD';
    let defaultTaxRate = 5;

    if (restId) {
      const rest = await Restaurant.findById(restId);
      if (rest) {
        defaultName = rest.name || defaultName;
        defaultPhone = rest.phone || '';
        defaultEmail = rest.email || '';
        defaultAddress = rest.address || '';
        defaultCurrency = rest.currency || 'USD';
        defaultTaxRate = rest.taxRate ?? 5;
      }
    }

    settings = await Settings.create({
      restaurant: restId || undefined,
      restaurantName: defaultName,
      phone: defaultPhone,
      email: defaultEmail,
      address: defaultAddress,
      currency: defaultCurrency,
      taxRate: defaultTaxRate,
    });
  }

  res.json({ success: true, data: settings });
});

exports.updateSettings = asyncHandler(async (req, res) => {
  const restId = req.user?.restaurantId?._id || req.user?.restaurantId || req.query.restaurantId;
  const filter = restId ? { restaurant: restId } : {};

  let settings = await Settings.findOne(filter);
  if (!settings) {
    settings = await Settings.create({ ...req.body, restaurant: restId || undefined });
  } else {
    Object.assign(settings, req.body);
    await settings.save();
  }

  // Sync basic info back to Restaurant model if present
  if (restId) {
    const updateObj = {};
    if (req.body.restaurantName) updateObj.name = req.body.restaurantName;
    if (req.body.phone) updateObj.phone = req.body.phone;
    if (req.body.email) updateObj.email = req.body.email;
    if (req.body.address) updateObj.address = req.body.address;
    if (req.body.taxRate !== undefined) updateObj.taxRate = Number(req.body.taxRate);
    if (req.body.currency) updateObj.currency = req.body.currency;
    if (Object.keys(updateObj).length > 0) {
      await Restaurant.findByIdAndUpdate(restId, updateObj);
    }
  }

  res.json({ success: true, data: settings });
});

exports.getSuppliers = asyncHandler(async (req, res) => {
  const restId = req.user?.restaurantId?._id || req.user?.restaurantId || req.query.restaurantId;
  const filter = { isActive: true };
  if (req.user?.role !== 'super_admin' && restId) {
    filter.restaurant = restId;
  }
  const suppliers = await Supplier.find(filter).sort('name');
  res.json({ success: true, data: suppliers });
});

exports.createSupplier = asyncHandler(async (req, res) => {
  const restId = req.user?.restaurantId?._id || req.user?.restaurantId || req.body.restaurant;
  const supplier = await Supplier.create({ ...req.body, restaurant: restId });
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
