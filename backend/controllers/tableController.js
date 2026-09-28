const QRCode = require('qrcode');
const asyncHandler = require('../utils/asyncHandler');
const Table = require('../models/Table');
const Restaurant = require('../models/Restaurant');
const ApiError = require('../utils/ApiError');
const { getPagination, paginateResponse } = require('../utils/pagination');

const generateQR = async (tableNumber) => {
  const url = `${process.env.CLIENT_URL || 'http://localhost:5173'}/menu/table/${tableNumber}`;
  const qrCode = await QRCode.toDataURL(url);
  return { url, qrCode };
};

// Helper: get restaurantId filter based on user role
const getRestaurantFilter = (user, query) => {
  const queryRestId = query?.restaurantId || query?.restaurant;
  if (queryRestId) return { restaurant: queryRestId };

  if (!user) return {};
  if (user.role === 'super_admin') {
    return queryRestId ? { restaurant: queryRestId } : {};
  }
  const restId = user.restaurantId?._id || user.restaurantId;
  if (restId) return { restaurant: restId };
  return { restaurant: null };
};

exports.getTables = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = { ...getRestaurantFilter(req.user, req.query) };
  if (req.query.status) filter.status = req.query.status;

  const [tables, total] = await Promise.all([
    Table.find(filter).populate('restaurant', 'name code currency').sort('tableNumber').skip(skip).limit(limit),
    Table.countDocuments(filter),
  ]);

  res.json({ success: true, ...paginateResponse(tables, total, page, limit) });
});

exports.getTable = asyncHandler(async (req, res) => {
  const table = await Table.findOne({ tableNumber: req.params.tableNumber }).populate('restaurant', 'name code currency phone address logo');
  if (!table) throw new ApiError(404, 'Table not found');
  res.json({ success: true, data: table });
});

exports.createTable = asyncHandler(async (req, res) => {
  const tableNumber = req.body.tableNumber?.trim();
  if (!tableNumber) {
    throw new ApiError(400, 'Table number is required');
  }

  const capacity = Number(req.body.capacity);
  if (!capacity || capacity < 1) {
    throw new ApiError(400, 'Capacity must be at least 1');
  }

  // Check if tableNumber is already taken
  const existingTable = await Table.findOne({ tableNumber });
  if (existingTable) {
    throw new ApiError(400, `Table number "${tableNumber}" already exists. Please choose a different number.`);
  }

  let restaurantId =
    req.user.role !== 'super_admin'
      ? req.user.restaurantId?._id || req.user.restaurantId
      : req.body.restaurant || req.user.restaurantId?._id || req.user.restaurantId;

  if (!restaurantId && req.user.role === 'super_admin') {
    const firstRest = await Restaurant.findOne({ status: 'active' });
    if (firstRest) restaurantId = firstRest._id;
  }

  const { qrCode, url } = await generateQR(tableNumber);

  // Build a clean body — omit restaurant (we set it explicitly below)
  // and strip any undefined/empty-string values to avoid Mongoose cast errors
  const { restaurant: _r, tableNumber: _tn, capacity: _cap, ...rest } = req.body;
  const cleanBody = Object.fromEntries(
    Object.entries(rest).filter(([, v]) => v !== '' && v !== undefined)
  );

  const table = await Table.create({
    ...cleanBody,
    tableNumber,
    capacity,
    restaurant: restaurantId || undefined,
    qrCode,
    qrCodeUrl: url,
  });

  const populated = await Table.findById(table._id).populate('restaurant', 'name code currency');
  res.status(201).json({ success: true, data: populated || table });
});

exports.updateTable = asyncHandler(async (req, res) => {
  // Strip empty strings that would cause ObjectId cast errors
  const update = Object.fromEntries(
    Object.entries(req.body).filter(([, v]) => v !== '' && v !== undefined)
  );
  const table = await Table.findByIdAndUpdate(req.params.id, update, {
    new: true,
    runValidators: true,
  }).populate('restaurant', 'name code currency');
  if (!table) throw new ApiError(404, 'Table not found');
  res.json({ success: true, data: table });
});

exports.deleteTable = asyncHandler(async (req, res) => {
  const table = await Table.findByIdAndDelete(req.params.id);
  if (!table) throw new ApiError(404, 'Table not found');
  res.json({ success: true, message: 'Table deleted' });
});

exports.regenerateQR = asyncHandler(async (req, res) => {
  const table = await Table.findById(req.params.id);
  if (!table) throw new ApiError(404, 'Table not found');

  const { qrCode, url } = await generateQR(table.tableNumber);
  table.qrCode = qrCode;
  table.qrCodeUrl = url;
  await table.save();

  res.json({ success: true, data: table });
});

exports.downloadQR = asyncHandler(async (req, res) => {
  const table = await Table.findById(req.params.id);
  if (!table) throw new ApiError(404, 'Table not found');

  const qrBuffer = await QRCode.toBuffer(table.qrCodeUrl);
  res.set('Content-Type', 'image/png');
  res.set('Content-Disposition', `attachment; filename=table-${table.tableNumber}.png`);
  res.send(qrBuffer);
});
