const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'], 
    required: true
  },
  discountValue: {
    type: Number,
    required: true,
    min: 0 
  },
  applicableTo: {
    type: String,
    enum: ['product', 'brand', 'category', 'all'],
    default: 'all'
  },
  products: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  categories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  minPurchaseAmount: {
    type: Number,
    default: 0 
  },
  maxLimit: {
    type: Number,
    default: 1
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('offer', offerSchema);
