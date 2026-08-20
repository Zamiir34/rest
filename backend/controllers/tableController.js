const QRCode = require('qrcode');
const asyncHandler = require('../utils/asyncHandler');
const Table = require('../models/Table');
const ApiError = require('../utils/ApiError');
const { getPagination, paginateResponse } = require('../utils/pagination');

const generateQR = async (tableNumber) => {
  const url = `${process.env.CLIENT_URL}/menu/table/${tableNumber}`;
  const qrCode = await QRCode.toDataURL(url);
  return { url, qrCode };
};

exports.getTables = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};
  if (req.query.status) filter.status = req.query.status;

  const [tables, total] = await Promise.all([
    Table.find(filter).sort('tableNumber').skip(skip).limit(limit),
    Table.countDocuments(filter),
  ]);

  res.json({ success: true, ...paginateResponse(tables, total, page, limit) });
});

exports.getTable = asyncHandler(async (req, res) => {
  const table = await Table.findOne({ tableNumber: req.params.tableNumber });
  if (!table) throw new ApiError(404, 'Table not found');
  res.json({ success: true, data: table });
});

exports.createTable = asyncHandler(async (req, res) => {
  const { qrCode, url } = await generateQR(req.body.tableNumber);
  const table = await Table.create({
    ...req.body,
    qrCode,
    qrCodeUrl: url,
  });
  res.status(201).json({ success: true, data: table });
});

exports.updateTable = asyncHandler(async (req, res) => {
  const table = await Table.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
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
