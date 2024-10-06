const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    promotional_price: {
        type: Number,
        required: true,
        min: 0
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'categories',
        required: true
    },
    brand: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'brands', 
        required: true
    },
    stock: {
        type: Number,
        required: true,
        min: 0
    },
    images: {
        type: [String], 
        required: true
    },
    ratings: {
      type: Number,
      default: 0,
    },
    highlights: {
        type: [String],
        required: true,
    },
    is_Active: {
    type: Boolean,
    required: true,
    default: false,
  },
});

module.exports = mongoose.model('Product', productSchema);

