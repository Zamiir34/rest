const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Restaurant name is required'],
      trim: true,
    },
    code: {
      type: String,
      unique: true,
      uppercase: true,
      trim: true,
    },
    slug: {
      type: String,
      lowercase: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      default: 'Mogadishu',
      trim: true,
    },
    logo: {
      type: String,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended'],
      default: 'active',
    },
    subscriptionPlan: {
      type: String,
      enum: ['free_trial', 'basic', 'pro', 'enterprise'],
      default: 'pro',
    },
    subscriptionExpiresAt: {
      type: Date,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    taxRate: {
      type: Number,
      default: 5,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    ownerName: {
      type: String,
      trim: true,
    },
    ownerEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    notes: {
      type: String,
    },
  },
  { timestamps: true }
);

restaurantSchema.pre('save', async function (next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }
  if (!this.code) {
    const count = await mongoose.model('Restaurant').countDocuments();
    this.code = `REST-${String(count + 1).padStart(3, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Restaurant', restaurantSchema);
