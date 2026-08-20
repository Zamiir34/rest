const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema(
  {
    customerName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, lowercase: true, trim: true },
    guests: { type: Number, required: true, min: 1 },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    table: { type: mongoose.Schema.Types.ObjectId, ref: 'Table' },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'seated', 'completed', 'cancelled', 'no_show'],
      default: 'pending',
    },
    specialRequests: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Reservation', reservationSchema);
