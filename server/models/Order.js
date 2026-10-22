const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    menuItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MenuItem',
      required: true,
    },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    isVeg: { type: Boolean, default: true },
    prepTimeMinutes: { type: Number, default: 5 },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    items: [orderItemSchema],
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    convenienceFee: {
      type: Number,
      default: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['Placed', 'Preparing', 'Ready', 'Collected', 'Cancelled'],
      default: 'Placed',
      index: true,
    },
    pickupMode: {
      type: String,
      enum: ['asap', 'bell_sync'],
      default: 'asap',
    },
    pickupSlot: {
      slotTime: { type: String }, // e.g. "13:10" or ISO String
      slotLabel: { type: String }, // e.g. "1:10 PM (Lecture 3 End)"
    },
    scheduledPickupTime: {
      type: Date,
      required: true,
    },
    fireTime: {
      type: Date,
      required: true,
    },
    estimatedReadyTime: {
      type: Date,
      required: true,
    },
    leaveNowTime: {
      type: Date,
      required: true,
    },
    walkingMinutes: {
      type: Number,
      default: 4,
    },
    specialInstructions: {
      type: String,
      default: '',
    },
    pickupToken: {
      type: String,
      required: true,
    },
    qrCodeValue: {
      type: String,
      required: true,
    },
    isGroupOrder: {
      type: Boolean,
      default: false,
    },
    groupCartId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GroupCart',
    },
    statusHistory: [
      {
        status: String,
        timestamp: { type: Date, default: Date.now },
        note: String,
      },
    ],
  },
  { timestamps: true }
);

// High-concurrency performance indexes for rush hour query scaling
orderSchema.index({ scheduledPickupTime: 1, status: 1 });
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ fireTime: 1, status: 1 });
orderSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);
