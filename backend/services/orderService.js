const Order = require('../models/Order');
const Food = require('../models/Food');
const Customer = require('../models/Customer');
const Table = require('../models/Table');
const Settings = require('../models/Settings');
const ApiError = require('../utils/ApiError');
const { createNotification, notifyRoles } = require('./notificationService');

const calculateTotals = (items, discount = 0, taxRate = 5) => {
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const discountAmount = (subtotal * discount) / 100;
  const taxable = subtotal - discountAmount;
  const tax = (taxable * taxRate) / 100;
  const total = taxable + tax;
  return { subtotal, discount: discountAmount, tax, total, taxRate };
};

const createOrder = async (orderData, io) => {
  const settings = (await Settings.findOne()) || { taxRate: 5 };
  const items = [];

  for (const item of orderData.items) {
    const food = await Food.findById(item.food);
    if (!food || !food.isAvailable) {
      throw new ApiError(400, `Food item unavailable: ${item.food}`);
    }
    const price = food.discount
      ? food.price - (food.price * food.discount) / 100
      : food.price;
    items.push({
      food: food._id,
      name: food.name,
      price,
      quantity: item.quantity,
      notes: item.notes,
      subtotal: price * item.quantity,
    });
  }

  let table = null;
  if (orderData.tableNumber) {
    table = await Table.findOne({ tableNumber: orderData.tableNumber });
    if (table) {
      table.status = 'occupied';
      await table.save();
    }
  }

  let customer = null;
  if (orderData.customerPhone) {
    customer = await Customer.findOne({ phone: orderData.customerPhone });
    if (!customer) {
      customer = await Customer.create({
        name: orderData.customerName,
        phone: orderData.customerPhone,
      });
    }
  } else if (orderData.customerName) {
    customer = await Customer.create({
      name: orderData.customerName,
      phone: orderData.customerPhone,
    });
  }

  const totals = calculateTotals(items, orderData.discount || 0, settings.taxRate);

  const order = await Order.create({
    orderType: orderData.orderType || (table ? 'dine_in' : 'walk_in'),
    table: table?._id,
    tableNumber: orderData.tableNumber,
    customer: customer?._id,
    customerName: orderData.customerName,
    customerPhone: orderData.customerPhone,
    items,
    ...totals,
    notes: orderData.notes,
    createdBy: orderData.createdBy,
  });

  if (customer) {
    customer.orderCount += 1;
    customer.totalSpending += totals.total;
    customer.lastOrderAt = new Date();
    await customer.save();
  }

  const populated = await Order.findById(order._id)
    .populate('table')
    .populate('items.food');

  await notifyRoles(['chef', 'manager', 'cashier'], {
    title: 'New Order',
    message: `Order ${order.orderNumber} from ${orderData.tableNumber || 'Walk-in'}`,
    type: 'order',
    relatedId: order._id,
    relatedModel: 'Order',
    priority: 'high',
  });

  if (io) {
    io.emit('new_order', populated);
    if (orderData.tableNumber) {
      io.to(`table_${orderData.tableNumber}`).emit('order_created', populated);
    }
  }

  return populated;
};

const updateOrderStatus = async (orderId, status, userId, io) => {
  const order = await Order.findById(orderId);
  if (!order) throw new ApiError(404, 'Order not found');

  order.status = status;
  if (status === 'completed') order.completedAt = new Date();
  if (userId && status === 'preparing') order.assignedChef = userId;
  await order.save();

  const populated = await Order.findById(orderId)
    .populate('table')
    .populate('items.food');

  if (io) {
    io.emit('order_status_updated', populated);
    if (order.tableNumber) {
      io.to(`table_${order.tableNumber}`).emit('order_status_updated', populated);
    }
    io.to(`order_${orderId}`).emit('order_status_updated', populated);
  }

  if (status === 'ready') {
    await createNotification({
      title: 'Order Ready',
      message: `Order ${order.orderNumber} is ready to serve`,
      type: 'order',
      recipientRole: 'waiter',
      relatedId: order._id,
      relatedModel: 'Order',
    });
  }

  return populated;
};

module.exports = { createOrder, updateOrderStatus, calculateTotals };
