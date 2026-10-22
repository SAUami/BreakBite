const mongoose = require('mongoose');

const groupCartItemSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    userName: { type: String, required: true },
    menuItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MenuItem',
      required: true,
    },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, default: 1, min: 1 },
    isVeg: { type: Boolean, default: true },
    prepTimeMinutes: { type: Number, default: 5 },
  },
  { _id: true }
);

const groupCartSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    title: {
      type: String,
      default: 'Squad Lunch Cart',
      trim: true,
    },
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    hostName: {
      type: String,
      required: true,
    },
    members: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        name: String,
        joinedAt: { type: Date, default: Date.now },
      },
    ],
    items: [groupCartItemSchema],
    status: {
      type: String,
      enum: ['open', 'locked', 'ordered'],
      default: 'open',
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
    },
    pickupSlot: {
      slotTime: String,
      slotLabel: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('GroupCart', groupCartSchema);
