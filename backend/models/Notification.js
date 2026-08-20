const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ['order', 'payment', 'reservation', 'inventory', 'system'],
      default: 'system',
    },
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    recipientRole: { type: String },
    relatedId: { type: mongoose.Schema.Types.ObjectId },
    relatedModel: { type: String },
    isRead: { type: Boolean, default: false },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
