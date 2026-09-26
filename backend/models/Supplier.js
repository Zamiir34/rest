const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    contactPerson: { type: String },
    email: { type: String, lowercase: true },
    phone: { type: String, required: true },
    address: { type: String },
    isActive: { type: Boolean, default: true },
    notes: { type: String },
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Supplier', supplierSchema);
