const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  food: { type: mongoose.Schema.Types.ObjectId, ref: 'Food', required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  notes: { type: String },
  subtotal: { type: Number, required: true },
});

const ORDER_STATUSES = [
  'pending',
  'accepted',
  'preparing',
  'ready',
  'served',
  'completed',
  'cancelled',
];

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, unique: true },
    orderType: {
      type: String,
      enum: ['dine_in', 'walk_in', 'takeaway'],
      default: 'dine_in',
    },
    table: { type: mongoose.Schema.Types.ObjectId, ref: 'Table' },
    tableNumber: { type: String },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    customerName: { type: String },
    customerPhone: { type: String },
    items: [orderItemSchema],
    subtotal: { type: Number, required: true, default: 0 },
    discount: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    taxRate: { type: Number, default: 0 },
    total: { type: Number, required: true, default: 0 },
    status: {
      type: String,
      enum: ORDER_STATUSES,
      default: 'pending',
    },
    notes: { type: String },
    assignedChef: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    assignedWaiter: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'partial', 'paid'],
      default: 'unpaid',
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

orderSchema.pre('save', async function (next) {
  if (!this.orderNumber) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderNumber = `ORD-${Date.now()}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
module.exports.ORDER_STATUSES = ORDER_STATUSES;
