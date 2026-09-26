const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, lowercase: true, trim: true },
    favoriteFoods: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Food' }],
    totalSpending: { type: Number, default: 0 },
    orderCount: { type: Number, default: 0 },
    lastOrderAt: { type: Date },
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', index: true },
  },
  { timestamps: true }
);

customerSchema.index({ phone: 1 });

module.exports = mongoose.model('Customer', customerSchema);
