const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: 0,
    },
    category: {
      type: String,
      required: true,
      enum: ['Snacks', 'Beverages', 'Meals', 'Quick Bites', 'Desserts', 'Specials'],
      default: 'Snacks',
    },
    image: {
      type: String,
      default: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80',
    },
    isVeg: {
      type: Boolean,
      default: true,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    prepTimeMinutes: {
      type: Number,
      required: true,
      default: 5,
      min: 1,
    },
    rating: {
      type: Number,
      default: 4.6,
      min: 1,
      max: 5,
    },
    tags: [
      {
        type: String,
      },
    ],
    isPopular: {
      type: Boolean,
      default: false,
    },
    orderCountToday: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('MenuItem', menuItemSchema);
