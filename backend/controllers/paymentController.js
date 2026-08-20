const asyncHandler = require('../utils/asyncHandler');
const Payment = require('../models/Payment');
const Order = require('../models/Order');
const ApiError = require('../utils/ApiError');
const { getPagination, paginateResponse } = require('../utils/pagination');
const { createNotification } = require('../services/notificationService');

exports.getPayments = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.method) filter.method = req.query.method;

  const [payments, total] = await Promise.all([
    Payment.find(filter)
      .populate('order')
      .populate('processedBy', 'name email')
      .sort('-createdAt')
      .skip(skip)
      .limit(limit),
    Payment.countDocuments(filter),
  ]);

  res.json({ success: true, ...paginateResponse(payments, total, page, limit) });
});

exports.processPayment = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.body.order);
  if (!order) throw new ApiError(404, 'Order not found');

  const payment = await Payment.create({
    ...req.body,
    processedBy: req.user._id,
  });

  order.paymentStatus = 'paid';
  if (order.status !== 'completed') order.status = 'completed';
  order.completedAt = new Date();
  await order.save();

  await createNotification({
    title: 'Payment Received',
    message: `Payment of $${payment.amount} for ${order.orderNumber}`,
    type: 'payment',
    recipientRole: 'manager',
    relatedId: payment._id,
    relatedModel: 'Payment',
  });

  const populated = await Payment.findById(payment._id)
    .populate('order')
    .populate('processedBy', 'name');

  const io = req.app.get('io');
  if (io) {
    io.emit('payment_processed', populated);
    io.emit('order_status_updated', order);
    if (order.tableNumber) io.to(`table_${order.tableNumber}`).emit('order_status_updated', order);
    io.to(`order_${order._id}`).emit('order_status_updated', order);
  }

  res.status(201).json({ success: true, data: populated });
});

exports.getInvoice = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id)
    .populate({ path: 'order', populate: { path: 'items.food table' } })
    .populate('processedBy', 'name');
  if (!payment) throw new ApiError(404, 'Payment not found');
  res.json({ success: true, data: payment });
});

exports.getPublicInvoiceByOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.orderId)
    .populate('table')
    .populate('items.food');
  if (!order) throw new ApiError(404, 'Order not found');

  const payment = await Payment.findOne({ order: order._id })
    .populate('processedBy', 'name')
    .sort('-createdAt');

  res.json({
    success: true,
    data: {
      invoiceNumber: payment?.invoiceNumber || `DUE-${order.orderNumber}`,
      order,
      payment: payment || null,
      amountDue: order.paymentStatus === 'paid' ? 0 : order.total,
      paymentStatus: order.paymentStatus,
      status: payment?.status || (order.paymentStatus === 'paid' ? 'completed' : 'pending'),
      issuedAt: payment?.createdAt || order.completedAt || order.updatedAt,
    },
  });
});

exports.splitBill = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.body.order);
  if (!order) throw new ApiError(404, 'Order not found');

  const totalSplit = req.body.splitDetails.reduce((s, d) => s + d.amount, 0);
  if (Math.abs(totalSplit - req.body.amount) > 0.01) {
    throw new ApiError(400, 'Split amounts must equal total payment');
  }

  const payment = await Payment.create({
    order: order._id,
    amount: req.body.amount,
    method: req.body.splitDetails[0].method,
    splitDetails: req.body.splitDetails,
    discount: req.body.discount || 0,
    tax: req.body.tax || order.tax,
    processedBy: req.user._id,
  });

  order.paymentStatus = 'paid';
  await order.save();

  res.status(201).json({ success: true, data: payment });
});
