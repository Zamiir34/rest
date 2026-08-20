const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    sku: { type: String, unique: true, sparse: true },
    unit: { type: String, default: 'kg' },
    quantity: { type: Number, required: true, min: 0, default: 0 },
    minStock: { type: Number, default: 10 },
    costPerUnit: { type: Number, default: 0 },
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
    purchaseDate: { type: Date },
    expiryDate: { type: Date },
    category: { type: String },
    isActive: { type: Boolean, default: true },
    lastRestocked: { type: Date },
  },
  { timestamps: true }
);

inventorySchema.virtual('isLowStock').get(function () {
  return this.quantity <= this.minStock;
});

inventorySchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Inventory', inventorySchema);
