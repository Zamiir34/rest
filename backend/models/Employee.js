const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    employeeId: { type: String, unique: true },
    department: { type: String },
    position: { type: String },
    salary: { type: Number, default: 0 },
    hireDate: { type: Date, default: Date.now },
    address: { type: String },
    emergencyContact: { type: String },
    attendance: [
      {
        date: { type: Date },
        checkIn: { type: String },
        checkOut: { type: String },
        status: {
          type: String,
          enum: ['present', 'absent', 'late', 'half_day'],
        },
      },
    ],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

employeeSchema.pre('save', async function (next) {
  if (!this.employeeId) {
    const count = await mongoose.model('Employee').countDocuments();
    this.employeeId = `EMP-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Employee', employeeSchema);
