const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema(
  {
    restaurantName: { type: String, default: 'Restaurant POS' },
    logo: { type: String },
    address: { type: String },
    phone: { type: String },
    email: { type: String },
    currency: { type: String, default: 'USD' },
    taxRate: { type: Number, default: 5 },
    timezone: { type: String, default: 'UTC' },
    openingHours: {
      monday: { open: String, close: String, closed: Boolean },
      tuesday: { open: String, close: String, closed: Boolean },
      wednesday: { open: String, close: String, closed: Boolean },
      thursday: { open: String, close: String, closed: Boolean },
      friday: { open: String, close: String, closed: Boolean },
      saturday: { open: String, close: String, closed: Boolean },
      sunday: { open: String, close: String, closed: Boolean },
    },
    orderPrefix: { type: String, default: 'ORD' },
    enableReservations: { type: Boolean, default: true },
    enableQROrdering: { type: Boolean, default: true },
    lowStockThreshold: { type: Number, default: 10 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Settings', settingsSchema);
